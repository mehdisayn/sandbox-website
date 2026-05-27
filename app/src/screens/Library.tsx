// Library — variant A (artifact-emphasis). DESIGN.md §7.1, screens-library.jsx.
//   • Header with title + count, search, view toggle, Add CTA
//   • Grid view (default): big tiles, 4 / 6 column responsive
//   • List view (toggleable): compact rows
//   • Per-artifact context menu (right-click + long-press)
//   • Empty state on first run
//   • Drag-and-drop hint (functional drop wired in #15)

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifactRepo } from '../lib/repo/active';
import type { Artifact } from '../lib/repo/types';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { ContextMenu, type MenuItem } from '../components/ContextMenu';
import { EmptyState } from '../components/EmptyState';
import { useLongPress } from '../components/useLongPress';
import { useIngestion } from '../components/IngestionProvider';
import { AppIcon } from '../components/ui/AppIcon';
import { Btn } from '../components/ui/Btn';
import { Input } from '../components/ui/Input';
import { Pill } from '../components/ui/Pill';

type View = 'grid' | 'list';

export function Library() {
  const navigate = useNavigate();
  const { openAdd } = useIngestion();
  const [items, setItems] = useState<Artifact[] | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>(() => (localStorage.getItem('sb:libraryView') as View) ?? 'grid');
  const [menu, setMenu] = useState<{ x: number; y: number; artifact: Artifact } | null>(null);

  const reload = () => artifactRepo.list().then(setItems);
  useEffect(() => { reload(); }, []);
  useEffect(() => { localStorage.setItem('sb:libraryView', view); }, [view]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    return q ? items.filter((a) => a.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const totalBytes = useMemo(
    () => (items?.reduce((s, a) => s + a.sizeBytes, 0) ?? 0),
    [items]
  );

  const menuItems = (a: Artifact): MenuItem[] => [
    { kind: 'item', label: 'Open',         onClick: () => navigate(`/run/${a.id}`) },
    { kind: 'item', label: 'Details',      onClick: () => navigate(`/details/${a.id}`) },
    { kind: 'item', label: 'Edit code',    onClick: () => navigate(`/compose?id=${a.id}`) },
    { kind: 'separator' },
    { kind: 'item', label: 'Rename',       onClick: () => renameFlow(a) },
    { kind: 'item', label: 'Change icon',  onClick: () => navigate(`/details/${a.id}#icon`) },
    { kind: 'item', label: 'Share',        onClick: () => navigate(`/details/${a.id}#share`) },
    { kind: 'separator' },
    { kind: 'item', label: 'Delete',       onClick: () => deleteFlow(a), danger: true },
  ];

  async function renameFlow(a: Artifact) {
    const next = window.prompt('Rename artifact', a.name);
    if (next == null || !next.trim() || next === a.name) return;
    await artifactRepo.rename(a.id, next.trim());
    reload();
  }
  async function deleteFlow(a: Artifact) {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    await artifactRepo.delete(a.id);
    reload();
  }

  return (
    <div className="flex h-screen bg-paper text-ink">
      <a
        href="#library-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-1.5 focus:text-paper focus:outline-none"
      >Skip to library</a>
      <Sidebar
        footer={
          <div className="font-mono text-[9px] text-ink-faint">
            local · {formatBytes(totalBytes)}
          </div>
        }
      />

      <main id="library-main" className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-end justify-between gap-3 px-5 pt-5 pb-3 md:px-8 md:pt-7 md:pb-[18px]">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-bold tracking-[-0.02em]">Library</h1>
            <div className="mt-0.5 text-[13px] text-ink-soft">
              {items == null ? '…' : `${items.length} artifact${items.length === 1 ? '' : 's'} · ${formatBytes(totalBytes)}`}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2.5">
            <Input
              type="search"
              aria-label="Search artifacts"
              leading="⌕"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              full={false}
              className="w-[240px]"
            />
            <ViewToggle value={view} onChange={setView} />
            <Btn variant="primary" onClick={() => openAdd()}>＋ Add mini-app</Btn>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="md:hidden flex items-center gap-2 px-4 pb-3">
          <Input type="search" aria-label="Search artifacts" leading="⌕" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button
            type="button"
            onClick={() => openAdd()}
            aria-label="Add mini-app"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-ink text-lg font-light focus:outline-none focus:ring-2 focus:ring-accent"
          >＋</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 pb-6 md:px-8">
          {items == null && (
            <div className="font-mono text-xs uppercase tracking-widest text-ink-soft p-6">loading…</div>
          )}
          {items != null && items.length === 0 && <EmptyState />}
          {items != null && items.length > 0 && view === 'grid' && (
            <GridView items={filtered} onContext={(x, y, a) => setMenu({ x, y, artifact: a })} onAdd={() => openAdd()} />
          )}
          {items != null && items.length > 0 && view === 'list' && (
            <ListView items={filtered} onContext={(x, y, a) => setMenu({ x, y, artifact: a })} />
          )}
        </div>

        {/* Drop hint — desktop */}
        {items != null && items.length > 0 && (
          <div className="hidden md:flex items-center gap-3.5 mx-8 mb-6 rounded-xl border-[1.5px] border-dashed border-border px-4.5 py-3.5 font-mono text-[12px] tracking-[0.02em] text-ink-soft">
            <span className="text-base">⤓</span>
            <span>drop a .jsx or .html file anywhere · or paste source · or paste a raw URL</span>
          </div>
        )}

        <BottomNav />
      </main>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.artifact)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────

function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  return (
    <div className="flex overflow-hidden rounded-[10px] border-[1.5px] border-border" role="tablist" aria-label="View">
      {(['grid', 'list'] as const).map((v) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="tab"
            aria-selected={active}
            aria-label={v === 'grid' ? 'Grid view' : 'List view'}
            onClick={() => onChange(v)}
            className={[
              'px-3 py-2 font-mono text-xs',
              active ? 'bg-ink text-paper' : 'bg-card text-ink-soft hover:text-ink',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset',
            ].join(' ')}
          >
            <span aria-hidden="true">{v === 'grid' ? '▦' : '☰'}</span>
          </button>
        );
      })}
    </div>
  );
}

