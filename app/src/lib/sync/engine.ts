// Sync engine — drains the syncQueue, dispatches each op against Drive, and
// keeps the manifest current. Failures back off; the manifest's optimistic
// concurrency (If-Match etag) triggers a single refetch + retry.

import { db } from '../repo/dexie';
import {
  artifactFilename,
  emptyManifest,
  getDeviceId,
  loadManifest,
  loadTombstones,
  saveManifest,
  saveTombstones,
  sha256Hex,
  type Loaded,
  type Manifest,
  type ManifestArtifactEntry,
  type Tombstone,
} from '../cloud/manifest';
import {
  createJsonFile,
  deleteFile,
  updateJsonFile,
  PreconditionFailedError,
} from '../cloud/drive-client';
import { backoffMs, complete, depth, onQueueChange, peek, recordFailure } from './queue';
import { PREF_KEYS } from '../prefs';
import type { Artifact } from '../repo/types';

export type EngineState =
  | { kind: 'idle'; queueDepth: number }
  | { kind: 'running'; queueDepth: number }
  | { kind: 'offline'; queueDepth: number }
  | { kind: 'paused'; queueDepth: number; reason: string }
  | { kind: 'error'; queueDepth: number; error: string };

let state: EngineState = { kind: 'idle', queueDepth: 0 };
let listeners = new Set<(s: EngineState) => void>();
let started = false;
let timer: number | null = null;
let online = typeof navigator === 'undefined' ? true : navigator.onLine;

function setState(next: EngineState) {
  state = next;
  for (const fn of listeners) try { fn(next); } catch { /* ignore */ }
}

export function getState(): EngineState { return state; }
export function onStateChange(fn: (s: EngineState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => { listeners.delete(fn); };
}

export function startEngine(): void {
  if (started) return;
  started = true;
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { online = true; tick(); });
    window.addEventListener('offline', () => { online = false; setState({ kind: 'offline', queueDepth: state.queueDepth }); });
  }
  onQueueChange(tick);
  void tick();
}

export function stopEngine(): void {
  started = false;
  if (timer !== null) { clearTimeout(timer); timer = null; }
  setState({ kind: 'idle', queueDepth: 0 });
}

async function tick(): Promise<void> {
  if (!started) return;
  if (timer !== null) { clearTimeout(timer); timer = null; }
  if (!online) {
    setState({ kind: 'offline', queueDepth: await depth() });
    return;
  }
  const head = await peek();
  const d = await depth();
  if (!head) {
    setState({ kind: 'idle', queueDepth: 0 });
    return;
  }
  setState({ kind: 'running', queueDepth: d });
  try {
    await dispatch(head.op, head.key, head.payload);
    await complete(head.id);
    setState({ kind: 'running', queueDepth: await depth() });
    // Drain the rest with a microtask break so we don't peg the loop.
    setTimeout(tick, 0);
  } catch (err) {
    const msg = (err as Error).message || 'unknown';
    const attempts = await recordFailure(head.id, msg);
    setState({ kind: 'error', queueDepth: await depth(), error: msg });
    const delay = backoffMs(attempts);
    timer = window.setTimeout(tick, delay);
  }
}

// Op dispatch -------------------------------------------------------------

async function dispatch(op: string, key: string, payload: unknown): Promise<void> {
  if (op === 'artifact.put') return dispatchArtifactPut(key);
  if (op === 'artifact.delete') return dispatchArtifactDelete(key, payload as { driveFileId?: string });
  if (op === 'prefs.put') return dispatchPrefsPut();
  throw new Error(`unknown op: ${op}`);
}

async function withManifest<T>(fn: (loaded: Loaded<Manifest>, deviceId: string) => Promise<T>, retriesLeft = 2): Promise<T> {
  const deviceId = await getDeviceId();
  let loaded = await loadManifest();
  if (!loaded) {
    // Bootstrap.
    loaded = await saveManifest(null, emptyManifest(deviceId), deviceId);
  }
  try {
    return await fn(loaded, deviceId);
  } catch (err) {
    if (err instanceof PreconditionFailedError && retriesLeft > 0) {
      return withManifest(fn, retriesLeft - 1);
    }
    throw err;
  }
}

