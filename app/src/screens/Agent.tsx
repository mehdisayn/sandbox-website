// Agent screen — chat-style prompt → artifact. Streaming generation;
// preview-before-save. Reuses artifactRepo.create + ensureArtifactDeps so the
// output goes through the same pipeline as hand-pasted artifacts.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { CodeEditor } from '../components/CodeEditor';
import { IconPicker, type IconValue } from '../components/IconPicker';
import { Btn } from '../components/ui/Btn';
import { Input } from '../components/ui/Input';
import { Pill } from '../components/ui/Pill';
import { Caption } from '../components/ui/Caption';
import { artifactRepo } from '../lib/repo/active';
import { sizeBytes } from '../lib/artifacts';
import { detectImports } from '../lib/import-detector';
import { ensureArtifactDeps } from '../lib/dep-fetcher';
import { getAgentConfig, getNetworkPref, type AgentConfig } from '../lib/prefs';
import { openAICompatibleProvider, type ChatMessage } from '../lib/agent/provider';
import { SYSTEM_PROMPT } from '../lib/agent/system-prompt';
import { extractCodeBlock, extractProse, extractSuggestedName } from '../lib/agent/extract';
import type { FileKind } from '../lib/repo/types';

const DEFAULT_ICON: IconValue = { iconType: 'glyph', iconValue: 'AI', iconFill: 'lilac' };

type Turn = { role: 'user' | 'assistant'; content: string };

