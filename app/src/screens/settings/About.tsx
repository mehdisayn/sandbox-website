import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';

const VERSION = '0.1.0-phase6';

export function About() {
  return (
    <SettingsLayout title="About">
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-accent text-3xl font-bold">S</div>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">SANDBOX <span className="text-ink-soft font-normal">/ Web</span></h1>
        <div className="text-sm text-ink-soft">Run AI artifacts in your browser.</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Built by Syed Mehedi Hussain</div>
      </div>

      <Group label="Build">
        <Field label="Version" value={VERSION} />
        <Field label="Platform" value="Web · static site (no backend)" />
        <Field label="Storage" value="Local IndexedDB · single user" last />
      </Group>

      <Group label="How it works">
        <div className="px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
          Drop in a <span className="font-mono text-ink">.jsx</span> or <span className="font-mono text-ink">.html</span> file
          and SANDBOX runs it inside a sandboxed iframe on a separate origin. Imports from npm packages
          are auto-fetched from a CDN allowlist (jsdelivr / unpkg / cdnjs) and cached locally so they
          work offline next time.
        </div>
      </Group>
    </SettingsLayout>
  );
}

function Field({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={['flex items-center justify-between gap-3 px-3.5 py-2.5', last ? '' : 'border-b border-divider'].join(' ')}>
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="font-mono text-[11px] text-ink">{value}</span>
    </div>
  );
}
