// Built-in LLM provider presets for the Agent screen. The "free" flag is
// advisory — it informs the picker UI; whether a key actually has free quota
// is up to the provider. v1 ships OpenAI-compatible only, which covers all
// four presets below.

export type Preset = {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  free: boolean;
  docsUrl: string;
  keyHint: string;
};

export const PRESETS: Preset[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.0-flash',
    free: true,
    docsUrl: 'https://aistudio.google.com/apikey',
    keyHint: 'AI Studio → Get API key. The free tier covers casual use.',
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/',
    defaultModel: 'llama-3.3-70b-versatile',
    free: true,
    docsUrl: 'https://console.groq.com/keys',
    keyHint: 'Free tier with per-day token limits. Very fast inference.',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    free: true,
    docsUrl: 'https://openrouter.ai/keys',
    keyHint: 'Use any model ending in :free for the free tier.',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    defaultModel: '',
    free: false,
    docsUrl: '',
    keyHint: 'Any OpenAI-compatible endpoint — paste base URL, model, key.',
  },
];

export function getPreset(id: string): Preset | null {
  return PRESETS.find((p) => p.id === id) ?? null;
}
