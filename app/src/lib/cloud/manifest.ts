// Manifest is the library index in Drive — a single JSON file that lists
// every artifact's id, name, icon, rev, contentHash. Lets the app render the
// library without N round-trips. See plan §4.

import { createJsonFile, downloadFile, findFileByName, updateJsonFile, PreconditionFailedError } from './drive-client';

export const MANIFEST_NAME = 'manifest.json';
export const PREFS_NAME = 'prefs.json';
export const TOMBSTONES_NAME = 'tombstones.json';
export const ARTIFACT_NAME_PREFIX = 'artifact-';
export const ARTIFACT_NAME_SUFFIX = '.json';
export const SCHEMA_VERSION = 1;

export type ManifestArtifactEntry = {
  id: string;
  driveFileId: string;
  name: string;
  iconType: string;
  iconValue: string;
  iconFill: string | null;
  fileKind: 'jsx' | 'html';
  sizeBytes: number;
  createdAt: number;
  rev: number;            // monotonic per-artifact
  contentHash: string;    // sha-256 hex of source
};

export type Manifest = {
  schemaVersion: number;
  appVersion: string;
  deviceLastWriter: string;
  updatedAt: number;
  artifacts: ManifestArtifactEntry[];
};

export type Tombstone = { id: string; deletedAt: number };

export type Loaded<T> = { data: T; driveFileId: string; etag: string | null };

const APP_VERSION = '1.1.0';

export function emptyManifest(deviceId: string): Manifest {
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion: APP_VERSION,
    deviceLastWriter: deviceId,
    updatedAt: Date.now(),
    artifacts: [],
  };
}

export async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function loadJsonFile<T>(name: string): Promise<Loaded<T> | null> {
  const f = await findFileByName(name);
  if (!f) return null;
  const { etag, body } = await downloadFile(f.id);
  return { data: JSON.parse(body) as T, driveFileId: f.id, etag };
}

export async function loadManifest(): Promise<Loaded<Manifest> | null> {
  return loadJsonFile<Manifest>(MANIFEST_NAME);
}

export async function saveManifest(loaded: Loaded<Manifest> | null, next: Manifest, deviceId: string): Promise<Loaded<Manifest>> {
  next.deviceLastWriter = deviceId;
  next.updatedAt = Date.now();
  if (!loaded) {
    const file = await createJsonFile(MANIFEST_NAME, next);
    return { data: next, driveFileId: file.id, etag: file.etag };
  }
  try {
    const file = await updateJsonFile(loaded.driveFileId, next, loaded.etag);
    return { data: next, driveFileId: file.id, etag: file.etag };
  } catch (err) {
    if (err instanceof PreconditionFailedError) {
      // Caller should refetch, re-diff, and retry.
      throw err;
    }
    throw err;
  }
}

export async function loadTombstones(): Promise<Loaded<Tombstone[]> | null> {
  return loadJsonFile<Tombstone[]>(TOMBSTONES_NAME);
}

export async function saveTombstones(loaded: Loaded<Tombstone[]> | null, next: Tombstone[]): Promise<Loaded<Tombstone[]>> {
  if (!loaded) {
    const file = await createJsonFile(TOMBSTONES_NAME, next);
    return { data: next, driveFileId: file.id, etag: file.etag };
  }
  const file = await updateJsonFile(loaded.driveFileId, next, loaded.etag);
  return { data: next, driveFileId: file.id, etag: file.etag };
}

export function artifactFilename(id: string): string {
  return `${ARTIFACT_NAME_PREFIX}${id}${ARTIFACT_NAME_SUFFIX}`;
}

// A random per-install id used as `deviceLastWriter` so a manifest write tells
// you which device last touched it. Stored in prefs (local, never synced).
let cachedDeviceId: string | null = null;
const DEVICE_ID_KEY = 'device_id';

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  // Avoid a circular import — read prefsRepo lazily.
  const { prefsRepo } = await import('../repo/active');
  const existing = await prefsRepo.get<string>(DEVICE_ID_KEY);
  if (existing) {
    cachedDeviceId = existing;
    return existing;
  }
  const next = crypto.randomUUID();
  await prefsRepo.set(DEVICE_ID_KEY, next);
  cachedDeviceId = next;
  return next;
}
