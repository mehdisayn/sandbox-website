// Input — sketched input field with optional leading icon (slot or string).
// Mirrors design/project/kit.jsx Input. See DESIGN.md §5.

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
  leading?: ReactNode;
  full?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { mono, leading, full = true, className = '', ...rest },
  ref
) {
  return (
    <label
      className={[
        'h-9 inline-flex items-center gap-2 rounded-[10px] border-[1.5px] border-border bg-card px-3',
        'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-paper',
        'transition-colors',
        full ? 'w-full flex' : '',
        className,
      ].join(' ')}
    >
      {leading && (
        <span className="font-mono text-[11px] text-ink-soft opacity-60 shrink-0">{leading}</span>
      )}
      <input
        ref={ref}
        {...rest}
        className={[
          'flex-1 min-w-0 bg-transparent text-[13px] text-ink placeholder:text-ink-soft outline-none',
          mono ? 'font-mono' : '',
        ].join(' ')}
      />
    </label>
  );
});
