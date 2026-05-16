import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { Pill } from '../../components/ui/Pill';
import { clearLogs, snapshot, subscribe, type LogEntry, type LogLevel } from '../../lib/logs';

const LEVELS: LogLevel[] = ['log', 'info', 'warn', 'error', 'debug'];
const LEVEL_TONE: Record<LogLevel, 'neutral' | 'accent' | 'danger' | 'ink'> = {
  log: 'neutral', info: 'neutral', debug: 'neutral', warn: 'accent', error: 'danger',
};

export function Logs() {
  const entries = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Set<LogLevel>>(() => new Set(LEVELS));

  // Persist filter selection within session.
  useEffect(() => {
    const raw = sessionStorage.getItem('sb:logs-levels');
    if (raw) setActive(new Set(raw.split(',') as LogLevel[]));
  }, []);
  useEffect(() => { sessionStorage.setItem('sb:logs-levels', [...active].join(',')); }, [active]);

  const filtered = useMemo<LogEntry[]>(() => {
    const lower = q.trim().toLowerCase();
    return entries.filter((e) =>
      active.has(e.level) && (!lower || e.message.toLowerCase().includes(lower))
    );
  }, [entries, q, active]);

  function toggleLevel(l: LogLevel) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l); else next.add(l);
      return next.size === 0 ? new Set(LEVELS) : next;
    });
  }

  return (
    <SettingsLayout title="Logs" right={<Btn variant="ghost" onClick={clearLogs}>Clear</Btn>}>
      <div className="flex flex-col gap-3">
        <Input leading="⌕" placeholder="filter…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => (
            <button key={l} onClick={() => toggleLevel(l)} className="focus:outline-none focus:ring-2 focus:ring-accent rounded-full">
              <Pill tone={active.has(l) ? LEVEL_TONE[l] : 'neutral'}>{l.toUpperCase()}</Pill>
            </button>
          ))}
          <span className="ml-auto font-mono text-[11px] text-ink-faint">{filtered.length} / {entries.length}</span>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-3.5 py-6 text-center font-mono text-[11px] text-ink-faint">no entries</div>
          ) : filtered.slice().reverse().map((e) => (
            <div key={e.id} className="grid grid-cols-[64px_56px_1fr] gap-3 border-b border-divider px-3.5 py-2 last:border-b-0">
              <span className="font-mono text-[10px] text-ink-faint">{new Date(e.timestamp).toLocaleTimeString()}</span>
              <Pill tone={LEVEL_TONE[e.level]}>{e.level.toUpperCase()}</Pill>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-ink">{e.message}</pre>
            </div>
          ))}
        </div>
      </div>
    </SettingsLayout>
  );
}
