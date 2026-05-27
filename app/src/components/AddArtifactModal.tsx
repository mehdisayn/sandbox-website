// Add-to-Library modal (desktop) / bottom sheet (mobile).
// DESIGN.md §7.3 + screens-empty-add.jsx. Two states:
//   • chooser — pick / drop / paste / URL when no Ingested yet
//   • customize — name + icon + kind + save once an Ingested is provided

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from './Modal';
import { Btn } from './ui/Btn';
import { Input } from './ui/Input';
import { Pill } from './ui/Pill';
import { IconPicker, type IconValue } from './IconPicker';
import { artifactRepo } from '../lib/repo/active';
import { sizeBytes } from '../lib/artifacts';
import { detectImports } from '../lib/import-detector';
import { ensureArtifactDeps } from '../lib/dep-fetcher';
import {
  FILE_ACCEPT,
  fromFile,
  fromText,
  fromUrl,
  suggestedName,
  type Ingested,
} from '../lib/ingestion';
import type { FileKind } from '../lib/repo/types';

const DEFAULT_ICON: IconValue = { iconType: 'glyph', iconValue: 'AR', iconFill: 'sage' };

export function AddArtifactModal({
  initial, open, onClose, onAdded,
}: {
  initial: Ingested | null;       // null → chooser view; non-null → customize view
  open: boolean;
  onClose: () => void;
  onAdded: (id: string) => void;
}) {
  const [ingested, setIngested] = useState<Ingested | null>(initial);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<FileKind>('jsx');
  const [icon, setIcon] = useState<IconValue>(DEFAULT_ICON);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when reopening with new initial.
  useEffect(() => {
    if (!open) return;
    setIngested(initial);
    setError(null);
    setBusy(false);
  }, [open, initial]);

  // When an Ingested arrives (either via initial or via chooser), seed form fields.
  useEffect(() => {
    if (!ingested) return;
    setName(suggestedName(ingested));
    setKind(ingested.kind);
    const initials = suggestedName(ingested).slice(0, 2).toUpperCase() || 'AR';
    setIcon({ iconType: 'glyph', iconValue: initials, iconFill: 'sage' });
  }, [ingested]);

  const sourceLabel = useMemo(() => {
    if (!ingested) return '';
    return {
      file: 'from file', drop: 'from drop', paste: 'from paste', url: 'from URL',
    }[ingested.source];
  }, [ingested]);

  if (!open) return null;

  if (!ingested) {
    return (
      <Modal open={open} onClose={onClose} title="Add to Library" wide>
        <Chooser onIngested={setIngested} onError={setError} />
        {error && (
          <div className="mt-3 whitespace-pre-wrap rounded-lg border border-destructive bg-paper-alt px-3 py-2 font-mono text-xs text-destructive">
            {error}
          </div>
        )}
      </Modal>
    );
  }

  async function save() {
    if (!ingested) return;
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    setError(null);
    try {
      const created = await artifactRepo.create({
        name: name.trim(),
        iconType: icon.iconType,
        iconValue: icon.iconValue,
        iconFill: icon.iconFill,
        fileKind: kind,
        source: ingested.content,
        sizeBytes: sizeBytes(ingested.content),
      });

      const imports = detectImports(ingested.content);
      if (imports.length > 0) {
        const summary = await ensureArtifactDeps(created.id, imports);
        if (summary.failed.length > 0) {
          const list = summary.failed.map((f) => `${f.name}: ${f.error}`).join('\n');
          setError(`Saved, but some deps failed:\n${list}`);
          setBusy(false);
          return;
        }
      }
      onAdded(created.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to Library"
      wide
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={busy}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Add to Library'}</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto] md:gap-6">
        <div className="flex flex-col gap-3 md:order-2 md:w-[260px]">
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div className="flex flex-col gap-3 md:order-1">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Kind</span>
            <div className="flex gap-1 rounded-[10px] border border-border bg-paper-alt p-1">
              {(['jsx', 'html'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={[
                    'flex-1 rounded-[7px] py-1.5 text-xs font-medium uppercase tracking-wider',
                    'focus:outline-none focus:ring-2 focus:ring-accent',
                    kind === k ? 'bg-card text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
                  ].join(' ')}
                >{k}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="neutral">{sourceLabel}</Pill>
            {ingested.filename && (
              <span className="font-mono text-[11px] text-ink-soft truncate">{ingested.filename}</span>
            )}
            <Pill tone="accent">{formatBytes(sizeBytes(ingested.content))}</Pill>
          </div>

          <details>
            <summary className="cursor-pointer text-xs text-ink-soft hover:text-ink">
              Preview source
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-paper-alt p-3 font-mono text-[11px] text-ink-soft">
              {ingested.content.slice(0, 2000)}
              {ingested.content.length > 2000 && '\n…'}
            </pre>
          </details>

          {error && (
            <div className="rounded-lg border border-destructive bg-paper-alt px-3 py-2 font-mono text-xs text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Chooser ────────────────────────────────────────────────────
// Shown when no Ingested has been supplied. Wraps the four ingestion paths.

function Chooser({
  onIngested,
  onError,
}: {
  onIngested: (i: Ingested) => void;
  onError: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [paste, setPaste] = useState('');
  const [fetching, setFetching] = useState(false);

  async function handleFile(f: File) {
    try { onIngested(await fromFile(f)); }
    catch (err) { onError((err as Error).message); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) return void handleFile(file);
    const text = e.dataTransfer.getData('text');
    if (text) onIngested(fromText(text));
  }

  async function importUrl() {
    onError('');
    setFetching(true);
    try { onIngested(await fromUrl(url)); }
    catch (err) { onError((err as Error).message); }
    finally { setFetching(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl',
          'border-[1.5px] border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-accent bg-accent-soft' : 'border-border bg-paper-alt hover:border-ink-soft',
        ].join(' ')}
      >
        <div className="text-2xl text-ink-soft">⤓</div>
        <div className="text-sm font-medium">Drop a file or click to pick</div>
        <div className="font-mono text-[11px] text-ink-soft">.jsx .tsx .js .ts .html .htm .txt</div>
        <input
          ref={fileRef}
          type="file"
          accept={FILE_ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">From URL</span>
        <div className="flex gap-2">
          <Input
            leading="@"
            mono
            placeholder="https://… raw .jsx URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && url) importUrl(); }}
          />
          <Btn onClick={importUrl} disabled={!url || fetching}>{fetching ? '…' : 'Fetch'}</Btn>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Paste source</span>
          {paste && <Pill tone="neutral">{formatBytes(paste.length)}</Pill>}
        </div>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="// paste JSX or HTML here…"
          rows={5}
          className="rounded-[10px] border-[1.5px] border-border bg-card p-3 font-mono text-[12px] text-ink placeholder:text-ink-soft outline-none focus:ring-2 focus:ring-accent"
        />
        <div className="flex justify-end">
          <Btn onClick={() => onIngested(fromText(paste))} disabled={!paste.trim()}>Use pasted source</Btn>
        </div>
      </div>
    </div>
  );
}
