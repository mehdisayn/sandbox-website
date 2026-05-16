// Repository interface contract per ARCHITECTURE.md §4.3.
// The UI and the runtime NEVER import Dexie directly — they go through these.
// v1 ships Dexie implementations; v2 with accounts/sync swaps in Api*Repo
// implementations without touching callers.

export type IconType = 'emoji' | 'glyph' | 'image';
export type FileKind = 'jsx' | 'html';

export type Artifact = {
  id: string;
  name: string;
  iconType: IconType;
  iconValue: string;
  iconFill: string | null;
  fileKind: FileKind;
  source: string;
  sizeBytes: number;
  createdAt: number;
  lastOpened: number | null;
};

export type Dependency = {
  id: string;
  name: string;
  version: string;
  source: string;
  sizeBytes: number;
  downloadedAt: number;
};

export interface ArtifactRepo {
  list(): Promise<Artifact[]>;
  get(id: string): Promise<Artifact | null>;
  create(input: Omit<Artifact, 'id' | 'createdAt' | 'lastOpened'>): Promise<Artifact>;
  updateSource(id: string, source: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  updateIcon(id: string, iconType: IconType, iconValue: string, iconFill: string | null): Promise<void>;
  touch(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface DependencyRepo {
  ensure(name: string, version: string, source: string): Promise<Dependency>;
  linkToArtifact(artifactId: string, dependencyId: string): Promise<void>;
  loadForArtifact(artifactId: string): Promise<Dependency[]>;
  list(): Promise<Dependency[]>;
  delete(id: string): Promise<void>;
}

export interface PrefsRepo {
  get<T = string>(key: string): Promise<T | null>;
  set<T = string>(key: string, value: T): Promise<void>;
}
