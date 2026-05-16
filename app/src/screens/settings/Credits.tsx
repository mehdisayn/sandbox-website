import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';

const LINKS: { label: string; value: string; href: string }[] = [
  { label: 'Website',  value: 'syedmehedihussain.codes',  href: 'https://syedmehedihussain.codes' },
  { label: 'GitHub',    value: '@mehdisayn',                href: 'https://github.com/mehdisayn' },
  { label: 'LinkedIn',  value: '/in/syedmehedihussain',     href: 'https://www.linkedin.com/in/syedmehedihussain' },
  { label: 'Email',     value: 'syedmehedihussain@gmail.com', href: 'mailto:syedmehedihussain@gmail.com' },
];

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
      <Group label="Developer">
        <div className="border-b border-divider px-3.5 py-3">
          <div className="text-sm font-medium">Syed Mehedi Hussain</div>
          <div className="text-[11.5px] text-ink-soft">Developer · Creator · Multipotentialite</div>
        </div>
        {LINKS.map((row, i) => (
          <div key={row.label} className={['grid grid-cols-[80px_1fr] items-center gap-3 px-3.5 py-2.5', i === LINKS.length - 1 ? '' : 'border-b border-divider'].join(' ')}>
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">{row.label}</div>
            <a
              href={row.href}
              target={row.href.startsWith('http') ? '_blank' : undefined}
              rel={row.href.startsWith('http') ? 'noreferrer noopener' : undefined}
              className="truncate text-sm text-ink hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded"
            >
              {row.value}
            </a>
          </div>
        ))}
      </Group>

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

    </SettingsLayout>
  );
}
