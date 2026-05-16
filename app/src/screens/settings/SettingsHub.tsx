// Settings hub. DESIGN.md §7.7.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { Row } from '../../components/ui/Row';
import { db } from '../../lib/repo/dexie';
import { getNetworkPref, setNetworkPref, type NetworkPref } from '../../lib/prefs';

export function SettingsHub() {
  const navigate = useNavigate();
  const [network, setNetwork] = useState<NetworkPref>('on');

  useEffect(() => { getNetworkPref().then(setNetwork); }, []);

  async function toggleNetwork() {
    const next: NetworkPref = network === 'on' ? 'off' : 'on';
    setNetwork(next);
    await setNetworkPref(next);
  }

  async function resetLibrary() {
    if (!window.confirm('Reset library? This deletes ALL artifacts, dependencies, icons, and preferences. Cannot be undone.')) return;
    await db.transaction(
      'rw',
      ['artifacts', 'dependencies', 'artifactDeps', 'prefs', 'icons'],
      async () => {
        await Promise.all([
          db.artifacts.clear(),
          db.dependencies.clear(),
          db.artifactDeps.clear(),
          db.icons.clear(),
          db.prefs.clear(),
        ]);
      }
    );
    window.location.href = '/';
  }

  return (
    <SettingsLayout title="Settings" back={null}>
      <Group label="Personalization">
        <Row label="Appearance"   iconType="glyph" iconValue="◐" iconFill="lilac" onClick={() => navigate('/settings/appearance')} />
        <Row label="Featured mini-apps" iconType="glyph" iconValue="★" iconFill="sand" onClick={() => navigate('/settings/featured')} last />
      </Group>

      <Group label="Data">
        <Row label="Dependencies" iconType="glyph" iconValue="⧉" iconFill="sky" onClick={() => navigate('/settings/dependencies')} />
        <Row label="Storage"      iconType="glyph" iconValue="◫" iconFill="mist" onClick={() => navigate('/settings/storage')} />
        <Row label="Logs"         iconType="glyph" iconValue="≡" iconFill="stone" onClick={() => navigate('/settings/logs')} last />
      </Group>

      <Group label="Behavior">
        <Toggle
          label="Allow network"
          hint="When off, dependency fetching is blocked. Already-cached deps still work."
          value={network === 'on'}
          onChange={toggleNetwork}
          last
        />
      </Group>

      <Group label="About">
        <Row label="About"   iconType="glyph" iconValue="i" iconFill="sage" onClick={() => navigate('/settings/about')} />
        <Row label="Credits" iconType="glyph" iconValue="◊" iconFill="olive" onClick={() => navigate('/settings/credits')} last />
      </Group>

      <Group label="Danger zone">
        <Row label="Reset library" iconType="glyph" iconValue="⌫" iconFill="clay" danger onClick={resetLibrary} chevron={false} last />
      </Group>
    </SettingsLayout>
  );
}

function Toggle({ label, hint, value, onChange, last }: { label: string; hint?: string; value: boolean; onChange: () => void; last?: boolean }) {
  return (
    <div className={['flex items-center gap-3 px-3.5 py-3', last ? '' : 'border-b border-divider'].join(' ')}>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] text-ink-soft">{hint}</div>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className={[
          'relative h-6 w-11 shrink-0 rounded-full border-[1.5px] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-accent',
          value ? 'border-ink bg-ink' : 'border-border bg-card',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-[2px] h-[16px] w-[16px] rounded-full transition-all',
            value ? 'left-[22px] bg-paper' : 'left-[2px] bg-ink',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
