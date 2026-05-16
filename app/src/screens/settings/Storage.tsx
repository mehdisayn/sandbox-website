import { useEffect, useState } from 'react';
import { SettingsLayout } from './SettingsLayout';
import { Group } from '../../components/ui/Group';
import { artifactRepo, dependencyRepo } from '../../lib/repo/dexie-repos';

export function Storage() {
  const [artBytes, setArtBytes] = useState(0);
  const [depBytes, setDepBytes] = useState(0);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [quota, setQuota] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    (async () => {
      const arts = await artifactRepo.list();
      setArtBytes(arts.reduce((s, a) => s + a.sizeBytes, 0));
      const deps = await dependencyRepo.list();
      setDepBytes(deps.reduce((s, d) => s + d.sizeBytes, 0));
      if (navigator.storage?.estimate) setQuota(await navigator.storage.estimate());
      if (navigator.storage?.persisted) setPersisted(await navigator.storage.persisted());
    })();
  }, []);

  async function requestPersist() {
    if (!navigator.storage?.persist) return;
    const ok = await navigator.storage.persist();
    setPersisted(ok);
  }

  const total = artBytes + depBytes;
  const usedPct = quota?.quota ? Math.min(100, ((quota.usage ?? 0) / quota.quota) * 100) : 0;

  return (
    <SettingsLayout title="Storage">
      <Group label="Usage">
        <Field label="Artifacts" value={formatBytes(artBytes)} />
        <Field label="Dependencies" value={formatBytes(depBytes)} />
        <Field label="Total" value={formatBytes(total)} last />
      </Group>

      {quota?.quota != null && (
        <Group label="Browser quota">
          <div className="px-3.5 py-3">
            <div className="flex justify-between text-[12px]">
              <span className="text-ink-soft">Used</span>
              <span className="font-mono text-[11px] text-ink-soft">{formatBytes(quota.usage ?? 0)} / {formatBytes(quota.quota)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-paper-alt overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        </Group>
      )}

      <Group label="Persistence">
        <div className="flex items-center gap-3 px-3.5 py-3">
          <div className="flex-1">
            <div className="text-sm font-medium">{persisted == null ? '…' : persisted ? 'Storage is persisted' : 'Storage is best-effort'}</div>
            <div className="mt-0.5 text-[12px] text-ink-soft">
              Persisted storage is less likely to be evicted by the browser when disk is tight.
            </div>
          </div>
          {persisted === false && (
            <button onClick={requestPersist} className="rounded-xl border-[1.5px] border-ink bg-card px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent">Request</button>
          )}
        </div>
      </Group>
    </SettingsLayout>
  );
}

function Field({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={['flex items-center justify-between gap-3 px-3.5 py-2.5', last ? '' : 'border-b border-divider'].join(' ')}>
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="font-mono text-[11px] text-ink-soft">{value}</span>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
