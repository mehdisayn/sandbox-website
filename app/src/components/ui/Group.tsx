// Group — bordered rounded list container with optional uppercase caption.
// Mirrors design/project/kit.jsx Group. See DESIGN.md §5.

import type { ReactNode } from 'react';
import { Caption } from './Caption';

export function Group({ children, label, className = '' }: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={['mb-[18px]', className].join(' ')}>
      {label && <Caption className="px-3.5 pb-2">{label}</Caption>}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {children}
      </div>
    </div>
  );
}
