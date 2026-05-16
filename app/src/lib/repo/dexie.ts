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

export class SandboxDB extends Dexie {
  artifacts!: EntityTable<Artifact, 'id'>;
  dependencies!: EntityTable<Dependency, 'id'>;
  artifactDeps!: EntityTable<ArtifactDepRow, never>;
  prefs!: EntityTable<PrefRow, 'key'>;
  icons!: EntityTable<IconRow, 'id'>;

  constructor() {
    super('sandbox-web');
    this.version(1).stores({
      artifacts:    'id, name, fileKind, createdAt, lastOpened',
      dependencies: 'id, name, downloadedAt',
      artifactDeps: '[artifactId+dependencyId], artifactId, dependencyId',
      prefs:        'key',
      icons:        'id',
    });

    // Seed the sample artifact on first run. Dexie fires `populate` exactly
    // once when a fresh DB is created — never on schema upgrade.
    this.on('populate', (tx) => {
      tx.table('artifacts').add(SAMPLE_ARTIFACT);
    });
  }
}

export const db = new SandboxDB();
