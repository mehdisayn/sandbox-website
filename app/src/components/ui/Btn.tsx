// Btn — primary / default / ghost / danger button.
// Mirrors design/project/kit.jsx Btn. See DESIGN.md §5.

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'default' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
};

const HEIGHTS: Record<Size, string> = { sm: 'h-7 text-xs', md: 'h-9 text-[13px]', lg: 'h-11 text-[13px]' };
const PADX: Record<Size, string> = { sm: 'px-3', md: 'px-3.5', lg: 'px-5' };

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-paper border-ink',
  default: 'bg-card text-ink border-ink',
  ghost: 'bg-transparent text-ink border-border',
  danger: 'bg-transparent text-destructive border-destructive',
};

export const Btn = forwardRef<HTMLButtonElement, Props>(function Btn(
  { variant = 'default', size = 'md', full, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        HEIGHTS[size],
        PADX[size],
        VARIANTS[variant],
        full ? 'w-full' : '',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
});
