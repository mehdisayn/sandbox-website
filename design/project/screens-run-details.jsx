/* global React, AppIcon, Btn, Input, Pill, Caption, sbTheme, StatusBar, HomeIndicator, TopBar, Row, Group, Hatch, HandNote */

// Run + Details screens
// ──────────────────────────────────────────────────────────────

// Schematic preview of an artifact actually running — looks like a tiny Pomodoro
function ArtifactPreview({ mode = 'light', label = 'POMODORO RUNNING IN IFRAME' }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: mode === 'dark' ? '#1a1a1a' : '#fef2f2',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14, position: 'relative',
      borderRadius: 0,
    }}>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: mode === 'dark' ? '#666' : '#a18a8a', letterSpacing: 1, position: 'absolute', top: 12 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: mode === 'dark' ? '#a8a8a8' : '#9d3a3a', letterSpacing: 4, textTransform: 'uppercase' }}>Focus</div>
      <div style={{ fontSize: 72, fontWeight: 700, color: mode === 'dark' ? '#f4f3ee' : '#1a1a1a', fontVariantNumeric: 'tabular-nums', letterSpacing: -2, lineHeight: 1 }}>24:18</div>
      <div style={{ fontSize: 11, color: mode === 'dark' ? '#a8a8a8' : '#9d3a3a' }}>Round 2</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <div style={{ padding: '10px 26px', background: mode === 'dark' ? '#f4f3ee' : '#1a1a1a', color: mode === 'dark' ? '#1a1a1a' : '#fbfaf6', borderRadius: 999, fontSize: 12, fontWeight: 500 }}>Pause</div>
        <div style={{ padding: '10px 22px', background: 'transparent', color: mode === 'dark' ? '#a8a8a8' : '#5a5a5a', border: `1px solid ${mode === 'dark' ? '#3a3a3a' : '#cfc9b8'}`, borderRadius: 999, fontSize: 12, fontWeight: 500 }}>Reset</div>
      </div>
    </div>
  );
}

