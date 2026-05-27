// Dexie-backed FIFO with per-(op,key) coalescing.
//
// Coalescing: three renames of the same artifact in quick succession produce
// one Drive write, not three. When `enqueue` finds a pending op with the same
// (op, key) tuple, it replaces the payload in place rather than appending.

import { db } from '../repo/dexie';
import type { SyncQueueRow } from '../repo/dexie';

export type EnqueueInput = Omit<SyncQueueRow, 'id' | 'attemptCount' | 'lastError' | 'enqueuedAt'>;

let listeners = new Set<() => void>();

export function onQueueChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function notify() { for (const fn of listeners) try { fn(); } catch { /* ignore */ } }

export async function enqueue(input: EnqueueInput): Promise<void> {
  await db.transaction('rw', db.syncQueue, async () => {
    const existing = await db.syncQueue
      .where('key').equals(input.key)
      .filter((r) => r.op === input.op)
      .first();
    if (existing) {
      await db.syncQueue.update(existing.id, {
        payload: input.payload,
        enqueuedAt: Date.now(),
        // Don't reset attemptCount on coalesce — we still want to back off.
      });
    } else {
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        op: input.op,
        key: input.key,
        payload: input.payload,
        attemptCount: 0,
        lastError: null,
        enqueuedAt: Date.now(),
      });
    }
  });
  notify();
}

export async function peek(): Promise<SyncQueueRow | null> {
  const rows = await db.syncQueue.orderBy('enqueuedAt').limit(1).toArray();
  return rows[0] ?? null;
}

export async function depth(): Promise<number> {
  return db.syncQueue.count();
}

export async function complete(id: string): Promise<void> {
  await db.syncQueue.delete(id);
  notify();
}

export async function recordFailure(id: string, error: string): Promise<number> {
  const row = await db.syncQueue.get(id);
  if (!row) return 0;
  const attemptCount = row.attemptCount + 1;
  await db.syncQueue.update(id, { attemptCount, lastError: error });
  notify();
  return attemptCount;
}

export async function clearAll(): Promise<void> {
  await db.syncQueue.clear();
  notify();
}

// Exponential backoff with jitter. Caps at 60s.
export function backoffMs(attemptCount: number): number {
  const base = Math.min(60_000, 2_000 * 2 ** (attemptCount - 1));
  const jitter = base * 0.2 * Math.random();
  return base + jitter;
}
