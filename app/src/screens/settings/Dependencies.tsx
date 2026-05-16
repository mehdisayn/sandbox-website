import { useEffect, useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { Pill } from '../../components/ui/Pill';
import { Btn } from '../../components/ui/Btn';
import { db } from '../../lib/repo/dexie';
import { dependencyRepo, artifactRepo } from '../../lib/repo/dexie-repos';
import type { Artifact, Dependency } from '../../lib/repo/types';

type Row = Dependency & { uses: number; artifacts: Artifact[] };

export function Dependencies() {
  const [rows, setRows] = useState<Row[] | null>(null);

  async function load() {
    const deps = await dependencyRepo.list();
    const enriched: Row[] = [];
    for (const d of deps) {
      const links = await db.artifactDeps.where('dependencyId').equals(d.id).toArray();
      const artifacts: Artifact[] = [];
      for (const link of links) {
        const a = await artifactRepo.get(link.artifactId);
        if (a) artifacts.push(a);
      }
      enriched.push({ ...d, uses: links.length, artifacts });
    }
    enriched.sort((a, b) => b.sizeBytes - a.sizeBytes);
    setRows(enriched);
  }

  useEffect(() => { load(); }, []);

  async function del(r: Row) {
    const names = r.artifacts.map((a) => `"${a.name}"`).join(', ') || 'no artifacts';
    if (!window.confirm(`Delete cached dep "${r.name}"?\nUsed by ${r.uses} artifact${r.uses === 1 ? '' : 's'}: ${names}.\nRe-fetched on next run.`)) return;
    await db.artifactDeps.where('dependencyId').equals(r.id).delete();
    await dependencyRepo.delete(r.id);
    load();
  }

  return (
    <SettingsLayout title="Dependencies">
      {rows == null && <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">loading…</div>}
      {rows != null && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <div className="text-sm font-medium">No cached dependencies</div>
          <div className="mt-1 text-xs text-ink-soft">Dependencies are cached when an artifact that imports them is added.</div>
        </div>
      )}
      {rows != null && rows.length > 0 && (
        <Group label={`${rows.length} cached · ${formatBytes(rows.reduce((s, r) => s + r.sizeBytes, 0))}`}>
          {rows.map((r, i) => (
            <div key={r.id} className={['flex items-center gap-3 px-3.5 py-3', i === rows.length - 1 ? '' : 'border-b border-divider'].join(' ')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-medium truncate">{r.name}</span>
                  <Pill tone="neutral">{r.uses} use{r.uses === 1 ? '' : 's'}</Pill>
                </div>
                <div className="font-mono text-[11px] text-ink-soft">{r.version} · {formatBytes(r.sizeBytes)} · cached {new Date(r.downloadedAt).toLocaleDateString()}</div>
              </div>
              <Btn variant="danger" size="sm" onClick={() => del(r)}>Delete</Btn>
            </div>
          ))}
        </Group>
      )}
    </SettingsLayout>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
