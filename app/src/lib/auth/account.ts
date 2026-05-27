// Account state: who is currently signed in, who was last signed in, and
// detection of the dangerous "different user just signed in on this browser"
// case (see plan §7 — account-switch protection).

import { prefsRepo } from '../repo/active';
import type { GoogleProfile } from './google';

const PREV_USER_KEY = 'google_user';
const CLOUD_ENABLED_KEY = 'cloud_enabled';

export async function loadPreviousUser(): Promise<GoogleProfile | null> {
  return prefsRepo.get<GoogleProfile>(PREV_USER_KEY);
}

export async function savePreviousUser(profile: GoogleProfile): Promise<void> {
  await prefsRepo.set(PREV_USER_KEY, profile);
}

export async function clearPreviousUser(): Promise<void> {
  await prefsRepo.set(PREV_USER_KEY, null as unknown as GoogleProfile);
}

export async function getCloudEnabled(): Promise<boolean> {
  return (await prefsRepo.get<boolean>(CLOUD_ENABLED_KEY)) === true;
}

export async function setCloudEnabled(v: boolean): Promise<void> {
  await prefsRepo.set(CLOUD_ENABLED_KEY, v);
}

export type AccountCheck =
  | { kind: 'first-sign-in' }                              // no previous user on this device
  | { kind: 'same-account', profile: GoogleProfile }       // sub matches
  | { kind: 'account-switch', previous: GoogleProfile, next: GoogleProfile };

// Compare the just-fetched profile against the one we last saved. The caller
// is expected to surface 'account-switch' to the user before continuing.
export async function checkAccount(next: GoogleProfile): Promise<AccountCheck> {
  const prev = await loadPreviousUser();
  if (!prev) return { kind: 'first-sign-in' };
  if (prev.sub === next.sub) return { kind: 'same-account', profile: next };
  return { kind: 'account-switch', previous: prev, next };
}
