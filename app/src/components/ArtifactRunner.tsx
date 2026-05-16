// The runtime host. Sandboxed iframe + postMessage bridge, per ARCHITECTURE.md §2–§3.
// The iframe loads the shell from RUNTIME_ORIGIN — a different origin from the
// app. `sandbox="allow-scripts"` (no allow-same-origin) gives the framed
// document an opaque origin: artifact code structurally cannot reach app data.

import { useEffect, useRef, useState } from 'react';
import {
  APP_ORIGIN,
  RUNTIME_ORIGIN,
  type CachedDependency,
  type ShellMessage,
} from '../shared/protocol';

const BOOT_HINT_AFTER_MS = 800;
const BOOT_TIMEOUT_MS = 12_000;

type Props = {
  source: string;
  kind?: 'jsx' | 'html';
  deps?: CachedDependency[];
  onError?: (message: string) => void;
  onNetworkError?: (detail: { url?: string; message?: string }) => void;
};

type Stage = 'booting' | 'ready' | 'mounted' | 'error';

const SHELL_URL = `${RUNTIME_ORIGIN}/shell.html?app=${encodeURIComponent(APP_ORIGIN)}`;

export function ArtifactRunner({ source, kind = 'jsx', deps, onError, onNetworkError }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [stage, setStage] = useState<Stage>('booting');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [bootSlow, setBootSlow] = useState(false);
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setStage('booting');
    setErrorText(null);
    setNetworkError(null);
    setBootSlow(false);
    setBootTimedOut(false);
    const slow = window.setTimeout(() => setBootSlow(true), BOOT_HINT_AFTER_MS);
    const dead = window.setTimeout(() => setBootTimedOut(true), BOOT_TIMEOUT_MS);
    return () => { window.clearTimeout(slow); window.clearTimeout(dead); };
  }, [reloadKey]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== RUNTIME_ORIGIN) return;
      if (e.source !== ref.current?.contentWindow) return;

      let msg: ShellMessage;
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      if (!msg || !msg.stage) return;

      if (msg.stage === 'ready') {
        setStage('ready');
        const payload = { type: 'mount' as const, source, kind, deps };
        ref.current!.contentWindow!.postMessage(JSON.stringify(payload), RUNTIME_ORIGIN);
      } else if (msg.stage === 'mounted') {
        setStage('mounted');
        setBootSlow(false);
        setBootTimedOut(false);
      } else if (msg.stage === 'error') {
        const detail = String(msg.detail ?? 'Unknown error');
        setStage('error');
        setErrorText(detail);
        onError?.(detail);
      } else if (msg.stage === 'network-error') {
        const detail = msg.detail as { url?: string; message?: string } | undefined;
        setNetworkError(detail?.message ?? 'Network request failed');
        onNetworkError?.(detail ?? {});
      } else if (msg.stage === 'dep-error') {
        console.warn('[sandbox] dep failed to load', msg.detail);
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [source, kind, deps, onError, onNetworkError, reloadKey]);

  function reload() { setReloadKey((k) => k + 1); }

  const stillLoading = stage === 'booting' || stage === 'ready';

  return (
    <div className="relative h-full w-full bg-paper">
      <iframe
        key={reloadKey}
        ref={ref}
        title="SANDBOX artifact"
        src={SHELL_URL}
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        className="h-full w-full border-0 bg-paper"
      />

      {stillLoading && bootSlow && !bootTimedOut && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/80">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-paper-alt">
            <div className="h-full w-1/3 animate-pulse bg-ink-soft" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            {stage === 'booting' ? 'booting runtime' : 'mounting artifact'}
          </div>
        </div>
      )}

      {stillLoading && bootTimedOut && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/95 p-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-destructive">runtime didn’t reply</div>
          <div className="max-w-sm text-sm text-ink-soft">
            The sandboxed iframe hasn’t reported back within {BOOT_TIMEOUT_MS / 1000}s. The runtime origin may be unreachable or blocked by a browser extension.
          </div>
          <button
            onClick={reload}
            className="rounded-xl border-[1.5px] border-ink bg-card px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Retry
          </button>
        </div>
      )}

      {stage === 'error' && errorText && (
        <div className="absolute inset-0 flex flex-col bg-paper/95">
          <div className="flex items-center gap-3 border-b border-divider px-6 py-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-destructive">artifact error</span>
            <div className="flex-1" />
            <button
              onClick={reload}
              className="rounded-xl border-[1.5px] border-ink bg-card px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              Reload
            </button>
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre-wrap p-6 font-mono text-[13px] leading-[1.45] text-destructive">{errorText}</pre>
        </div>
      )}

      {networkError && (
        <div
          role="status"
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-destructive bg-paper px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-destructive shadow"
        >
          <span>offline · {networkError}</span>
          <button
            onClick={() => setNetworkError(null)}
            aria-label="Dismiss"
            className="text-destructive/70 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-accent rounded"
          >×</button>
        </div>
      )}
    </div>
  );
}
