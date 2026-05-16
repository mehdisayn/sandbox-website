// Lightweight context menu — anchored to a point (right-click or long-press).
// Closes on outside click / Escape / blur. No portal for simplicity.

import { useEffect, useRef } from 'react';

export type MenuItem =
  | { kind: 'item'; label: string; onClick: () => void; danger?: boolean }
  | { kind: 'separator' };

export function ContextMenu({
  x, y, items, onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Clamp to viewport so it doesn't open off-screen.
  const W = 200, H = items.length * 36 + 8;
  const left = Math.min(x, window.innerWidth - W - 8);
  const top = Math.min(y, window.innerHeight - H - 8);

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left, top, minWidth: W }}
      className="fixed z-50 rounded-xl border border-border bg-card py-1 shadow-[0_4px_16px_rgba(26,26,26,0.12)]"
    >
      {items.map((it, i) => {
        if (it.kind === 'separator') {
          return <div key={i} className="my-1 h-px bg-divider" />;
        }
        return (
          <button
            key={i}
            role="menuitem"
            onClick={() => { it.onClick(); onClose(); }}
            className={[
              'block w-full px-3 py-1.5 text-left text-[13px]',
              'hover:bg-paper-alt focus:bg-paper-alt focus:outline-none',
              it.danger ? 'text-destructive' : 'text-ink',
            ].join(' ')}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
