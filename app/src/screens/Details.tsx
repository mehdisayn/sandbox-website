// Details — per-artifact metadata + actions. DESIGN.md §7.5, screens-run-details.jsx.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { IconPicker, type IconValue } from '../components/IconPicker';
import { Btn } from '../components/ui/Btn';
import { Input } from '../components/ui/Input';
import { Pill } from '../components/ui/Pill';
import { Group } from '../components/ui/Group';
import { AppIcon } from '../components/ui/AppIcon';
import { artifactRepo, dependencyRepo } from '../lib/repo/dexie-repos';
import { copyArtifactSource, shareArtifact } from '../lib/share';
import type { Artifact, Dependency } from '../lib/repo/types';

export function Details() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [editingIcon, setEditingIcon] = useState(false);
  const [icon, setIcon] = useState<IconValue>({ iconType: 'glyph', iconValue: '', iconFill: null });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function reload() {
    const a = await artifactRepo.get(id);
    setArtifact(a);
    if (a) {
      setName(a.name);
      setIcon({ iconType: a.iconType, iconValue: a.iconValue, iconFill: a.iconFill });
      setDeps(await dependencyRepo.loadForArtifact(a.id));
    }
  }

  useEffect(() => { reload(); }, [id]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (artifact === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">loading…</div>
      </div>
    );
  }
  if (!artifact) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper text-ink">
        <div className="text-center">
          <div className="text-lg font-medium">Not found</div>
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">← library</Link>
        </div>
      </div>
    );
  }

  async function saveName() {
    const a = artifact;
    if (!a) return;
    if (!name.trim() || name.trim() === a.name) { setEditingName(false); return; }
    setBusy(true);
    await artifactRepo.rename(a.id, name.trim());
    setBusy(false);
    setEditingName(false);
    reload();
  }

  async function saveIcon() {
    const a = artifact;
    if (!a) return;
    setBusy(true);
    await artifactRepo.updateIcon(a.id, icon.iconType, icon.iconValue, icon.iconFill);
    setBusy(false);
    setEditingIcon(false);
    reload();
  }

  async function doShare() {
    const a = artifact;
    if (!a) return;
    try {
      const how = await shareArtifact(a);
      setToast(how === 'shared' ? 'Shared' : 'Downloaded');
    } catch {/* user aborted */}
  }

  async function doCopy() {
    const a = artifact;
    if (!a) return;
    try {
      await copyArtifactSource(a);
      setToast('Source copied');
    } catch {
      setToast('Copy failed');
    }
  }

  async function doDelete() {
    const a = artifact;
    if (!a) return;
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    setBusy(true);
    await artifactRepo.delete(a.id);
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-paper text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-divider px-4 py-3 md:px-6">
          <Link to="/" className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">← Library</Link>
          <div className="flex-1 text-sm font-medium">Details</div>
          <Btn variant="primary" onClick={() => navigate(`/run/${artifact.id}`)}>Open</Btn>
        </div>

        <div className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <div className="flex items-center gap-4">
              <AppIcon size={72} iconType={artifact.iconType} iconValue={artifact.iconValue} iconFill={artifact.iconFill} />
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex gap-2">
                    <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                    <Btn variant="primary" onClick={saveName} disabled={busy}>Save</Btn>
                    <Btn variant="ghost" onClick={() => { setName(artifact.name); setEditingName(false); }}>Cancel</Btn>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-bold tracking-[-0.01em] truncate">{artifact.name}</h1>
                    <button onClick={() => setEditingName(true)} className="font-mono text-[11px] text-ink-soft hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded">edit</button>
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Pill tone={artifact.fileKind === 'html' ? 'neutral' : 'accent'}>{artifact.fileKind.toUpperCase()}</Pill>
                  <span className="font-mono text-[11px] text-ink-soft">{formatBytes(artifact.sizeBytes)}</span>
                </div>
              </div>
            </div>

            <Group label="Metadata">
              <Field label="Added"        value={formatDate(artifact.createdAt)} />
              <Field label="Last opened"  value={artifact.lastOpened ? formatDate(artifact.lastOpened) : '—'} />
              <Field label="Kind"         value={artifact.fileKind.toUpperCase()} />
              <Field label="Size"         value={formatBytes(artifact.sizeBytes)} last />
            </Group>

            <Group label={`Dependencies${deps.length ? ` · ${deps.length}` : ''}`}>
              {deps.length === 0 ? (
                <div className="px-3.5 py-3 font-mono text-[11px] text-ink-faint">none</div>
              ) : deps.map((d, i) => (
                <Field key={d.id} label={d.name} value={formatBytes(d.sizeBytes)} mono last={i === deps.length - 1} />
              ))}
            </Group>

            <Group label="Icon">
              {editingIcon ? (
                <div className="flex flex-col gap-3 p-4">
                  <IconPicker value={icon} onChange={setIcon} />
                  <div className="flex gap-2 justify-end">
                    <Btn variant="ghost" onClick={() => { setIcon({ iconType: artifact.iconType, iconValue: artifact.iconValue, iconFill: artifact.iconFill }); setEditingIcon(false); }}>Cancel</Btn>
                    <Btn variant="primary" onClick={saveIcon} disabled={busy}>Save icon</Btn>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEditingIcon(true)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 hover:bg-paper-alt focus:outline-none focus:bg-paper-alt"
                >
                  <AppIcon size={32} iconType={artifact.iconType} iconValue={artifact.iconValue} iconFill={artifact.iconFill} />
                  <span className="flex-1 text-left text-sm font-medium">Change icon</span>
                  <span className="text-ink-faint text-lg">›</span>
                </button>
              )}
            </Group>

            <Group label="Actions">
              <ActionRow label="Edit source"        onClick={() => navigate(`/compose?id=${artifact.id}`)} />
              <ActionRow label="Share"              onClick={doShare} />
              <ActionRow label="Copy source"        onClick={doCopy} />
              <ActionRow label="Delete artifact"    onClick={doDelete} danger last />
            </Group>
          </div>
        </div>
        <BottomNav />
      </div>

      {toast && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs text-ink shadow">
          {toast}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div className={['flex items-center justify-between gap-3 px-3.5 py-2.5', last ? '' : 'border-b border-divider'].join(' ')}>
      <span className={['text-sm', mono ? 'font-mono text-[12px] text-ink truncate' : 'text-ink-soft'].join(' ')}>{label}</span>
      <span className="font-mono text-[11px] text-ink-soft">{value}</span>
    </div>
  );
}

function ActionRow({ label, onClick, danger, last }: { label: string; onClick: () => void; danger?: boolean; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left',
        last ? '' : 'border-b border-divider',
        'hover:bg-paper-alt focus:outline-none focus:bg-paper-alt',
      ].join(' ')}
    >
      <span className={['text-sm font-medium', danger ? 'text-destructive' : 'text-ink'].join(' ')}>{label}</span>
      <span className="text-ink-faint text-lg">›</span>
    </button>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

