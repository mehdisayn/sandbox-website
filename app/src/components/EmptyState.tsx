// First-run empty state for Library. DESIGN.md §7.2.

import { Btn } from './ui/Btn';
import { useIngestion } from './IngestionProvider';

export function EmptyState() {
  const { openAdd } = useIngestion();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] border-[1.5px] border-dashed border-ink-soft text-3xl font-light text-ink-soft">
        ＋
      </div>
      <div>
        <div className="text-lg font-semibold tracking-[-0.01em]">No artifacts yet</div>
        <div className="mt-1 text-[13px] text-ink-soft">
          Drop a <span className="font-mono">.jsx</span> or <span className="font-mono">.html</span> file, paste source, or import from a URL.
        </div>
      </div>
      <Btn variant="primary" onClick={() => openAdd()}>＋ Add your first artifact</Btn>
    </div>
  );
}
