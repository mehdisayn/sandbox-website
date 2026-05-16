// Dexie-backed implementations of the repository interfaces.
// Phase 1 only exercises the in-memory sample artifact — these are stubs that
// pass through to Dexie so the API shape is correct for Phase 2.

import { db } from './dexie';
import type {
  Artifact,
  ArtifactRepo,
  Dependency,
  DependencyRepo,
  IconType,
  PrefsRepo,
} from './types';

export class DexieArtifactRepo implements ArtifactRepo {
  async list(): Promise<Artifact[]> {
    // Most-recently-opened first, with never-opened artifacts ranked by
    // createdAt. Native used SQLite's COALESCE(last_opened, created_at) DESC.
    const rows = await db.artifacts.toArray();
    rows.sort((a, b) => (b.lastOpened ?? b.createdAt) - (a.lastOpened ?? a.createdAt));
    return rows;
  }
  async get(id: string): Promise<Artifact | null> {
    return (await db.artifacts.get(id)) ?? null;
  }
  async create(input: Omit<Artifact, 'id' | 'createdAt' | 'lastOpened'>): Promise<Artifact> {
    const row: Artifact = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastOpened: null,
    };
    await db.artifacts.add(row);
    return row;
  }
  async updateSource(id: string, source: string): Promise<void> {
    await db.artifacts.update(id, { source, sizeBytes: source.length });
  }
  async rename(id: string, name: string): Promise<void> {
    await db.artifacts.update(id, { name });
  }
  async updateIcon(id: string, iconType: IconType, iconValue: string, iconFill: string | null): Promise<void> {
    await db.artifacts.update(id, { iconType, iconValue, iconFill });
  }
  async touch(id: string): Promise<void> {
    await db.artifacts.update(id, { lastOpened: Date.now() });
  }
  async delete(id: string): Promise<void> {
    await db.artifacts.delete(id);
  }
}

export class DexieDependencyRepo implements DependencyRepo {
  async ensure(name: string, version: string, source: string): Promise<Dependency> {
    const existing = await db.dependencies.where('name').equals(name).first();
    if (existing) return existing;
    const row: Dependency = {
      id: crypto.randomUUID(),
      name,
      version,
      source,
      sizeBytes: source.length,
      downloadedAt: Date.now(),
    };
    await db.dependencies.add(row);
    return row;
  }
  async linkToArtifact(artifactId: string, dependencyId: string): Promise<void> {
    await db.artifactDeps.put({ artifactId, dependencyId });
  }
  async loadForArtifact(artifactId: string): Promise<Dependency[]> {
    const links = await db.artifactDeps.where('artifactId').equals(artifactId).toArray();
    if (!links.length) return [];
    return db.dependencies.bulkGet(links.map((l) => l.dependencyId)).then((rows) =>
      rows.filter((r): r is Dependency => r != null)
    );
  }
  async list(): Promise<Dependency[]> {
    return db.dependencies.toArray();
  }
  async delete(id: string): Promise<void> {
    await db.dependencies.delete(id);
  }
}

export class DexiePrefsRepo implements PrefsRepo {
  async get<T = string>(key: string): Promise<T | null> {
    const row = await db.prefs.get(key);
    return row ? (row.value as T) : null;
  }
  async set<T = string>(key: string, value: T): Promise<void> {
    await db.prefs.put({ key, value });
  }
}

export const artifactRepo: ArtifactRepo = new DexieArtifactRepo();
export const dependencyRepo: DependencyRepo = new DexieDependencyRepo();
export const prefsRepo: PrefsRepo = new DexiePrefsRepo();
