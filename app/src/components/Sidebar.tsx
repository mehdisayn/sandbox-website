// Desktop sidebar nav. Mirrors design/project/screens-library.jsx SBSidebar.

import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

type Item = { to: string; label: string; glyph: string };

const ITEMS: Item[] = [
  { to: '/',         label: 'Library',      glyph: '▦' },
  { to: '/compose',  label: 'Compose',      glyph: '✎' },
  { to: '/settings/dependencies', label: 'Dependencies', glyph: '⧉' },
  { to: '/settings', label: 'Settings',     glyph: '⚙' },
];

export function Sidebar({ footer }: { footer?: ReactNode }) {
  return (
    <aside
      aria-label="Primary navigation"
      className="hidden md:flex w-[220px] shrink-0 flex-col gap-1.5 border-r border-divider bg-paper-alt p-[18px_14px]"
    >
      <div className="flex items-center gap-2.5 px-1.5 pb-3.5">
        <img
          src="/icon.png"
          alt=""
          aria-hidden="true"
          className="h-[26px] w-[26px] rounded-[7px] border-[1.5px] border-ink"
        />
        <div className="text-[13px] font-bold tracking-[0.02em]">SANDBOX</div>
      </div>
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 rounded-[9px] border px-2.5 py-2 text-[13px]',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-paper-alt',
              isActive
                ? 'border-border bg-card font-semibold text-ink'
                : 'border-transparent font-medium text-ink-soft hover:text-ink',
            ].join(' ')
          }
        >
          <span className="w-[18px] text-center font-mono text-sm">{it.glyph}</span>
          <span className="flex-1">{it.label}</span>
        </NavLink>
      ))}
      <div className="flex-1" />
      {footer && <div className="border-t border-dashed border-divider p-1.5 pt-2">{footer}</div>}
      <div className="px-1.5 pt-2 font-mono text-[9px] uppercase tracking-widest text-ink-faint">
        Built by Syed Mehedi Hussain
      </div>
    </aside>
  );
}
