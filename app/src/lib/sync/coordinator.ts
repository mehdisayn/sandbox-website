// High-level sign-in / sign-out / connect-on-boot coordinator. Glues
// auth + account + migration + engine + active repo swap together so the UI
// only deals with one state machine.

import {
  fetchUserInfo,
  interactiveSignIn,
  isConfigured,
  silentSignIn,
  signOut as gisSignOut,
  type GoogleProfile,
} from '../auth/google';
import {
  checkAccount,
  clearPreviousUser,
  getCloudEnabled,
  loadPreviousUser,
  savePreviousUser,
  setCloudEnabled,
  type AccountCheck,
} from '../auth/account';
import { db } from '../repo/dexie';
import { setActiveArtifactRepo, setActivePrefsRepo } from '../repo/active';
import { DexieArtifactRepo, DexiePrefsRepo } from '../repo/dexie-repos';
import { DriveArtifactRepo, DrivePrefsRepo } from '../repo/drive-repos';
import { reconcile } from './reconcile';
import { startEngine, stopEngine } from './engine';
import { clearAll as clearQueue } from './queue';
import {
  resolveLocalExtras,
  runFirstSignInMigration,
  type MigrationOutcome,
  type PromptDecision,
} from '../migration/first-signin';

// Singletons we own so the swap is reversible.
const dexieArtifacts = new DexieArtifactRepo();
const dexiePrefs = new DexiePrefsRepo();
const driveArtifacts = new DriveArtifactRepo(dexieArtifacts);
const drivePrefs = new DrivePrefsRepo(dexiePrefs);

export type SyncStatus =
  | { kind: 'unconfigured' }                             // no VITE_GOOGLE_CLIENT_ID
  | { kind: 'signed-out' }
  | { kind: 'signing-in' }
  | { kind: 'awaiting-account-switch'; check: Extract<AccountCheck, { kind: 'account-switch' }>; profile: GoogleProfile }
  | { kind: 'awaiting-migration-prompt'; profile: GoogleProfile; outcome: Extract<MigrationOutcome, { kind: 'needs-prompt' }> }
  | { kind: 'signed-in'; profile: GoogleProfile }
  | { kind: 'error'; message: string };

let status: SyncStatus = isConfigured() ? { kind: 'signed-out' } : { kind: 'unconfigured' };
let listeners = new Set<(s: SyncStatus) => void>();

export function getStatus(): SyncStatus { return status; }
export function onStatusChange(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => { listeners.delete(fn); };
}
function setStatus(next: SyncStatus) {
  status = next;
  for (const fn of listeners) try { fn(next); } catch { /* ignore */ }
}

function activateDriveRepos(): void {
  setActiveArtifactRepo(driveArtifacts);
  setActivePrefsRepo(drivePrefs);
}
function deactivateDriveRepos(): void {
  setActiveArtifactRepo(dexieArtifacts);
  setActivePrefsRepo(dexiePrefs);
}

async function postSignInFlow(profile: GoogleProfile): Promise<void> {
  await savePreviousUser(profile);
  await setCloudEnabled(true);
  activateDriveRepos();
  startEngine();
  const outcome = await runFirstSignInMigration();
  if (outcome.kind === 'needs-prompt') {
    setStatus({ kind: 'awaiting-migration-prompt', profile, outcome });
    return;
  }
  setStatus({ kind: 'signed-in', profile });
}

export async function startInteractiveSignIn(): Promise<void> {
  if (!isConfigured()) return;
  setStatus({ kind: 'signing-in' });
  try {
    const t = await interactiveSignIn();
    const profile = await fetchUserInfo(t.token);
    const check = await checkAccount(profile);
    if (check.kind === 'account-switch') {
      setStatus({ kind: 'awaiting-account-switch', check, profile });
      return;
    }
    await postSignInFlow(profile);
  } catch (err) {
    setStatus({ kind: 'error', message: (err as Error).message });
  }
}

export async function attemptSilentSignIn(): Promise<void> {
  if (!isConfigured()) return;
  if (!(await getCloudEnabled())) return;
  try {
    const t = await silentSignIn();
    const profile = await fetchUserInfo(t.token);
    const prev = await loadPreviousUser();
    if (prev && prev.sub !== profile.sub) {
      // Silent re-auth handed us a different account — be safe, stay
      // signed-out and let the user decide explicitly.
      await gisSignOut();
      setStatus({ kind: 'signed-out' });
      return;
    }
    await postSignInFlow(profile);
  } catch {
    // Silent failed — sit in signed-out mode; user can click sign-in.
    setStatus({ kind: 'signed-out' });
  }
}

export async function resolveAccountSwitch(action: 'wipe-and-continue' | 'cancel'): Promise<void> {
  if (status.kind !== 'awaiting-account-switch') return;
  if (action === 'cancel') {
    await gisSignOut();
    setStatus({ kind: 'signed-out' });
    return;
  }
  // wipe-and-continue: drop Dexie content (keeps prefs.cloud_enabled getting reset by the caller).
  await db.transaction('rw', ['artifacts', 'dependencies', 'artifactDeps', 'syncQueue'], async () => {
    await Promise.all([
      db.artifacts.clear(),
      db.dependencies.clear(),
      db.artifactDeps.clear(),
      db.syncQueue.clear(),
    ]);
  });
  await clearPreviousUser();
  const profile = status.profile;
  await postSignInFlow(profile);
}

export async function resolveMigrationPrompt(decision: PromptDecision): Promise<void> {
  if (status.kind !== 'awaiting-migration-prompt') return;
  const { profile, outcome } = status;
  await resolveLocalExtras(decision, outcome.localExtras);
  setStatus({ kind: 'signed-in', profile });
}

export type SignOutChoice = 'keep-local' | 'wipe-local';

export async function signOut(choice: SignOutChoice): Promise<void> {
  stopEngine();
  await clearQueue();
  deactivateDriveRepos();
  await setCloudEnabled(false);
  await gisSignOut();
  if (choice === 'wipe-local') {
    await db.transaction('rw', ['artifacts', 'dependencies', 'artifactDeps', 'syncQueue'], async () => {
      await Promise.all([
        db.artifacts.clear(),
        db.dependencies.clear(),
        db.artifactDeps.clear(),
        db.syncQueue.clear(),
      ]);
    });
    // Re-seed sample on next reload by clearing prefs flag too.
    await clearPreviousUser();
  }
  setStatus({ kind: 'signed-out' });
}

export async function forceResync(): Promise<void> {
  if (status.kind !== 'signed-in') return;
  await reconcile();
}