// ── Run · Desktop · persistent dock ─────────────────────────
function RunDesktop({ mode = 'light', state = 'mounted' }) {
  const t = sbTheme(mode);
  const dockBg = t.paperAlt;

  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column' }}>
      {/* Top dock — always visible */}
      <div style={{
        height: 56, background: dockBg,
        borderBottom: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '0 18px',
        flexShrink: 0,
      }}>
        <Btn ghost mode={mode} size="sm">‹ Library</Btn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <AppIcon size={32} fill="rose" emoji="🍅" mode={mode} style={{ borderRadius: 8 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.15 }}>Pomodoro</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: t.inkSoft }}>pomodoro.jsx · 1.2 KB</div>
          </div>
          <Pill tone="accent">JSX</Pill>
          {state === 'loading' && <Pill mode={mode}>booting…</Pill>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'JetBrains Mono', fontSize: 12, color: t.inkSoft }}>
          {['↻','⤓','⧉','◐','⋯'].map((g, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${t.border}`, background: t.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{g}</div>
          ))}
          <div style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.ink}`, background: t.ink, color: t.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>✕</div>
        </div>
      </div>

      {/* iframe stage */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderTop: `1px dashed ${t.divider}` }}>
        {/* iframe origin label */}
        <div style={{ position: 'absolute', top: 10, left: 12, fontFamily: 'JetBrains Mono', fontSize: 9, color: t.inkFaint, opacity: 0.6, letterSpacing: 1, zIndex: 2 }}>
          ⟨iframe sandbox="allow-scripts" · runtime origin · postMessage⟩
        </div>
        {state === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <div style={{ width: 36, height: 36, border: `2px dashed ${t.inkSoft}`, borderRadius: 999 }} />
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>loading runtime…</div>
          </div>
        )}
        {state === 'mounted' && <ArtifactPreview mode={mode} />}
        {state === 'error' && (
          <div style={{ position: 'absolute', inset: 24, background: t.card, border: `1.5px solid ${t.destructive}`, borderRadius: 12, padding: 22, fontFamily: 'JetBrains Mono' }}>
            <div style={{ color: t.destructive, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Error · TypeError</div>
            <div style={{ fontSize: 11, color: t.inkSoft, lineHeight: 1.6 }}>
              Cannot read properties of undefined (reading 'map') at App (eval at &lt;anonymous&gt;:12)<br />
              at React.render…
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Btn primary mode={mode}>Reload</Btn>
              <Btn mode={mode}>Edit source</Btn>
              <Btn mode={mode}>Copy stack</Btn>
            </div>
          </div>
        )}

        {/* Offline banner */}
        {state === 'mounted' && (
          <div style={{
            position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
            background: t.ink, color: t.paper,
            padding: '10px 16px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12, boxShadow: '0 6px 0 rgba(0,0,0,0.15)',
          }}>
            <span style={{ fontFamily: 'JetBrains Mono' }}>⌀</span>
            <span>Network unavailable — chart.js fetch failed</span>
            <span style={{ color: t.inkFaint }}>·</span>
            <span style={{ textDecoration: 'underline' }}>Dismiss</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Run · Mobile · persistent thin dock ─────────────────────
function RunMobile({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar mode={mode} />
      {/* Thin dock */}
      <div style={{
        height: 48, background: t.paperAlt,
        borderBottom: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 12px',
      }}>
        <span style={{ fontSize: 18, color: t.inkSoft }}>‹</span>
        <AppIcon size={26} fill="rose" emoji="🍅" mode={mode} style={{ borderRadius: 7 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>Pomodoro</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: t.inkSoft }}>1.2 KB · JSX</div>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', color: t.inkSoft, fontSize: 14 }}>↻</span>
        <span style={{ fontFamily: 'JetBrains Mono', color: t.inkSoft, fontSize: 14 }}>⋯</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: t.ink, color: t.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✕</div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ArtifactPreview mode={mode} label="ARTIFACT · IFRAME" />
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

// ── Details · Desktop ───────────────────────────────────────
function DetailsDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '18px 32px', borderBottom: `1px solid ${t.divider}`,
        display: 'flex', alignItems: 'center', gap: 12, background: t.paperAlt,
      }}>
        <Btn ghost mode={mode} size="sm">‹ Library</Btn>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Details</div>
        <Btn primary mode={mode} size="sm">Done</Btn>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '28px 0', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 620, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '6px 14px 22px' }}>
            <AppIcon size={88} fill="rose" emoji="🍅" mode={mode} style={{ borderRadius: 22 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Pomodoro</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft, marginTop: 4 }}>added May 12, 2026 · 1.2 KB · JSX</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Btn primary mode={mode} size="sm">▶ Open</Btn>
                <Btn mode={mode} size="sm">Edit source</Btn>
              </div>
            </div>
          </div>

          <Group mode={mode}>
            <Row mode={mode} tileFill="sage" tileGlyph="A" label="Name" value="Pomodoro" />
            <Row mode={mode} tileFill="lilac" tileGlyph="◉" label="Icon" value="🍅 emoji" />
            <Row mode={mode} tileFill="mist" tileGlyph="K" label="Kind" value="JSX" chevron="" last />
          </Group>

          <Group mode={mode} label="Dependencies">
            <div style={{ padding: '14px 14px', fontFamily: 'JetBrains Mono', fontSize: 12, color: t.inkSoft, textAlign: 'center' }}>
              No dependencies — this artifact only uses React.
            </div>
          </Group>

          <Group mode={mode}>
            <Row mode={mode} tileFill="sky" tileGlyph="↗" label="Share artifact" value="download · share · copy source" />
            <Row mode={mode} tileFill="default" tileGlyph="✎" label="Edit in Compose" />
            <Row mode={mode} tileFill="default" tileGlyph="✕" label="Delete" danger last chevron="" />
          </Group>
        </div>
      </div>
    </div>
  );
}

// ── Details · Mobile ────────────────────────────────────────
function DetailsMobile({ mode = 'light', withDeps = true }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar mode={mode} />
      <TopBar mode={mode} title="Details" left={<span style={{ fontSize: 13, color: t.inkSoft }}>‹ Library</span>} right={<span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>Done</span>} />
      <div style={{ flex: 1, overflow: 'hidden', padding: '20px 18px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <AppIcon size={84} fill="olive" glyph="HB" mode={mode} style={{ borderRadius: 22 }} />
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>Habits</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkSoft }}>added Apr 28 · 2.1 KB · JSX</div>
        </div>

        <Group mode={mode}>
          <Row mode={mode} tileFill="sage" tileGlyph="A" label="Name" value="Habits" />
          <Row mode={mode} tileFill="lilac" tileGlyph="◉" label="Icon" value="HB · olive" last />
        </Group>

        {withDeps && (
          <Group mode={mode} label="Dependencies · 1">
            <Row mode={mode} tileFill="sky" tileGlyph="◐" label="date-fns" value="3.6.0 · 28 KB" last chevron="" />
          </Group>
        )}

        <Group mode={mode}>
          <Row mode={mode} tileFill="sky" tileGlyph="↗" label="Share" />
          <Row mode={mode} tileFill="default" tileGlyph="✕" label="Delete" danger last chevron="" />
        </Group>
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

Object.assign(window, { RunDesktop, RunMobile, DetailsDesktop, DetailsMobile });
