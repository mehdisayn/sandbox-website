// Pure artifact helpers. CRUD lives in DexieArtifactRepo; these are
// platform-agnostic functions.

import type { FileKind } from './repo/types';

export function inferKind(filename: string): FileKind {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  return 'jsx';
}

export function inferName(filename: string): string {
  const base = filename.split('/').pop() ?? filename;
  return base.replace(/\.(jsx|tsx|js|ts|html|htm)$/i, '');
}

export function displayFilename(name: string, kind: FileKind): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'artifact';
  return `${slug}-sandbox.${kind}`;
}

export function sizeBytes(source: string): number {
  return new Blob([source]).size;
}
