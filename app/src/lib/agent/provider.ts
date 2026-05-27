// LLM provider interface + an OpenAI-compatible streaming implementation.
// Anthropic-native and other providers can implement LLMProvider later
// without changing callers.

export type ChatRole = 'user' | 'assistant' | 'system';
export type ChatMessage = { role: ChatRole; content: string };

export interface LLMProvider {
  stream(opts: {
    system: string;
    messages: ChatMessage[];
    signal?: AbortSignal;
  }): AsyncIterable<string>;
}

export type OpenAICompatibleOpts = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

function joinUrl(base: string, path: string): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

export function openAICompatibleProvider(cfg: OpenAICompatibleOpts): LLMProvider {
  return {
    async *stream({ system, messages, signal }) {
      const url = joinUrl(cfg.baseUrl, 'chat/completions');
      const body = {
        model: cfg.model,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
      const res = await fetch(url, { method: 'POST', signal, headers, body: JSON.stringify(body) });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Provider returned HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      if (!res.body) throw new Error('Provider returned no response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Server-sent events come as "data: {…}\n\n" blocks.
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) yield delta;
          } catch {
            // Some providers prefix with junk lines — ignore unparseable payloads.
          }
        }
      }
    },
  };
}

// Single-shot smoke test used by the Settings "Test connection" button.
export async function testConnection(cfg: OpenAICompatibleOpts): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const url = joinUrl(cfg.baseUrl, 'chat/completions');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model,
        stream: false,
        messages: [{ role: 'user', content: 'reply with the single word: ok' }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
