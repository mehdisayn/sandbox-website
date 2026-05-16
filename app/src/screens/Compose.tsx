// Compose — create-from-scratch or edit-existing artifact source.
// DESIGN.md §7.6 + screens-compose.jsx. v1 uses a plain monospace textarea —
// syntax highlighting is deferred.

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { CodeEditor } from '../components/CodeEditor';
import { IconPicker, type IconValue } from '../components/IconPicker';
import { Btn } from '../components/ui/Btn';
import { Input } from '../components/ui/Input';
import { Pill } from '../components/ui/Pill';
import { Caption } from '../components/ui/Caption';
import { artifactRepo } from '../lib/repo/dexie-repos';
import { sizeBytes } from '../lib/artifacts';
import { detectImports } from '../lib/import-detector';
import { ensureArtifactDeps, type EnsureSummary } from '../lib/dep-fetcher';
import type { Artifact, FileKind } from '../lib/repo/types';

const STARTER_JSX = `function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <div className="text-2xl font-semibold">Hello, SANDBOX</div>
      <div className="text-6xl tabular-nums">{count}</div>
      <button
        className="px-4 py-2 rounded-xl bg-neutral-900 text-white"
        onClick={() => setCount(c => c + 1)}
      >＋</button>
    </div>
  );
}
`;

const STARTER_HTML = `<!doctype html>
<html>
  <body style="font-family: system-ui; padding: 24px;">
    <h1>Hello, SANDBOX</h1>
    <p>HTML artifacts run as-is inside the sandboxed iframe.</p>
  </body>
</html>
`;

export function Compose() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [name, setName] = useState('Untitled artifact');
  const [kind, setKind] = useState<FileKind>('jsx');
  const [source, setSource] = useState(STARTER_JSX);
  const [icon, setIcon] = useState<IconValue>({ iconType: 'glyph', iconValue: 'UN', iconFill: 'sage' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [original, setOriginal] = useState<Artifact | null>(null);
  const [depStatus, setDepStatus] = useState<string | null>(null);

  // Load existing artifact when editing.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    artifactRepo.get(editId).then((a) => {
      if (cancelled) return;
      if (!a) { setError('Artifact not found'); setLoading(false); return; }
      setOriginal(a);
      setName(a.name);
      setKind(a.fileKind);
      setSource(a.source);
      setIcon({ iconType: a.iconType, iconValue: a.iconValue, iconFill: a.iconFill });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [editId]);

  // Reset starter when toggling kind on a fresh compose.
  useEffect(() => {
    if (editId) return;
    setSource((s) => (s === STARTER_JSX || s === STARTER_HTML) ? (kind === 'jsx' ? STARTER_JSX : STARTER_HTML) : s);
  }, [kind, editId]);

  const imports = useMemo(() => detectImports(source), [source]);
  const bytes = useMemo(() => sizeBytes(source), [source]);

  async function save() {
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    setError(null);
    setDepStatus(null);
    try {
      let id: string;
      if (original) {
        await artifactRepo.updateSource(original.id, source);
        await artifactRepo.rename(original.id, name.trim());
        await artifactRepo.updateIcon(original.id, icon.iconType, icon.iconValue, icon.iconFill);
        id = original.id;
      } else {
        const created = await artifactRepo.create({
          name: name.trim(),
          iconType: icon.iconType,
          iconValue: icon.iconValue,
          iconFill: icon.iconFill,
          fileKind: kind,
          source,
          sizeBytes: bytes,
        });
        id = created.id;
      }

      if (imports.length > 0) {
        setDepStatus(`Fetching ${imports.length} dep${imports.length === 1 ? '' : 's'}…`);
        const summary: EnsureSummary = await ensureArtifactDeps(id, imports);
        if (summary.failed.length > 0) {
          const list = summary.failed.map((f) => `${f.name}: ${f.error}`).join('\n');
          setError(`Some dependencies could not be fetched:\n${list}`);
          setBusy(false);
          return;
        }
      }
      navigate(`/run/${id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <div className="font-mono text-xs uppercase tracking-widest text-ink-soft">loading…</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-paper text-ink">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-divider px-4 py-3 md:px-6">
          <Link to="/library" className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">← Library</Link>
          <div className="flex-1" />
          <span className="font-mono text-[11px] text-ink-soft">{bytes} B</span>
          <Pill tone="accent">{kind.toUpperCase()}</Pill>
          {imports.length > 0 && <Pill tone="neutral">{imports.length} dep{imports.length === 1 ? '' : 's'}</Pill>}
          <Btn onClick={() => navigate(-1)} disabled={busy}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : original ? 'Save' : 'Add to Library'}</Btn>
        </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {/* Editor */}
          <div className="flex min-h-0 flex-1 flex-col">
            <CodeEditor
              value={source}
              onChange={setSource}
              language={kind}
              placeholder="// paste or type JSX / HTML here"
              className="h-full w-full"
            />
          </div>

          {/* Sidebar form */}
          <div className="flex flex-col gap-4 border-t border-divider md:w-[300px] md:border-l md:border-t-0 md:overflow-y-auto">
            <div className="flex flex-col gap-3 p-4 md:p-5">
              <label className="flex flex-col gap-1">
                <Caption>Name</Caption>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <div className="flex flex-col gap-1">
                <Caption>Kind</Caption>
                <div className="flex gap-1 rounded-[10px] border border-border bg-paper-alt p-1">
                  {(['jsx', 'html'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      disabled={!!original}
                      className={[
                        'flex-1 rounded-[7px] py-1.5 text-xs font-medium uppercase tracking-wider',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'focus:outline-none focus:ring-2 focus:ring-accent',
                        kind === k ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
                      ].join(' ')}
                    >{k}</button>
                  ))}
                </div>
                {original && <span className="font-mono text-[10px] text-ink-faint">kind is fixed when editing</span>}
              </div>

              <IconPicker value={icon} onChange={setIcon} />

              <div className="flex flex-col gap-1">
                <Caption>Detected imports</Caption>
                {imports.length === 0 ? (
                  <span className="font-mono text-[11px] text-ink-faint">none — runs without deps</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {imports.map((i) => <Pill key={i} tone="accent">{i}</Pill>)}
                  </div>
                )}
                <span className="font-mono text-[10px] text-ink-faint">
                  Cached on save via the CDN allowlist (jsdelivr / unpkg / cdnjs).
                </span>
              </div>

              {depStatus && !error && (
                <div className="rounded-lg border border-border bg-paper-alt px-3 py-2 font-mono text-xs text-ink-soft">
                  {depStatus}
                </div>
              )}

              {error && (
                <div className="whitespace-pre-wrap rounded-lg border border-destructive bg-paper-alt px-3 py-2 font-mono text-xs text-destructive">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
