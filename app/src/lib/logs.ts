// In-memory console capture. Installed once at app boot. Ring buffer caps
// memory; subscribers re-render on change.

export type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export type LogEntry = {
  id: number;
  level: LogLevel;
  message: string;
  timestamp: number;
};

const MAX = 500;
const buffer: LogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function push(level: LogLevel, args: unknown[]) {
  const message = args.map((a) => {
    if (a instanceof Error) return a.stack ?? `${a.name}: ${a.message}`;
    if (typeof a === 'string') return a;
    try { return JSON.stringify(a); } catch { return String(a); }
  }).join(' ');
  buffer.push({ id: nextId++, level, message, timestamp: Date.now() });
  if (buffer.length > MAX) buffer.splice(0, buffer.length - MAX);
  listeners.forEach((fn) => fn());
}

let installed = false;
export function installLogCapture(): void {
  if (installed) return;
  installed = true;
  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((level) => {
    const orig = console[level].bind(console);
    console[level] = (...args: unknown[]) => { push(level, args); orig(...args); };
  });
}

export function snapshot(): LogEntry[] { return buffer.slice(); }
export function clearLogs(): void { buffer.length = 0; listeners.forEach((fn) => fn()); }
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
