import { useEffect, useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { Caption } from '../../components/ui/Caption';
import { Btn } from '../../components/ui/Btn';
import { Input } from '../../components/ui/Input';
import { Pill } from '../../components/ui/Pill';
import { PRESETS, getPreset } from '../../lib/agent/presets';
import { testConnection } from '../../lib/agent/provider';
import { getAgentConfig, setAgentConfig, type AgentConfig } from '../../lib/prefs';

const EMPTY: AgentConfig = { providerId: '', baseUrl: '', model: '', apiKey: '' };

export function AgentSettings() {
  const [cfg, setCfg] = useState<AgentConfig>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAgentConfig().then((c) => {
      setCfg(c);
      setLoaded(true);
    });
  }, []);

  function applyPreset(id: string) {
    setTestResult(null);
    setSaved(false);
    const p = getPreset(id);
    if (!p || id === 'custom') {
      setCfg((c) => ({ ...c, providerId: id }));
      return;
    }
    setCfg((c) => ({
      providerId: p.id,
      baseUrl: p.baseUrl,
      model: c.model && c.providerId === p.id ? c.model : p.defaultModel,
      apiKey: c.apiKey,
    }));
  }

  async function save() {
    await setAgentConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function test() {
    setTesting(true);
    setTestResult(null);
    const r = await testConnection({
      baseUrl: cfg.baseUrl,
      model: cfg.model,
      apiKey: cfg.apiKey,
    });
    setTesting(false);
    setTestResult(r.ok ? { ok: true, msg: 'Connected — provider responded.' } : { ok: false, msg: r.error });
  }

  const preset = getPreset(cfg.providerId);
  const needsKey = preset ? preset.requiresKey : true;
  const canTest = !!cfg.baseUrl && !!cfg.model && (!needsKey || !!cfg.apiKey) && !testing;
  const canSave = loaded && (!!cfg.providerId || cfg.providerId === 'custom');

  return (
    <SettingsLayout title="Agent">
      <Group label="Provider">
        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
          {PRESETS.map((p) => {
            const active = cfg.providerId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={[
                  'flex flex-col gap-1 rounded-xl border-[1.5px] px-3 py-2.5 text-left',
                  'focus:outline-none focus:ring-2 focus:ring-accent',
                  active ? 'border-ink bg-paper-alt' : 'border-border bg-card hover:border-ink-soft',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{p.label}</span>
                  {p.free && <Pill tone="accent">free</Pill>}
                </div>
                <div className="font-mono text-[10px] text-ink-soft">{p.keyHint}</div>
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Connection">
        <div className="flex flex-col gap-3 p-4">
          <label className="flex flex-col gap-1">
            <Caption>Base URL</Caption>
            <Input
              mono
              placeholder="https://api.example.com/v1/"
              value={cfg.baseUrl}
              onChange={(e) => { setCfg({ ...cfg, baseUrl: e.target.value }); setTestResult(null); setSaved(false); }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <Caption>Model</Caption>
            <Input
              mono
              placeholder="model-id"
              value={cfg.model}
              onChange={(e) => { setCfg({ ...cfg, model: e.target.value }); setTestResult(null); setSaved(false); }}
            />
          </label>

          <label className="flex flex-col gap-1">
            <Caption>API key {needsKey ? '' : '(not required)'}</Caption>
            <Input
              mono
              type={showKey ? 'text' : 'password'}
              placeholder={needsKey ? 'sk-…' : 'leave blank'}
              autoComplete="off"
              disabled={!needsKey}
              value={cfg.apiKey}
              onChange={(e) => { setCfg({ ...cfg, apiKey: e.target.value }); setTestResult(null); setSaved(false); }}
            />
            <div className="flex items-center justify-between pt-1">
              {needsKey ? (
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="font-mono text-[10px] uppercase tracking-widest text-ink-soft hover:text-ink"
                >
                  {showKey ? '· hide key' : '· show key'}
                </button>
              ) : <span />}
              {preset && preset.docsUrl && (
                <a
                  href={preset.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] uppercase tracking-widest text-ink-soft hover:text-ink"
                >
                  {needsKey ? 'Get key ↗' : 'Learn more ↗'}
                </a>
              )}
            </div>
          </label>

          <div className="flex items-center gap-2">
            <Btn onClick={test} disabled={!canTest}>{testing ? 'Testing…' : 'Test connection'}</Btn>
            <Btn variant="primary" onClick={save} disabled={!canSave}>Save</Btn>
            {saved && <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">saved</span>}
          </div>

          {testResult && (
            <div
              className={[
                'rounded-lg border bg-paper-alt px-3 py-2 font-mono text-xs',
                testResult.ok ? 'border-border text-ink-soft' : 'border-destructive text-destructive',
              ].join(' ')}
            >
              {testResult.msg}
            </div>
          )}
        </div>
      </Group>

      <Group label="How it works">
        <div className="flex flex-col gap-2 p-4 text-[12px] text-ink-soft">
          <p>
            The Agent screen sends your prompt directly from this browser to the configured provider — there's no SANDBOX backend in between. Your key is stored locally in IndexedDB along with the rest of your library.
          </p>
          <p>
            Generated code lands in the right pane. Nothing is written to your library until you click <span className="font-mono">Save</span> on that screen.
          </p>
          <p>
            The <span className="font-mono">Allow network</span> toggle in Settings also gates agent requests — turn it off to block all outbound calls.
          </p>
        </div>
      </Group>
    </SettingsLayout>
  );
}
