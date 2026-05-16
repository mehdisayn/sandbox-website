// TopBar — mobile/desktop nav row with left slot · centered title · right slot.
// Mirrors design/project/kit.jsx TopBar. See DESIGN.md §5.

import type { ReactNode } from 'react';

type Props = {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  kind?: 'mobile' | 'desktop';
  center?: boolean;
  className?: string;
};

export function TopBar({
  title,
  left,
  right,
  kind = 'desktop',
  center = true,
  className = '',
}: Props) {
  const padX = kind === 'mobile' ? 'px-4 pt-3.5 pb-3' : 'px-5 pt-3.5 pb-3';
  return (
    <div className={['flex items-center gap-3 border-b border-divider bg-paper', padX, className].join(' ')}>
      <div className="min-w-[60px] flex items-center gap-2">{left}</div>
      <div
        className={[
          'flex-1 text-sm font-semibold text-ink tracking-[-0.01em]',
          center ? 'text-center' : 'text-left',
        ].join(' ')}
      >
        {title}
      </div>
      <div className="min-w-[60px] flex items-center justify-end gap-2">{right}</div>
    </div>
  );
}
