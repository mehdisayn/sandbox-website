import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { Caption } from '../../components/ui/Caption';
import { ACCENT_PRESETS, useSettings, type ThemeMode } from '../../lib/settings-context';

export function Appearance() {
  const { theme, accent, setTheme, setAccent } = useSettings();
  const themes: { id: ThemeMode; label: string }[] = [
    { id: 'system', label: 'System' },
    { id: 'light',  label: 'Light'  },
    { id: 'dark',   label: 'Dark'   },
  ];
  return (
    <SettingsLayout title="Appearance">
      <Group label="Theme">
        <div className="grid grid-cols-3 gap-2 p-3">
          {themes.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={[
                  'rounded-xl border-[1.5px] py-3 text-sm font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-accent',
                  active ? 'border-ink bg-paper-alt' : 'border-border bg-card text-ink-soft hover:text-ink',
                ].join(' ')}
              >{t.label}</button>
            );
          })}
        </div>
      </Group>

      <Group label="Accent">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(ACCENT_PRESETS).map(([hex, p]) => {
              const active = accent.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  onClick={() => setAccent(hex)}
                  title={p.label}
                  aria-label={p.label}
                  aria-pressed={active}
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-xl border-[1.5px]',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper',
                    active ? 'border-ink' : 'border-border hover:border-ink-soft',
                  ].join(' ')}
                >
                  <span className="h-5 w-5 rounded-md" style={{ background: hex }} />
                </button>
              );
            })}
          </div>
          <Caption>Used for the SANDBOX logo, primary CTAs, and focus highlights.</Caption>
        </div>
      </Group>
    </SettingsLayout>
  );
}
