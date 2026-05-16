// Caption — small uppercase tracked mono label for sections.
// Mirrors design/project/kit.jsx Caption. See DESIGN.md §5.

import type { ReactNode } from 'react';

export function Caption({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={[
        'font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