function GridView({
  items, onContext, onAdd,
}: {
  items: Artifact[];
  onContext: (x: number, y: number, a: Artifact) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 md:gap-[22px]">
      {items.map((a) => <Tile key={a.id} artifact={a} onContext={onContext} />)}
      <button
        onClick={onAdd}
        className="flex flex-col items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-accent rounded-[18px] p-1"
      >
        <div className="flex h-[56px] w-[56px] md:h-[68px] md:w-[68px] items-center justify-center rounded-[16px] md:rounded-[19px] border-[1.5px] border-dashed border-ink-soft text-2xl md:text-[30px] font-light text-ink-soft">
          ＋
        </div>
        <div className="text-[10.5px] md:text-xs font-medium text-ink-soft">Add</div>
      </button>
    </div>
  );
}

function Tile({
  artifact: a,
  onContext,
}: {
  artifact: Artifact;
  onContext: (x: number, y: number, a: Artifact) => void;
}) {
  const longPress = useLongPress((x, y) => onContext(x, y, a));
  return (
    <Link
      to={`/run/${a.id}`}
      onContextMenu={(e) => { e.preventDefault(); onContext(e.clientX, e.clientY, a); }}
      {...longPress}
      className="flex select-none flex-col items-center gap-2 rounded-[18px] p-2 md:gap-2.5 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      <div className="md:hidden"><AppIcon size={56} iconType={a.iconType} iconValue={a.iconValue} iconFill={a.iconFill} /></div>
      <div className="hidden md:block"><AppIcon size={68} iconType={a.iconType} iconValue={a.iconValue} iconFill={a.iconFill} /></div>
      <div className="text-center text-[10.5px] md:text-xs font-medium leading-[1.2] line-clamp-2">{a.name}</div>
      <div className="hidden md:block font-mono text-[9px] text-ink-faint">{relativeTime(a.lastOpened ?? a.createdAt)}</div>
    </Link>
  );
}

function ListView({
  items, onContext,
}: {
  items: Artifact[];
  onContext: (x: number, y: number, a: Artifact) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[36px_1fr_72px_64px_88px_24px] gap-3.5 border-b border-dashed border-divider px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-widest text-ink-faint">
        <span /><span>name</span><span>kind</span><span>size</span><span>opened</span><span />
      </div>
      {items.map((a) => <ListRow key={a.id} artifact={a} onContext={onContext} />)}
    </div>
  );
}

function ListRow({
  artifact: a,
  onContext,
}: {
  artifact: Artifact;
  onContext: (x: number, y: number, a: Artifact) => void;
}) {
  const longPress = useLongPress((x, y) => onContext(x, y, a));
  return (
    <Link
      to={`/run/${a.id}`}
      onContextMenu={(e) => { e.preventDefault(); onContext(e.clientX, e.clientY, a); }}
      {...longPress}
      className="grid grid-cols-[36px_1fr_72px_64px_88px_24px] items-center gap-3.5 border-b border-divider px-3 py-2 last:border-b-0 hover:bg-paper-alt focus:bg-paper-alt focus:outline-none"
    >
      <AppIcon size={32} iconType={a.iconType} iconValue={a.iconValue} iconFill={a.iconFill} />
      <div className="text-[13px] font-medium truncate">{a.name}</div>
      <Pill tone={a.fileKind === 'html' ? 'neutral' : 'accent'}>{a.fileKind.toUpperCase()}</Pill>
      <span className="font-mono text-[11px] text-ink-soft">{formatBytes(a.sizeBytes)}</span>
      <span className="font-mono text-[11px] text-ink-soft">{relativeTime(a.lastOpened ?? a.createdAt)}</span>
      <span className="text-ink-faint text-sm">›</span>
    </Link>
  );
}

// ── Formatters ─────────────────────────────────────────────────

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function relativeTime(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
