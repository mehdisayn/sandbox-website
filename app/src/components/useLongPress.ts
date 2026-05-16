// Long-press detector for touch — triggers after 500ms hold without movement.
// Use alongside onContextMenu for the desktop right-click path.

import { useCallback, useRef } from 'react';

export function useLongPress(handler: (x: number, y: number) => void, ms = 500) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timer.current != null) { clearTimeout(timer.current); timer.current = null; }
    start.current = null;
  }, []);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        if (start.current) handler(start.current.x, start.current.y);
      }, ms);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (dx * dx + dy * dy > 64) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}
