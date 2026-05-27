// Pull-and-merge from Drive. Called on sign-in success and on `window.online`.
// Diffs the remote manifest against Dexie by (id, rev) and pulls/pushes/deletes
// as needed. Per plan §5.3.

import { db } from '../repo/dexie';
import { loadManifest, loadTombstones, sha256Hex } from '../cloud/manifest';
import { downloadFile } from '../cloud/drive-client';
import { enqueue } from './queue';
import type { Artifact } from '../repo/types';
import type { ManifestArtifactEntry } from '../cloud/manifest';

export type ReconcileSummary = {
  pulled: number;
  pushed: number;
  deletedLocally: number;
};

export async function reconcile(): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { pulled: 0, pushed: 0, deletedLocally: 0 };

  // 1. Apply tombstones (remote deletes) before doing anything else, so we
  //    don't re-push a locally-present artifact that another device deleted.
  const tombstones = await loadTombstones();
  if (tombstones?.data?.length) {
    for (const ts of tombstones.data) {
      const localCopy = await db.artifacts.get(ts.id);
      if (localCopy) {
        await db.artifacts.delete(ts.id);
        await db.artifactDeps.where('artifactId').equals(ts.id).delete();
        summary.deletedLocally += 1;
      }
    }
  }
  const tombstonedIds = new Set((tombstones?.data ?? []).map((t) => t.id));

  // 2. Fetch manifest.
  const loaded = await loadManifest();
  if (!loaded) return summary; // Fresh remote — nothing to pull. Push happens via queue separately.

  const remoteById = new Map<string, ManifestArtifactEntry>();
  for (const e of loaded.data.artifacts) remoteById.set(e.id, e);

  // 3. Diff and reconcile artifact by artifact.
  const localList = await db.artifacts.toArray();
  const localById = new Map<string, Artifact>(localList.map((a) => [a.id, a]));

  // Remote-only → pull (full content).
  for (const [id, remote] of remoteById) {
    const local = localById.get(id);
    if (!local) {
      const { body } = await downloadFile(remote.driveFileId);
      const parsed = JSON.parse(body) as Partial<Artifact>;
      const row: Artifact = {
        id: remote.id,
        name: parsed.name ?? remote.name,
        iconType: (parsed.iconType ?? remote.iconType) as Artifact['iconType'],
        iconValue: parsed.iconValue ?? remote.iconValue,
        iconFill: parsed.iconFill ?? remote.iconFill,
        fileKind: (parsed.fileKind ?? remote.fileKind) as Artifact['fileKind'],
        source: parsed.source ?? '',
        sizeBytes: parsed.sizeBytes ?? remote.sizeBytes,
        createdAt: parsed.createdAt ?? remote.createdAt,
        lastOpened: null,
      };
      await db.artifacts.put(row);
      summary.pulled += 1;
      continue;
    }

    // Both present — check content. We don't track rev locally yet (Phase B
    // simplification), so compare contentHash: if differs, the remote is
    // authoritative on first reconcile.
    const localHash = await sha256Hex(local.source);
    if (localHash !== remote.contentHash) {
      const { body } = await downloadFile(remote.driveFileId);
      const parsed = JSON.parse(body) as Partial<Artifact>;
      const row: Artifact = {
        ...local,
        name: parsed.name ?? remote.name,
        iconType: (parsed.iconType ?? remote.iconType) as Artifact['iconType'],
        iconValue: parsed.iconValue ?? remote.iconValue,
        iconFill: parsed.iconFill ?? remote.iconFill,
        source: parsed.source ?? local.source,
        sizeBytes: parsed.sizeBytes ?? remote.sizeBytes,
      };
      await db.artifacts.put(row);
      summary.pulled += 1;
    }
  }

  // Local-only and not tombstoned → enqueue push.
  for (const local of localList) {
    if (remoteById.has(local.id)) continue;
    if (tombstonedIds.has(local.id)) continue;
    await enqueue({ op: 'artifact.put', key: local.id, payload: { id: local.id } });
    summary.pushed += 1;
  }

  return summary;
}
