// Global ingestion provider — mounts the AddArtifactModal at app level,
// exposes openAdd() to any descendant. Also installs:
//   • a window-level drag-drop handler so any file dropped anywhere prompts the user
//   • a global paste handler with a tiny size threshold to avoid spurious opens

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AddArtifactModal } from './AddArtifactModal';
import { fromFile, fromText, type Ingested } from '../lib/ingestion';

type Ctx = {
  openAdd: (initial?: Ingested | null) => void;
};

const IngestionCtx = createContext<Ctx | null>(null);

export function useIngestion() {
  const c = useContext(IngestionCtx);
  if (!c) throw new Error('useIngestion outside IngestionProvider');
  return c;
}

export function IngestionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<Ingested | null>(null);
  const dragDepth = useRef(0);
  const [dragHint, setDragHint] = useState(false);

  const openAdd = useCallback((seed: Ingested | null = null) => {
    setInitial(seed);
    setOpen(true);
  }, []);

  // Window-level drag-and-drop. Tracks depth so the hint only hides when the
  // last child finishes dragenter/leave (the spec is annoying about this).
  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      if (!hasFiles(e)) return;
      dragDepth.current += 1;
      e.preventDefault();
      setDragHint(true);
    }
    function onDragLeave(e: DragEvent) {
      if (!hasFiles(e)) return;
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) { dragDepth.current = 0; setDragHint(false); }
    }
    function onDragOver(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
    async function onDrop(e: DragEvent) {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0; setDragHint(false);
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        const ingested = await fromFile(file, 'drop');
        openAdd(ingested);
      } catch (err) {
        console.error('[ingestion] drop failed', err);
      }
    }
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [openAdd]);

  // Global paste — only intercept when the paste isn't going into a real input.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const text = e.clipboardData?.getData('text');
      if (!text) return;
      // Skip tiny snippets — likely accidental.
      if (text.length < 40) return;
      // Only auto-open on the Library route to avoid surprising users on Run/Compose.
      if (window.location.pathname !== '/') return;
      e.preventDefault();
      openAdd(fromText(text));
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [openAdd]);

  return (
    <IngestionCtx.Provider value={{ openAdd }}>
      {children}
      {dragHint && !open && (
        <div className="pointer-events-none fixed inset-4 z-30 flex items-center justify-center rounded-2xl border-[2px] border-dashed border-accent bg-accent-soft/40">
          <div className="rounded-xl bg-paper px-4 py-2 font-mono text-sm uppercase tracking-widest text-ink shadow">
            drop file to add
          </div>
        </div>
      )}
      <AddArtifactModal
        open={open}
        initial={initial}
        onClose={() => setOpen(false)}
        onAdded={(id) => { setOpen(false); navigate(`/run/${id}`); }}
      />
    </IngestionCtx.Provider>
  );
}

function hasFiles(e: DragEvent): boolean {
  return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
}
