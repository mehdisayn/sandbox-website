// Repository facade — stable singleton identity over a swappable implementation.
// All UI / runtime callers import from here so the active backing store
// (Dexie now, Drive-backed wrapper later) can be hot-swapped on sign-in/out
// without React effect refs breaking.
//
// The exported objects are method delegates over mutable `current*` bindings.
// Consumers see one stable object reference for the life of the page.

import {
  artifactRepo as dexieArtifactRepo,
  dependencyRepo as dexieDependencyRepo,
  prefsRepo as dexiePrefsRepo,
} from './dexie-repos';
import type { ArtifactRepo, DependencyRepo, PrefsRepo } from './types';

let currentArtifactRepo: ArtifactRepo = dexieArtifactRepo;
let currentDependencyRepo: DependencyRepo = dexieDependencyRepo;
let currentPrefsRepo: PrefsRepo = dexiePrefsRepo;

export const artifactRepo: ArtifactRepo = {
  list: () => currentArtifactRepo.list(),
  get: (id) => currentArtifactRepo.get(id),
  create: (input) => currentArtifactRepo.create(input),
  updateSource: (id, source) => currentArtifactRepo.updateSource(id, source),
  rename: (id, name) => currentArtifactRepo.rename(id, name),
  updateIcon: (id, iconType, iconValue, iconFill) =>
    currentArtifactRepo.updateIcon(id, iconType, iconValue, iconFill),
  touch: (id) => currentArtifactRepo.touch(id),
  delete: (id) => currentArtifactRepo.delete(id),
};

export const dependencyRepo: DependencyRepo = {
  ensure: (name, version, source) => currentDependencyRepo.ensure(name, version, source),
  linkToArtifact: (artifactId, dependencyId) =>
    currentDependencyRepo.linkToArtifact(artifactId, dependencyId),
  loadForArtifact: (artifactId) => currentDependencyRepo.loadForArtifact(artifactId),
  list: () => currentDependencyRepo.list(),
  delete: (id) => currentDependencyRepo.delete(id),
};

export const prefsRepo: PrefsRepo = {
  get: <T = string>(key: string) => currentPrefsRepo.get<T>(key),
  set: <T = string>(key: string, value: T) => currentPrefsRepo.set<T>(key, value),
};

export function setActiveArtifactRepo(next: ArtifactRepo): void { currentArtifactRepo = next; }
export function setActiveDependencyRepo(next: DependencyRepo): void { currentDependencyRepo = next; }
export function setActivePrefsRepo(next: PrefsRepo): void { currentPrefsRepo = next; }
