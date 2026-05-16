/* global React, AppIcon, Btn, Input, Pill, Caption, sbTheme, StatusBar, HomeIndicator, TopBar, Row, Group, Hatch, SBSidebar */

// Compose · code editor for new/edited artifacts
// ──────────────────────────────────────────────────────────────

const SAMPLE_CODE = [
  ["1",  "function App() {"],
  ["2",  "  const [seconds, setSeconds] = React.useState(25 * 60);"],
  ["3",  "  const [running, setRunning] = React.useState(false);"],
  ["4",  ""],
  ["5",  "  React.useEffect(() => {"],
  ["6",  "    if (!running) return;"],
  ["7",  "    const id = setInterval(() => {"],
  ["8",  "      setSeconds((s) => s > 0 ? s - 1 : 0);"],
  ["9",  "    }, 1000);"],
  ["10", "    return () => clearInterval(id);"],
  ["11", "  }, [running]);"],
  ["12", ""],
  ["13", "  const m = String(Math.floor(seconds / 60)).padStart(2, '0');"],
  ["14", "  const s = String(seconds % 60).padStart(2, '0');"],
  ["15", ""],
  ["16", "  return ("],
  ["17", "    <div className=\"min-h-screen flex flex-col\">"],
  ["18", "      <div className=\"text-8xl font-bold tabular-nums\">"],
  ["19", "        {m}:{s}"],
  ["20", "      </div>"],
  ["21", "      <button onClick={() => setRunning(r => !r)}>"],
  ["22", "        {running ? 'Pause' : 'Start'}"],
  ["23", "      </button>"],
  ["24", "    </div>"],
  ["25", "  );"],
  ["26", "}"],
  ["27", "export default App;"],
];

function codeColor(line, isDark) {
  if (!line) return 'transparent';
  return isDark ? '#a8a8a8' : '#5a5a5a';
}

function CodeView({ mode, lines = SAMPLE_CODE }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      flex: 1, padding: '14px 0',
      background: mode === 'dark' ? '#0e0e0e' : '#fbfaf6',
      overflow: 'hidden',
      fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.7,
    }}>
      {lines.map(([n, code]) => (
        <div key={n} style={{ display: 'flex', gap: 12, padding: '0 16px', alignItems: 'baseline' }}>
          <span style={{ width: 22, textAlign: 'right', color: t.inkFaint, userSelect: 'none' }}>{n}</span>
          <span style={{ color: codeColor(code, mode === 'dark') }}>{code || '\u00A0'}</span>
        </div>
      ))}
    </div>
  );
}

