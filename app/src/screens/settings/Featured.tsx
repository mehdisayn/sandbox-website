import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsLayout } from './SettingsLayout';
import { Btn } from '../../components/ui/Btn';
import { AppIcon } from '../../components/ui/AppIcon';
import { artifactRepo } from '../../lib/repo/dexie-repos';
import { sizeBytes } from '../../lib/artifacts';
import { FEATURED_APPS } from '../../lib/featured-apps';

export function Featured() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  async function add(id: string) {
    const app = FEATURED_APPS.find((a) => a.id === id);
    if (!app) return;
    setBusy(id);
    try {
      const created = await artifactRepo.create({
        name: app.name,
        iconType: 'glyph',
        iconValue: app.glyph,
        iconFill: app.iconFill,
        fileKind: app.fileKind,
        source: app.source,
        sizeBytes: sizeBytes(app.source),
      });
      navigate(`/run/${created.id}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <SettingsLayout title="Featured mini-apps">
      <div className="text-[12px] text-ink-soft mb-4">
        Curated starter artifacts. Each "Add" copies the source into your library — edit freely afterward.
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FEATURED_APPS.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <AppIcon size={44} iconType="glyph" iconValue={a.glyph} iconFill={a.iconFill} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{a.name}</div>
              <div className="text-[11.5px] text-ink-soft line-clamp-2">{a.description}</div>
            </div>
            <Btn size="sm" onClick={() => add(a.id)} disabled={busy === a.id}>
              {busy === a.id ? '…' : 'Add'}
            </Btn>
          </div>
        ))}
      </div>
    </SettingsLayout>
  );
}