export function Agent() {
  const navigate = useNavigate();

  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [networkOn, setNetworkOn] = useState(true);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [prompt, setPrompt] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Right pane state — name + icon are user-editable; source is driven by the
  // last assistant message's code block but the user can override after
  // streaming finishes.
  const [name, setName] = useState('Untitled artifact');
  const [icon, setIcon] = useState<IconValue>(DEFAULT_ICON);
  const [nameTouched, setNameTouched] = useState(false);
  const [sourceOverride, setSourceOverride] = useState<string | null>(null);
  const [busySave, setBusySave] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    getAgentConfig().then(setCfg);
    getNetworkPref().then((p) => setNetworkOn(p === 'on'));
  }, []);

  const lastAssistant = useMemo(
    () => [...turns].reverse().find((t) => t.role === 'assistant')?.content ?? '',
    [turns]
  );
  const extracted = useMemo(() => extractCodeBlock(lastAssistant), [lastAssistant]);
  const suggestedName = useMemo(() => extractSuggestedName(lastAssistant), [lastAssistant]);

  // Auto-fill name from the model's <name>…</name> tag until the user types in it.
  useEffect(() => {
    if (!nameTouched && suggestedName) setName(suggestedName);
  }, [suggestedName, nameTouched]);

  // The source the right-pane editor displays. Override wins (user-edited).
  const source = sourceOverride ?? extracted?.source ?? '';
  const kind: FileKind = extracted?.kind ?? 'jsx';
  const canSave = source.trim().length > 0 && !!name.trim() && !busySave;
  const ready = !!cfg?.apiKey && !!cfg.baseUrl && !!cfg.model;

  async function send() {
    if (!ready || streaming) return;
    const userText = prompt.trim();
    if (!userText) return;

    if (!networkOn) {
      setError('Network is off in Settings — turn it on to call the provider.');
      return;
    }

    setError(null);
    setSourceOverride(null);
    setPrompt('');
    setSaveStatus(null);

    const nextTurns: Turn[] = [...turns, { role: 'user', content: userText }, { role: 'assistant', content: '' }];
    setTurns(nextTurns);

    const messages: ChatMessage[] = nextTurns
      .filter((t, i) => !(i === nextTurns.length - 1 && t.role === 'assistant' && t.content === ''))
      .map((t) => ({ role: t.role, content: t.content }));

    const provider = openAICompatibleProvider({
      baseUrl: cfg!.baseUrl,
      model: cfg!.model,
      apiKey: cfg!.apiKey,
    });

    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);

    try {
      let acc = '';
      for await (const delta of provider.stream({ system: SYSTEM_PROMPT, messages, signal: ac.signal })) {
        acc += delta;
        setTurns((cur) => {
          const copy = cur.slice();
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch (err) {
      const msg = (err as Error).message || 'Generation failed';
      if (!ac.signal.aborted) setError(msg);
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function save() {
    if (!canSave) return;
    setBusySave(true);
    setSaveStatus(null);
    setError(null);
    try {
      const created = await artifactRepo.create({
        name: name.trim(),
        iconType: icon.iconType,
        iconValue: icon.iconValue,
        iconFill: icon.iconFill,
        fileKind: kind,
        source,
        sizeBytes: sizeBytes(source),
      });
      const imports = detectImports(source);
      if (imports.length > 0) {
        setSaveStatus(`Fetching ${imports.length} dep${imports.length === 1 ? '' : 's'}…`);
        const summary = await ensureArtifactDeps(created.id, imports);
        if (summary.failed.length > 0) {
          const list = summary.failed.map((f) => `${f.name}: ${f.error}`).join('\n');
          setError(`Saved, but some deps failed:\n${list}`);
          setBusySave(false);
          return;
        }
      }
      navigate(`/run/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusySave(false);
    }
  }

  const bytes = useMemo(() => sizeBytes(source), [source]);
  const imports = useMemo(() => detectImports(source), [source]);

  return (
    <div className="flex h-screen bg-paper text-ink">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-divider px-4 py-3 md:px-6">
          <Link to="/library" className="font-mono text-xs uppercase tracking-widest text-ink-soft hover:text-ink">← Library</Link>
          <div className="flex-1 text-sm font-medium">Agent</div>
          {!ready && (
            <Link
              to="/settings/agent"
              className="rounded-lg border-[1.5px] border-accent bg-accent-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink"
            >
              Configure provider →
            </Link>
          )}
          {ready && (
            <Pill tone="neutral">{cfg!.model}</Pill>
          )}
        </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          {/* Left: conversation */}
          <div className="flex min-h-0 flex-1 flex-col border-divider md:border-r">
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
              {turns.length === 0 ? (
                <div className="mx-auto max-w-md py-10 text-center">
                  <div className="text-3xl">✨</div>
                  <div className="mt-3 text-sm font-medium">Describe the mini-app you want</div>
                  <div className="mt-1 text-[12px] text-ink-soft">
                    e.g. "a pomodoro timer with start, pause, and reset buttons", or "a snake game on a 20×20 grid".
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col gap-4">
                  {turns.map((t, i) => (
                    <Bubble key={i} role={t.role} text={t.role === 'assistant' ? extractProse(t.content) : t.content} streaming={streaming && i === turns.length - 1 && t.role === 'assistant'} />
                  ))}
                </div>
              )}
            </div>

            {!networkOn && (
              <div className="border-t border-destructive bg-paper-alt px-4 py-2 text-center font-mono text-[11px] text-destructive">
                Network is off — toggle "Allow network" in Settings.
              </div>
            )}

            {error && (
              <div className="border-t border-destructive bg-paper-alt px-4 py-2 font-mono text-xs whitespace-pre-wrap text-destructive">
                {error}
              </div>
            )}

            <div className="border-t border-divider p-3 md:p-4">
              <div className="mx-auto flex max-w-2xl items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder={ready ? 'Describe what to build, or how to change it…' : 'Configure a provider in Settings → Agent to get started.'}
                  disabled={!ready || streaming}
                  className={[
                    'flex-1 resize-none rounded-[10px] border-[1.5px] border-border bg-card p-3 font-sans text-[13px]',
                    'placeholder:text-ink-soft outline-none focus:ring-2 focus:ring-accent',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                  ].join(' ')}
                />
                {streaming ? (
                  <Btn onClick={stop}>Stop</Btn>
                ) : (
                  <Btn variant="primary" onClick={send} disabled={!ready || !prompt.trim()}>Send</Btn>
                )}
              </div>
            </div>
          </div>

          {/* Right: code preview + save form */}
          <div className="flex flex-col border-t border-divider md:w-[440px] md:border-t-0 md:overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-divider px-4 py-3 md:px-5">
              <Caption>Preview</Caption>
              <div className="flex-1" />
              <span className="font-mono text-[10px] text-ink-soft">{bytes} B</span>
              <Pill tone="accent">{kind.toUpperCase()}</Pill>
              {extracted && !extracted.complete && streaming && <Pill tone="neutral">streaming</Pill>}
            </div>

            <div className="flex min-h-[280px] flex-col md:h-[60%]">
              {source ? (
                <CodeEditor
                  value={source}
                  onChange={(v) => setSourceOverride(v)}
                  language={kind}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex flex-1 items-center justify-center px-6 py-10 text-center font-mono text-[11px] text-ink-faint">
                  {streaming ? 'Waiting for the first token…' : 'Generated code will appear here.'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-divider p-4 md:p-5">
              <label className="flex flex-col gap-1">
                <Caption>Name</Caption>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameTouched(true); }}
                />
              </label>

              <IconPicker value={icon} onChange={setIcon} />

              <div className="flex flex-col gap-1">
                <Caption>Detected imports</Caption>
                {imports.length === 0 ? (
                  <span className="font-mono text-[11px] text-ink-faint">none — runs without deps</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {imports.map((i) => <Pill key={i} tone="accent">{i}</Pill>)}
                  </div>
                )}
              </div>

              {saveStatus && !error && (
                <div className="rounded-lg border border-border bg-paper-alt px-3 py-2 font-mono text-xs text-ink-soft">
                  {saveStatus}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Btn variant="primary" onClick={save} disabled={!canSave}>{busySave ? 'Saving…' : 'Save to library'}</Btn>
                {sourceOverride !== null && (
                  <button
                    type="button"
                    onClick={() => setSourceOverride(null)}
                    className="font-mono text-[10px] uppercase tracking-widest text-ink-soft hover:text-ink"
                  >
                    · revert edits
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

function Bubble({ role, text, streaming }: { role: 'user' | 'assistant'; text: string; streaming: boolean }) {
  const isUser = role === 'user';
  return (
    <div className={['flex', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div
        className={[
          'max-w-[85%] whitespace-pre-wrap rounded-2xl border-[1.5px] px-3.5 py-2.5 text-[13px] leading-[1.5]',
          isUser ? 'border-ink bg-ink text-paper' : 'border-border bg-card text-ink',
        ].join(' ')}
      >
        {text || (streaming ? <span className="font-mono text-ink-soft">…</span> : <span className="font-mono text-ink-faint">(empty)</span>)}
      </div>
    </div>
  );
}
