// The Phase 1 runtime spike target.

import type { Artifact } from './repo/types';

export const SAMPLE_ARTIFACT_NAME = 'Hello, SANDBOX';

export const SAMPLE_ARTIFACT_SOURCE = `
function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-2xl font-semibold tracking-tight">Hello, SANDBOX</div>
      <div className="text-sm text-neutral-500">A sample artifact running locally.</div>
      <div className="text-6xl font-light tabular-nums">{count}</div>
      <div className="flex gap-3">
        <button
          onClick={() => setCount(c => c - 1)}
          className="px-5 py-2 rounded-xl border border-neutral-900 text-neutral-900 text-base"
        >−</button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-base"
        >+</button>
      </div>
    </div>
  );
}
`;

export const SAMPLE_ARTIFACT: Artifact = {
  id: 'sample',
  name: SAMPLE_ARTIFACT_NAME,
  iconType: 'glyph',
  iconValue: 'HS',
  iconFill: 'sage',
  fileKind: 'jsx',
  source: SAMPLE_ARTIFACT_SOURCE,
  sizeBytes: SAMPLE_ARTIFACT_SOURCE.length,
  createdAt: Date.now(),
  lastOpened: null,
};
