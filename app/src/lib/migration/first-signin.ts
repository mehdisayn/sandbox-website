// First-sign-in migration. Inspects local + remote state and decides how to
// merge them. The seeded SAMPLE_ARTIFACT is detected by id and excluded from
// upload so it doesn't clutter every fresh device. See plan §6.

import { db } from '../repo/dexie';
import { loadManifest } from '../cloud/manifest';
import { reconcile } from '../sync/reconcile';
import { enqueue } from '../sync/queue';
import { SAMPLE_ARTIFACT } from '../sample-artifact';

const SEEDED_IDS = new Set([SAMPLE_ARTIFACT.id]);

export type MigrationOutcome =
  | { kind: 'first-ever' }                                 // empty here, empty there
  | { kind: 'pull-only'; pulled: number }                   // empty here, things there
  | { kind: 'pushed'; pushed: number }                       // things here, empty there → silently upload
  | { kind: 'merged'; pulled: number; pushed: number }       // both → reconcile, no prompt
  | { kind: 'needs-prompt'; localExtras: string[]; remoteCount: number }; // ambiguous

async function userArtifactCount(): Promise<number> {
  const all = await db.artifacts.toArray();
  return all.filter((a) => !SEEDED_IDS.has(a.id)).length;
}

async function userArtifactIds(): Promise<string[]> {
  const all = await db.artifacts.toArray();
  return all.filter((a) => !SEEDED_IDS.has(a.id)).map((a) => a.id);
}

export async function runFirstSignInMigration(): Promise<MigrationOutcome> {
  const localCount = await userArtifactCount();
  const remote = await loadManifest();

  if (localCount === 0 && !remote) {
    return { kind: 'first-ever' };
  }

  if (localCount === 0 && remote) {
    const summary = await reconcile();
    return { kind: 'pull-only', pulled: summary.pulled };
  }

  if (localCount > 0 && !remote) {
    // Push everything (minus seeded sample).
    const ids = await userArtifactIds();
    for (const id of ids) {
      await enqueue({ op: 'artifact.put', key: id, payload: { id } });
    }
    return { kind: 'pushed', pushed: ids.length };
  }

  // Both present. Reconcile (pulls + queues pushes for local-only).
  const summary = await reconcile();
  const remoteIds = new Set((remote!.data.artifacts).map((a) => a.id));
  const localExtras = (await userArtifactIds()).filter((id) => !remoteIds.has(id));

  if (localExtras.length === 0) {
    return { kind: 'merged', pulled: summary.pulled, pushed: 0 };
  }

  // Ambiguous — caller surfaces the prompt and re-invokes with a decision.
  return { kind: 'needs-prompt', localExtras, remoteCount: remoteIds.size };
}

export type PromptDecision = 'add' | 'keep-local-only' | 'discard';

export async function resolveLocalExtras(decision: PromptDecision, ids: string[]): Promise<void> {
  if (decision === 'keep-local-only') return; // do nothing — stay local-only for these
  if (decision === 'discard') {
    await db.artifacts.bulkDelete(ids);
    return;
  }
  // 'add' — push each to Drive.
  for (const id of ids) {
    await enqueue({ op: 'artifact.put', key: id, payload: { id } });
  }
}
