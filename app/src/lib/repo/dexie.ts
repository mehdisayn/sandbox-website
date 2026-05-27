// Dexie schema declaration. Shape kept identical to the future server schema
// so accounts/sync is a data copy, not a reshape.

import Dexie, { type EntityTable } from 'dexie';
import { SAMPLE_ARTIFACT } from '../sample-artifact';
import type { Artifact, Dependency } from './types';

export type ArtifactDepRow = {
  artifactId: string;
  dependencyId: string;
};

export type PrefRow = { key: string; value: unknown };
export type IconRow = { id: string; blob: Blob };

// Pending write to the cloud backing store. Persisted so a closed tab can
// resume mid-flight. `payload` is the snapshot at enqueue time; coalescing by
// `(op, key)` happens in the queue runner, not here.
export type SyncQueueRow = {
  id: string;             // crypto.randomUUID()
  op: 'artifact.put' | 'artifact.delete' | 'prefs.put';
  key: string;            // artifactId or pref key — used for coalescing
  payload: unknown;
  attemptCount: number;
  lastError: string | null;
  enqueuedAt: number;
};

export class SandboxDB extends Dexie {
  artifacts!: EntityTable<Artifact, 'id'>;
  dependencies!: EntityTable<Dependency, 'id'>;
  artifactDeps!: EntityTable<ArtifactDepRow, never>;
  prefs!: EntityTable<PrefRow, 'key'>;
  icons!: EntityTable<IconRow, 'id'>;
  syncQueue!: EntityTable<SyncQueueRow, 'id'>;

  constructor() {
    super('sandbox-web');
    this.version(1).stores({
      artifacts:    'id, name, fileKind, createdAt, lastOpened',
      dependencies: 'id, name, downloadedAt',
      artifactDeps: '[artifactId+dependencyId], artifactId, dependencyId',
      prefs:        'key',
      icons:        'id',
    });
    // v2 — add the sync queue. Existing rows are untouched; only the new
    // table is created. Dexie runs no data migration for additive schemas.
    this.version(2).stores({
      syncQueue:    'id, op, key, enqueuedAt',
    });

    // Seed the sample artifact on first run. Dexie fires `populate` exactly
    // once when a fresh DB is created — never on schema upgrade.
    this.on('populate', (tx) => {
      tx.table('artifacts').add(SAMPLE_ARTIFACT);
    });
  }
}

export const db = new SandboxDB();
