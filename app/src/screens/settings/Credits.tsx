import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';

const STACK = [
  { name: 'React',        version: '19',          purpose: 'Host UI' },
  { name: 'React (runtime)', version: '18.3.1 UMD', purpose: 'Inside artifact iframe' },
  { name: 'Vite',         version: '5',           purpose: 'Build / dev server' },
  { name: 'Tailwind CSS', version: '3',           purpose: 'Styling' },
  { name: 'React Router', version: '6',           purpose: 'Routing' },
  { name: 'Dexie',        version: '4',           purpose: 'IndexedDB' },
  { name: 'lucide-react', version: 'latest',      purpose: 'Icons (stable name map)' },
  { name: '@babel/standalone', version: '7',      purpose: 'In-iframe JSX transpile' },
];

export function Credits() {
  return (
    <SettingsLayout title="Credits">
      <Group label="Open source">
        {STACK.map((row, i) => (
          <div key={row.name} className={['grid grid-cols-[1fr_80px] items-center gap-3 px-3.5 py-2.5', i === STACK.length - 1 ? '' : 'border-b border-divider'].join(' ')}>
            <div>
              <div className="text-sm font-medium">{row.name}</div>
              <div className="text-[11.5px] text-ink-soft">{row.purpose}</div>
            </div>
            <div className="font-mono text-[11px] text-ink-soft text-right">{row.version}</div>
          </div>
        ))}
      </Group>

      <Group label="Inspiration">
        <div className="px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft">
          Built as the web counterpart of the SANDBOX Android app — same product, same screens,
          same idea. Designed by hand; coded with help from Claude.
        </div>
      </Group>
    </SettingsLayout>
  );
}
