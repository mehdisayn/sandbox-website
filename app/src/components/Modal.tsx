// Modal — centered on desktop, bottom-sheet on mobile.
// Escape + backdrop click close. Focus-trap kept simple (autofocus the close btn).

import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({
  open, onClose, title, children, footer, wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
      className="fixed inset-0 z-40 flex items-end md:items-center md:justify-center bg-ink/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={[
          'flex max-h-[92vh] w-full flex-col overflow-hidden',
          'rounded-t-3xl bg-paper border-t border-l border-r border-ink',
          'md:rounded-2xl md:border md:shadow-[0_8px_32px_rgba(26,26,26,0.18)]',
          wide ? 'md:max-w-2xl' : 'md:max-w-md',
        ].join(' ')}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-divider px-5 py-3.5">
            <div className="text-sm font-semibold">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-7 w-7 rounded-md text-ink-soft hover:bg-paper-alt focus:outline-none focus:ring-2 focus:ring-accent"
            >✕</button>
          </div>
        )}
        <div className="flex-1 overflow-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-divider px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
