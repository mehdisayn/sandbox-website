import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArtifactRunner } from '../components/ArtifactRunner';
import { AppIcon } from '../components/ui/AppIcon';
import { artifactRepo } from '../lib/repo/dexie-repos';
import { loadDependenciesForArtifact } from '../lib/dep-fetcher';
import type { CachedDependency } from '../shared/protocol';
import type { Artifact } from '../lib/repo/types';

export function Run() {
  const { id = '' } = useParams<{ id: string }>();
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [deps, setDeps] = useState<CachedDependency[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const a = await artifactRepo.get(id);
      if (cancelled) return;
      if (!a) { setNotFound(true); return; }
      setArtifact(a);
      artifactRepo.touch(a.id).catch(() => {});
      const loaded = await loadDependenciesForArtifact(a.id);
      if (!cancelled) setDeps(loaded);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Not found</div>
          <Link to="/library" className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">← back to library</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-divider px-4 py-3 flex items-center gap-3 shrink-0">
        {artifact ? (
          <>
            <AppIcon size={28} iconType={artifact.iconType} iconValue={artifact.iconValue} iconFill={artifact.iconFill} />
            <div className="flex-1 text-sm font-medium">{artifact.name}</div>
          </>
        ) : (
          <div className="flex-1 font-mono text-xs uppercase tracking-widest text-ink-soft">loading…</div>
        )}
        <Link to="/library" className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">close</Link>
      </header>
      <div className="flex-1 min-h-0">
        {artifact && deps != null && (
          <ArtifactRunner source={artifact.source} kind={artifact.fileKind} deps={deps} />
        )}
      </div>
    </div>
  );
}
