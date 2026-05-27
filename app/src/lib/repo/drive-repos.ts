// Drive-backed wrappers. Reads serve from Dexie cache (fast, offline-OK);
// writes are committed to Dexie immediately and enqueued to Drive in the
// background via sync/queue. Reconcile keeps Dexie in sync with the manifest.
//
// These keep the ArtifactRepo / PrefsRepo contracts exactly — they're meant
// to be dropped into `active.ts` via setActive*Repo on sign-in.

import { DexieArtifactRepo, DexiePrefsRepo } from './dexie-repos';
import { enqueue } from '../sync/queue';
import type { Artifact, ArtifactRepo, IconType, PrefsRepo } from './types';
import { PREF_KEYS } from '../prefs';

const SYNCABLE_PREFS = new Set<string>([PREF_KEYS.theme, PREF_KEYS.accent, PREF_KEYS.allowNetwork]);

export class DriveArtifactRepo implements ArtifactRepo {
  constructor(private readonly cache: DexieArtifactRepo) {}

  list(): Promise<Artifact[]> { return this.cache.list(); }
  get(id: string): Promise<Artifact | null> { return this.cache.get(id); }

  async create(input: Omit<Artifact, 'id' | 'createdAt' | 'lastOpened'>): Promise<Artifact> {
    const created = await this.cache.create(input);
    await enqueue({ op: 'artifact.put', key: created.id, payload: { id: created.id } });
    return created;
  }
  async updateSource(id: string, source: string): Promise<void> {
    await this.cache.updateSource(id, source);
    await enqueue({ op: 'artifact.put', key: id, payload: { id } });
  }
  async rename(id: string, name: string): Promise<void> {
    await this.cache.rename(id, name);
    await enqueue({ op: 'artifact.put', key: id, payload: { id } });
  }
  async updateIcon(id: string, iconType: IconType, iconValue: string, iconFill: string | null): Promise<void> {
    await this.cache.updateIcon(id, iconType, iconValue, iconFill);
    await enqueue({ op: 'artifact.put', key: id, payload: { id } });
  }
  async touch(id: string): Promise<void> {
    // lastOpened is device-local per plan §3 (Decisions table). Don't sync.
    await this.cache.touch(id);
  }
  async delete(id: string): Promise<void> {
    await this.cache.delete(id);
    await enqueue({ op: 'artifact.delete', key: id, payload: {} });
  }
}

export class DrivePrefsRepo implements PrefsRepo {
  constructor(private readonly cache: DexiePrefsRepo) {}

  get<T = string>(key: string): Promise<T | null> { return this.cache.get<T>(key); }

  async set<T = string>(key: string, value: T): Promise<void> {
    await this.cache.set(key, value);
    if (SYNCABLE_PREFS.has(key)) {
      // prefs.json is a single document — coalesce by a fixed key.
      await enqueue({ op: 'prefs.put', key: 'prefs', payload: {} });
    }
  }
}
