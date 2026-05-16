// Mobile bottom tab bar. Mirrors design/project/screens-library.jsx mobile.

import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/library', label: 'Library',  glyph: '▦' },
  { to: '/compose',  label: 'Compose',  glyph: '✎' },
  { to: '/settings', label: 'Settings', glyph: '⚙' },
];

export function BottomNav() {
  return (
    <div className="md:hidden border-t border-divider bg-paper-alt">
      <div className="text-center font-mono text-[9px] uppercase tracking-widest text-ink-faint pt-1.5">
        Built by Syed Mehedi Hussain
      </div>
      <nav aria-label="Primary navigation" className="flex px-0 pb-[18px] pt-2">
      {ITEMS.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/library'}
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center gap-0.5',
              'focus:outline-none focus:ring-2 focus:ring-accent rounded',
              isActive ? 'text-ink' : 'text-ink-soft',
            ].join(' ')
          }
        >
          <span className="font-mono text-sm">{it.glyph}</span>
          <span className="text-[9.5px] font-medium">{it.label}</span>
        </NavLink>
      ))}
      </nav>
    </div>
  );
}
