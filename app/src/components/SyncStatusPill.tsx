// Sidebar footer pill that shows current sync state. Plain text + a tone color.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { onStateChange, type EngineState } from '../lib/sync/engine';
import { getStatus, onStatusChange, type SyncStatus } from '../lib/sync/coordinator';

export function SyncStatusPill() {
  const [status, setStatus] = useState<SyncStatus>(getStatus());
  const [engine, setEngine] = useState<EngineState>({ kind: 'idle', queueDepth: 0 });

  useEffect(() => onStatusChange(setStatus), []);
  useEffect(() => onStateChange(setEngine), []);

  if (status.kind === 'unconfigured') return null;

  const label = describe(status, engine);
  const tone = toneFor(status, engine);

  return (
    <Link
      to="/settings/sync"
      className={[
        'flex items-center gap-1.5 rounded-full border px-2 py-0.5',
        'font-mono text-[9px] uppercase tracking-widest',
        'transition-colors hover:bg-paper',
        tone,
      ].join(' ')}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
    </Link>
  );
}

function describe(status: SyncStatus, engine: EngineState): string {
  switch (status.kind) {
    case 'signed-out':                  return 'Local only';
    case 'signing-in':                  return 'Signing in…';
    case 'awaiting-account-switch':     return 'Account switch';
    case 'awaiting-migration-prompt':   return 'Merge needed';
    case 'error':                       return 'Sync error';
    case 'signed-in': break;
    default: return '';
  }
  if (engine.kind === 'running' && engine.queueDepth > 0) return `Syncing · ${engine.queueDepth}`;
  if (engine.kind === 'offline') return 'Offline';
  if (engine.kind === 'error') return 'Sync error';
  if (engine.queueDepth > 0) return `Queued · ${engine.queueDepth}`;
  return 'Synced';
}

function toneFor(status: SyncStatus, engine: EngineState): string {
  if (status.kind === 'error' || engine.kind === 'error') return 'border-destructive text-destructive';
  if (status.kind === 'signed-out') return 'border-divider text-ink-soft';
  if (engine.kind === 'offline') return 'border-border text-ink-soft';
  if (engine.kind === 'running' || engine.queueDepth > 0) return 'border-accent text-ink';
  return 'border-border text-ink-soft';
}
