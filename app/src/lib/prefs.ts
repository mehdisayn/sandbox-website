// Typed wrapper around PrefsRepo for known preference keys.

import { prefsRepo } from './repo/dexie-repos';

export const PREF_KEYS = {
  theme: 'theme',                // 'system' | 'light' | 'dark'
  accent: 'accent',              // hex string
  allowNetwork: 'allow_network', // 'on' | 'off'
  agentProvider: 'agent_provider_id', // preset id from agent/presets.ts
  agentBaseUrl: 'agent_base_url',
  agentModel: 'agent_model',
  agentApiKey: 'agent_api_key',
} as const;

export type NetworkPref = 'on' | 'off';

export async function getNetworkPref(): Promise<NetworkPref> {
  const v = await prefsRepo.get<NetworkPref>(PREF_KEYS.allowNetwork);
  return v === 'off' ? 'off' : 'on';
}

export async function setNetworkPref(v: NetworkPref): Promise<void> {
  await prefsRepo.set(PREF_KEYS.allowNetwork, v);
}

export type AgentConfig = {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
};

export async function getAgentConfig(): Promise<AgentConfig> {
  const [providerId, baseUrl, model, apiKey] = await Promise.all([
    prefsRepo.get<string>(PREF_KEYS.agentProvider),
    prefsRepo.get<string>(PREF_KEYS.agentBaseUrl),
    prefsRepo.get<string>(PREF_KEYS.agentModel),
    prefsRepo.get<string>(PREF_KEYS.agentApiKey),
  ]);
  return {
    providerId: providerId ?? '',
    baseUrl: baseUrl ?? '',
    model: model ?? '',
    apiKey: apiKey ?? '',
  };
}

export async function setAgentConfig(c: AgentConfig): Promise<void> {
  await Promise.all([
    prefsRepo.set(PREF_KEYS.agentProvider, c.providerId),
    prefsRepo.set(PREF_KEYS.agentBaseUrl, c.baseUrl),
    prefsRepo.set(PREF_KEYS.agentModel, c.model),
    prefsRepo.set(PREF_KEYS.agentApiKey, c.apiKey),
  ]);
}
