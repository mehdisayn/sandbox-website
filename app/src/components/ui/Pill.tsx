// Pill — small mono badge. Tones: neutral / accent / danger / ink.
// Mirrors design/project/kit.jsx Pill. See DESIGN.md §5.

import type { ReactNode } from 'react';

type Tone = 'neutral' | 'accent' | 'danger' | 'ink';

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper-alt text-ink-soft border-border',
  accent: 'bg-accent-soft text-ink border-accent',
  danger: 'bg-transparent text-destructive border-destructive',
  ink: 'bg-ink text-paper border-ink',
};

export function Pill({ children, tone = 'neutral', className = '' }: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border px-2 py-px',
        'font-mono text-[10px] font-medium uppercase tracking-[0.05em]',
        TONES[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