// ── Compose · Desktop ───────────────────────────────────────
function ComposeDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ display: 'flex', height: '100%', background: t.paper }}>
      <SBSidebar active="compose" mode={mode} collapsed />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding: '12px 22px', borderBottom: `1px solid ${t.divider}`, background: t.paperAlt,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Btn ghost mode={mode} size="sm">Cancel</Btn>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AppIcon size={28} fill="rose" emoji="🍅" mode={mode} style={{ borderRadius: 7 }} />
            <Input value="Pomodoro" mode={mode} full={false} style={{ width: 200, height: 30, fontSize: 12 }} />
            <div style={{ display: 'flex', background: t.card, borderRadius: 8, padding: 3, border: `1px solid ${t.border}`, fontFamily: 'JetBrains Mono', fontSize: 10 }}>
              <span style={{ padding: '4px 10px', borderRadius: 5, background: t.ink, color: t.paper, fontWeight: 600 }}>JSX</span>
              <span style={{ padding: '4px 10px', color: t.inkSoft }}>HTML</span>
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>1.2 KB · unsaved</span>
          </div>
          <Btn mode={mode} size="sm">Run preview</Btn>
          <Btn primary mode={mode} size="sm">Save to Library</Btn>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${t.divider}` }}>
            <CodeView mode={mode} />
            <div style={{
              padding: '8px 16px', borderTop: `1px solid ${t.divider}`,
              background: t.paperAlt, display: 'flex', gap: 14,
              fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkSoft,
            }}>
              <span>jsx · 27 lines · 1.2 KB</span>
              <span>·</span>
              <span>imports: <span style={{ color: t.ink }}>none</span></span>
              <div style={{ flex: 1 }} />
              <span>↵ save · ⌘P run preview</span>
            </div>
          </div>

          {/* Right rail */}
          <div style={{ width: 280, padding: 18, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
            <div>
              <Caption mode={mode}>Icon</Caption>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AppIcon size={56} fill="rose" emoji="🍅" mode={mode} />
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>emoji · rose fill</div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, border: `1.5px solid ${t.ink}`, fontSize: 11, fontWeight: 500 }}>Emoji</span>
                  <span style={{ padding: '3px 8px', fontSize: 11, color: t.inkSoft }}>Glyph</span>
                  <span style={{ padding: '3px 8px', fontSize: 11, color: t.inkSoft }}>Upload</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {['🍅','⏱','⏰','🎯','📝','🎲','🎨','📊','📚','📂','🌤','🌙','⭐','✂'].map((e, i) => (
                    <div key={i} style={{
                      aspectRatio: '1', borderRadius: 7,
                      border: i === 0 ? `1.5px solid ${t.ink}` : `1px solid ${t.border}`,
                      background: i === 0 ? t.accentSoft : t.card,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15,
                    }}>{e}</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {['rose','sage','sand','lilac','sky','clay','mist'].map((f, i) => (
                    <div key={f} style={{
                      width: 22, height: 22, borderRadius: 5,
                      background: ({rose:'#eab6c0',sage:'#d6e2c8',sand:'#ecdfb6',lilac:'#d6c8e8',sky:'#bcd5ec',clay:'#e3a98e',mist:'#cfd9d6'})[f],
                      border: i === 0 ? `1.5px solid ${t.ink}` : `1px solid ${t.border}`,
                    }} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Caption mode={mode}>Dependencies · auto-detected</Caption>
              <div style={{ marginTop: 8, padding: 10, background: t.paperAlt, borderRadius: 8, border: `1px dashed ${t.border}`, fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft, lineHeight: 1.6 }}>
                <span style={{ color: t.ink, fontWeight: 600 }}>0</span> imports detected.<br/>
                <span style={{ color: t.inkFaint }}>edit source — imports re-scanned on save</span>
              </div>
            </div>

            <div>
              <Caption mode={mode}>Linting</Caption>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>
                <div>✓ default export found</div>
                <div>✓ react globals available</div>
                <div>✓ no Tailwind v3 → v4 conflicts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compose · Mobile ────────────────────────────────────────
function ComposeMobile({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar mode={mode} />
      <TopBar
        mode={mode} title="Compose"
        left={<span style={{ fontSize: 13, color: t.inkSoft }}>Cancel</span>}
        right={<span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>Save</span>}
      />
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <AppIcon size={34} fill="rose" emoji="🍅" mode={mode} style={{ borderRadius: 9 }} />
        <Input value="Pomodoro" mode={mode} height={32} />
        <div style={{ display: 'flex', background: t.card, borderRadius: 7, padding: 2, border: `1px solid ${t.border}`, fontFamily: 'JetBrains Mono', fontSize: 9.5 }}>
          <span style={{ padding: '3px 7px', borderRadius: 4, background: t.ink, color: t.paper, fontWeight: 600 }}>JSX</span>
          <span style={{ padding: '3px 7px', color: t.inkSoft }}>HTML</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CodeView mode={mode} lines={SAMPLE_CODE.slice(0, 18)} />
      </div>

      <div style={{
        padding: '8px 16px', borderTop: `1px solid ${t.divider}`,
        background: t.paperAlt, display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkSoft,
      }}>
        <span>27 lines</span><span>·</span><span>1.2 KB</span>
        <div style={{ flex: 1 }} />
        <Pill tone="accent">0 deps</Pill>
      </div>

      {/* Keyboard accessory bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0 14px', background: t.paperAlt, borderTop: `1px solid ${t.divider}`,
        fontFamily: 'JetBrains Mono', fontSize: 13, color: t.inkSoft,
      }}>
        {['{ }','( )','[ ]','< >','→','/','*','=','↶','↷'].map((g) => (
          <span key={g} style={{ padding: '4px 8px', borderRadius: 6, background: t.card, border: `1px solid ${t.border}`, fontSize: 11 }}>{g}</span>
        ))}
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

Object.assign(window, { ComposeDesktop, ComposeMobile });
