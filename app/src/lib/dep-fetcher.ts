// Dependency resolver. Persistence is via DependencyRepo (Dexie).
// CDN allowlist is enforced both by URL construction and by host check.

import { dependencyRepo } from './repo/active';
import { getNetworkPref } from './prefs';
import type { CachedDependency } from '../shared/protocol';

export const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'cdnjs.cloudflare.com',
] as const;

function bareName(spec: string): string {
  if (spec.startsWith('@')) {
    const parts = spec.split('/');
    return parts[1] ?? parts[0];
  }
  return spec.split('/')[0];
}

function candidateUrls(spec: string): string[] {
  const bare = bareName(spec);
  return [
    `https://cdn.jsdelivr.net/npm/${spec}/dist/${bare}.min.js`,
    `https://cdn.jsdelivr.net/npm/${spec}/dist/${bare}.umd.min.js`,
    `https://cdn.jsdelivr.net/npm/${spec}/dist/umd/${bare}.min.js`,
    `https://unpkg.com/${spec}`,
    `https://cdnjs.cloudflare.com/ajax/libs/${bare}/latest/${bare}.min.js`,
  ];
}

function isJavaScript(body: string): boolean {
  if (!body || body.length < 50) return false;
  const head = body.slice(0, 200).toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html')) return false;
  if (head.startsWith('{') && head.includes('"name"')) return false;
  return true;
}

function isAllowlistedHost(url: string): boolean {
  try {
    const host = new URL(url).host;
    return (CDN_HOSTS as readonly string[]).includes(host);
  } catch {
    return false;
  }
}

async function fetchFirstWorking(urls: string[]): Promise<{ url: string; body: string } | null> {
  for (const url of urls) {
    if (!isAllowlistedHost(url)) continue;
    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) continue;
      const body = await res.text();
      if (isJavaScript(body)) return { url, body };
    } catch {
      // try next
    }
  }
  return null;
}

export type EnsureResult =
  | { ok: true; id: string; name: string; source: string; fromCache: boolean }
  | { ok: false; name: string; error: string };

export async function ensureDependency(spec: string): Promise<EnsureResult> {
  // Cache hit first — DependencyRepo.ensure is idempotent on `name`.
  const cached = await dependencyRepo.list().then((rows) => rows.find((r) => r.name === spec));
  if (cached) return { ok: true, id: cached.id, name: cached.name, source: cached.source, fromCache: true };

  const fetched = await fetchFirstWorking(candidateUrls(spec));
  if (!fetched) return { ok: false, name: spec, error: 'No reachable CDN copy found' };

  const row = await dependencyRepo.ensure(spec, 'latest', fetched.body);
  return { ok: true, id: row.id, name: row.name, source: row.source, fromCache: false };
}

export type EnsureSummary = {
  ok: { name: string; id: string; fromCache: boolean }[];
  failed: { name: string; error: string }[];
};

export async function ensureArtifactDeps(
  artifactId: string,
  specs: string[]
): Promise<EnsureSummary> {
  const ok: EnsureSummary['ok'] = [];
  const failed: EnsureSummary['failed'] = [];

  if (specs.length === 0) return { ok, failed };

  if ((await getNetworkPref()) === 'off') {
    return {
      ok,
      failed: specs.map((spec) => ({ name: spec, error: 'network blocked by Settings' })),
    };
  }

  for (const spec of specs) {
    const result = await ensureDependency(spec);
    if (result.ok) {
      await dependencyRepo.linkToArtifact(artifactId, result.id);
      ok.push({ name: result.name, id: result.id, fromCache: result.fromCache });
    } else {
      failed.push({ name: result.name, error: result.error });
    }
  }
  return { ok, failed };
}

export async function loadDependenciesForArtifact(artifactId: string): Promise<CachedDependency[]> {
  const rows = await dependencyRepo.loadForArtifact(artifactId);
  return rows.map((r) => ({ name: r.name, source: r.source }));
}
