// Featured mini-apps. Trimmed v1 starter pack — short enough to keep this
// module under control.

import type { FillName } from './theme';
import type { FileKind } from './repo/types';

export type FeaturedApp = {
  id: string;
  name: string;
  description: string;
  fileKind: FileKind;
  glyph: string;       // 1–3 chars for the tile
  iconFill: FillName;
  source: string;
};

const POMODORO = `function App() {
  const [s, setS] = useState(25*60);
  const [run, setRun] = useState(false);
  const [mode, setMode] = useState('focus');
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setS(v => {
      if (v <= 1) { const next = mode === 'focus' ? 'break' : 'focus'; setMode(next); return next === 'focus' ? 25*60 : 5*60; }
      return v - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [run, mode]);
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  const bg = mode === 'focus' ? 'bg-rose-50' : 'bg-emerald-50';
  return (
    <div className={'min-h-screen flex flex-col items-center justify-center ' + bg}>
      <div className="text-xs uppercase tracking-[0.3em] mb-3 text-stone-500">{mode === 'focus' ? 'Focus' : 'Break'}</div>
      <div className="text-8xl font-bold tabular-nums leading-none mb-8">{m}:{ss}</div>
      <div className="flex gap-3">
        <button onClick={() => setRun(r => !r)} className="px-8 py-3 rounded-full bg-stone-900 text-white text-sm font-medium">{run ? 'Pause' : 'Start'}</button>
        <button onClick={() => { setRun(false); setS(mode === 'focus' ? 25*60 : 5*60); }} className="px-6 py-3 rounded-full bg-white border border-stone-300 text-stone-700 text-sm font-medium">Reset</button>
      </div>
    </div>
  );
}
`;

const STOPWATCH = `function App() {
  const [ms, setMs] = useState(0);
  const [run, setRun] = useState(false);
  const [laps, setLaps] = useState([]);
  useEffect(() => {
    if (!run) return;
    const start = Date.now() - ms;
    const id = setInterval(() => setMs(Date.now() - start), 17);
    return () => clearInterval(id);
  }, [run]);
  const m = String(Math.floor(ms/60000)).padStart(2,'0');
  const s = String(Math.floor(ms/1000)%60).padStart(2,'0');
  const cs = String(Math.floor(ms/10)%100).padStart(2,'0');
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="text-7xl font-light tabular-nums mb-2">{m}:{s}<span className="text-stone-400 text-4xl align-baseline">.{cs}</span></div>
      <div className="flex gap-3 mt-6">
        <button onClick={() => setRun(r => !r)} className="px-6 py-2 rounded-full bg-stone-900 text-white">{run ? 'Stop' : 'Start'}</button>
        <button onClick={() => setLaps(l => [...l, ms])} disabled={!run} className="px-6 py-2 rounded-full border border-stone-300 disabled:opacity-40">Lap</button>
        <button onClick={() => { setMs(0); setLaps([]); setRun(false); }} className="px-6 py-2 rounded-full border border-stone-300">Reset</button>
      </div>
      <ul className="mt-8 w-full max-w-xs font-mono text-sm text-stone-600 space-y-1">
        {laps.map((l, i) => <li key={i} className="flex justify-between"><span>#{laps.length - i}</span><span>{(l/1000).toFixed(2)}s</span></li>).reverse()}
      </ul>
    </div>
  );
}
`;

const DICE = `function App() {
  const [n, setN] = useState(6);
  const [v, setV] = useState(1);
  const roll = () => setV(Math.floor(Math.random() * n) + 1);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-stone-50">
      <div className="text-9xl font-bold tabular-nums">{v}</div>
      <button onClick={roll} className="px-8 py-3 rounded-full bg-stone-900 text-white">Roll d{n}</button>
      <div className="flex gap-2">
        {[4,6,8,10,12,20].map(d => (
          <button key={d} onClick={() => setN(d)} className={'px-3 py-1.5 rounded-full text-xs ' + (d === n ? 'bg-stone-900 text-white' : 'bg-white border border-stone-300')}>d{d}</button>
        ))}
      </div>
    </div>
  );
}
`;

const PALETTE = `function App() {
  const [hue, setHue] = useState(200);
  const swatches = Array.from({length: 9}, (_, i) => 'hsl(' + hue + ' 70% ' + (10 + i*10) + '%)');
  return (
    <div className="min-h-screen p-6 bg-stone-50">
      <h1 className="text-2xl font-bold mb-2">Palette</h1>
      <input type="range" min="0" max="360" value={hue} onChange={e => setHue(+e.target.value)} className="w-full mb-6" />
      <div className="grid grid-cols-3 gap-3">
        {swatches.map(c => (
          <div key={c} onClick={() => navigator.clipboard?.writeText(c)} className="aspect-square rounded-xl cursor-pointer" style={{background: c}} title={c} />
        ))}
      </div>
      <p className="text-xs text-stone-500 mt-4">Click a swatch to copy its HSL.</p>
    </div>
  );
}
`;

const NOTES = `function App() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb-notes') || '[]'); } catch { return []; }
  });
  const [draft, setDraft] = useState('');
  useEffect(() => { localStorage.setItem('sb-notes', JSON.stringify(notes)); }, [notes]);
  const add = () => { if (!draft.trim()) return; setNotes([{ id: Date.now(), text: draft.trim() }, ...notes]); setDraft(''); };
  return (
    <div className="min-h-screen p-5 bg-amber-50">
      <h1 className="text-2xl font-bold mb-4">Notes</h1>
      <div className="flex gap-2 mb-5">
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="new note…" className="flex-1 px-4 py-2 rounded-xl border border-stone-300 bg-white" />
        <button onClick={add} className="px-4 py-2 rounded-xl bg-stone-900 text-white">＋</button>
      </div>
      <ul className="space-y-2">
        {notes.map(n => (
          <li key={n.id} className="bg-white rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="flex-1 text-sm">{n.text}</span>
            <button onClick={() => setNotes(notes.filter(x => x.id !== n.id))} className="text-stone-400 hover:text-stone-700">×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`;

export const FEATURED_APPS: FeaturedApp[] = [
  { id: 'pomodoro',  name: 'Pomodoro',  description: '25/5 focus + break cycle',           fileKind: 'jsx', glyph: 'PM', iconFill: 'rose',    source: POMODORO },
  { id: 'stopwatch', name: 'Stopwatch', description: 'Centisecond timer with laps',         fileKind: 'jsx', glyph: 'SW', iconFill: 'apricot', source: STOPWATCH },
  { id: 'dice',      name: 'Dice',      description: 'd4 / d6 / d8 / d10 / d12 / d20',      fileKind: 'jsx', glyph: '⚄',  iconFill: 'sky',     source: DICE },
  { id: 'palette',   name: 'Palette',   description: 'Hue → 9-stop ramp, click to copy',    fileKind: 'jsx', glyph: 'PL', iconFill: 'lilac',   source: PALETTE },
  { id: 'notes',     name: 'Notes',     description: 'Local-storage notepad',                fileKind: 'jsx', glyph: '✎',  iconFill: 'sand',    source: NOTES },
];