async function dispatchArtifactPut(artifactId: string): Promise<void> {
  const live = await db.artifacts.get(artifactId);
  if (!live) {
    // Artifact was deleted before we got here — convert into a delete dispatch.
    return dispatchArtifactDelete(artifactId, {});
  }
  const contentHash = await sha256Hex(live.source);

  await withManifest(async (loaded, deviceId) => {
    const manifest = { ...loaded.data };
    const existing = manifest.artifacts.find((a) => a.id === artifactId);
    const fileJson = serializeArtifact(live);

    let driveFileId: string;
    if (existing && existing.driveFileId) {
      await updateJsonFile(existing.driveFileId, fileJson);
      driveFileId = existing.driveFileId;
    } else {
      const created = await createJsonFile(artifactFilename(artifactId), fileJson);
      driveFileId = created.id;
    }

    const entry: ManifestArtifactEntry = {
      id: live.id,
      driveFileId,
      name: live.name,
      iconType: live.iconType,
      iconValue: live.iconValue,
      iconFill: live.iconFill,
      fileKind: live.fileKind,
      sizeBytes: live.sizeBytes,
      createdAt: live.createdAt,
      rev: (existing?.rev ?? 0) + 1,
      contentHash,
    };

    manifest.artifacts = existing
      ? manifest.artifacts.map((a) => (a.id === artifactId ? entry : a))
      : [...manifest.artifacts, entry];

    await saveManifest(loaded, manifest, deviceId);
  });
}

async function dispatchArtifactDelete(artifactId: string, payload: { driveFileId?: string }): Promise<void> {
  await withManifest(async (loaded, deviceId) => {
    const manifest = { ...loaded.data };
    const existing = manifest.artifacts.find((a) => a.id === artifactId);
    const driveFileId = payload.driveFileId ?? existing?.driveFileId;
    if (driveFileId) {
      try { await deleteFile(driveFileId); } catch { /* may already be gone */ }
    }
    manifest.artifacts = manifest.artifacts.filter((a) => a.id !== artifactId);
    await saveManifest(loaded, manifest, deviceId);
  });

  // Add to tombstones so other devices will mirror the delete.
  const ts = await loadTombstones();
  const next: Tombstone[] = [...(ts?.data ?? []), { id: artifactId, deletedAt: Date.now() }];
  await saveTombstones(ts, next);
}

async function dispatchPrefsPut(): Promise<void> {
  // Snapshot the syncable subset of prefs and overwrite prefs.json.
  // We deliberately whitelist — local-only prefs (device_id, google_user, etc.) stay out.
  const { prefsRepo } = await import('../repo/active');
  const SYNCABLE_KEYS = [PREF_KEYS.theme, PREF_KEYS.accent, PREF_KEYS.allowNetwork] as const;
  const snapshot: Record<string, unknown> = {};
  for (const k of SYNCABLE_KEYS) {
    const v = await prefsRepo.get<unknown>(k);
    if (v !== null && v !== undefined) snapshot[k] = v;
  }
  const { findFileByName, downloadFile } = await import('../cloud/drive-client');
  const existing = await findFileByName('prefs.json');
  if (!existing) {
    await createJsonFile('prefs.json', snapshot);
    return;
  }
  // Tiny optimization — skip the write if the body is identical.
  const { etag, body } = await downloadFile(existing.id);
  try {
    const old = JSON.parse(body);
    if (JSON.stringify(old) === JSON.stringify(snapshot)) return;
  } catch { /* fall through */ }
  await updateJsonFile(existing.id, snapshot, etag);
}

function serializeArtifact(a: Artifact): unknown {
  return {
    id: a.id,
    name: a.name,
    iconType: a.iconType,
    iconValue: a.iconValue,
    iconFill: a.iconFill,
    fileKind: a.fileKind,
    source: a.source,
    sizeBytes: a.sizeBytes,
    createdAt: a.createdAt,
  };
}
