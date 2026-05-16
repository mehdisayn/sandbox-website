// Typed wrapper around PrefsRepo for known preference keys.

import { prefsRepo } from './repo/dexie-repos';

export const PREF_KEYS = {
  theme: 'theme',                // 'system' | 'light' | 'dark'
  accent: 'accent',              // hex string
  allowNetwork: 'allow_network', // 'on' | 'off'
} as const;

export type NetworkPref = 'on' | 'off';

export async function getNetworkPref(): Promise<NetworkPref> {
  const v = await prefsRepo.get<NetworkPref>(PREF_KEYS.allowNetwork);
  return v === 'off' ? 'off' : 'on';
}

export async function setNetworkPref(v: NetworkPref): Promise<void> {
  await prefsRepo.set(PREF_KEYS.allowNetwork, v);
}
