/* global React, AppIcon, Btn, Input, Pill, Caption, Glyph, TopBar, StatusBar, HomeIndicator, Hatch, SAMPLE, sbTheme, HandNote */

// Library screens — both ends of the spectrum
//   A · Artifact-emphasis (big tiles, minimal chrome)
//   B · Speed-emphasis    (compact list, keyboard-first)
// ──────────────────────────────────────────────────────────────

// ── Shared sidebar (desktop) ────────────────────────────────
function SBSidebar({ active = 'library', mode = 'light', collapsed = false }) {
  const t = sbTheme(mode);
  const items = [
    { id: 'library',  label: 'Library',  glyph: '▦', count: 12 },
    { id: 'compose',  label: 'Compose',  glyph: '✎' },
    { id: 'deps',     label: 'Dependencies', glyph: '⧉', count: 4 },
    { id: 'settings', label: 'Settings', glyph: '⚙' },
  ];
  return (
    <div style={{
      width: collapsed ? 58 : 220,
      borderRight: `1px solid ${t.divider}`,
      background: t.paperAlt,
      display: 'flex', flexDirection: 'column',
      padding: collapsed ? '18px 8px' : '18px 14px',
      gap: 6, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 14px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: t.accent, border: `1.5px solid ${t.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: t.ink }}>S</div>
        {!collapsed && <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>SANDBOX</div>}
      </div>
      {items.map((it) => {
        const isActive = it.id === active;
        return (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '8px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 9,
            background: isActive ? t.card : 'transparent',
            border: isActive ? `1px solid ${t.border}` : '1px solid transparent',
            color: isActive ? t.ink : t.inkSoft,
            fontSize: 13, fontWeight: isActive ? 600 : 500,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, width: 18, textAlign: 'center' }}>{it.glyph}</span>
            {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
            {!collapsed && it.count != null && (
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>{it.count}</span>
            )}
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 6px', borderTop: `1px dashed ${t.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>
            <span>theme</span>
            <span style={{ padding: '1px 6px', borderRadius: 4, background: mode === 'dark' ? t.card : t.ink, color: mode === 'dark' ? t.ink : t.paper, fontSize: 9, fontWeight: 600 }}>SYS</span>
            <span>light</span>
            <span>dark</span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: t.inkFaint }}>local · 84.2 KB used</div>
        </div>
      )}
    </div>
  );
}

// ── Library A · Artifact-emphasis (desktop) ─────────────────
function LibraryDesktopArtifact({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ display: 'flex', height: '100%', background: t.paper }}>
      <SBSidebar active="library" mode={mode} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '28px 32px 18px' }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.6 }}>Library</div>
            <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 2 }}>12 artifacts · 84.2 KB</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Input placeholder="Search…" icon="⌕" full={false} style={{ width: 240 }} mode={mode} />
            <div style={{ display: 'flex', border: `1.5px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: t.ink, color: t.paper, fontFamily: 'JetBrains Mono', fontSize: 12 }}>▦</div>
              <div style={{ padding: '8px 12px', background: t.card, color: t.inkSoft, fontFamily: 'JetBrains Mono', fontSize: 12 }}>☰</div>
            </div>
            <Btn primary mode={mode}>＋ Add mini-app</Btn>
          </div>
        </div>

        {/* Grid */}
        <div style={{
          flex: 1, overflow: 'hidden',
          padding: '8px 32px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 22,
          alignContent: 'flex-start',
        }}>
          {SAMPLE.slice(0, 11).map((a, i) => (
            <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <AppIcon size={68} fill={a.fill} glyph={a.glyph} mode={mode} />
              <div style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{a.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: t.inkFaint }}>{a.opened}</div>
            </div>
          ))}
          {/* Add tile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 68, height: 68, borderRadius: 19,
              border: `1.5px dashed ${t.inkSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 300, color: t.inkSoft,
              background: 'transparent',
            }}>＋</div>
            <div style={{ fontSize: 12, fontWeight: 500, textAlign: 'center', color: t.inkSoft }}>Add</div>
          </div>
        </div>

        {/* Drop hint */}
        <div style={{
          margin: '0 32px 24px', padding: '14px 18px',
          border: `1.5px dashed ${t.border}`,
          borderRadius: 12, color: t.inkSoft, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'JetBrains Mono', letterSpacing: 0.3,
        }}>
          <span style={{ fontSize: 16 }}>⤓</span>
          <span>drop a .jsx or .html file anywhere · or paste source · or paste a raw URL</span>
        </div>
      </div>
    </div>
  );
}

// ── Library A · Mobile (4-col grid, big tiles) ──────────────
function LibraryMobileArtifact({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.paper, position: 'relative' }}>
      <StatusBar mode={mode} />
      <div style={{ padding: '8px 18px 14px' }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6 }}>Library</div>
        <div style={{ fontSize: 12, color: t.inkSoft, marginTop: 2 }}>12 artifacts</div>
      </div>
      <div style={{ padding: '0 18px 12px', display: 'flex', gap: 8 }}>
        <Input placeholder="Search" icon="⌕" mode={mode} />
        <div style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${t.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>＋</div>
      </div>
      <div style={{
        flex: 1, padding: '6px 18px 18px', overflow: 'hidden',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, alignContent: 'flex-start',
      }}>
        {SAMPLE.slice(0, 11).map((a) => (
          <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <AppIcon size={56} fill={a.fill} glyph={a.glyph} mode={mode} />
            <div style={{ fontSize: 10.5, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>{a.name}</div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, border: `1.5px dashed ${t.inkSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 300, color: t.inkSoft }}>＋</div>
          <div style={{ fontSize: 10.5, fontWeight: 500, color: t.inkSoft }}>Add</div>
        </div>
      </div>
      {/* Bottom tab — mobile */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${t.divider}`, background: t.paperAlt,
        padding: '8px 0 18px', justifyContent: 'space-around',
      }}>
        {[['▦','Library', true],['✎','Compose'],['⚙','Settings']].map(([g,l,active]) => (
          <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: active ? t.ink : t.inkSoft }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14 }}>{g}</span>
            <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 500 }}>{l}</span>
          </div>
        ))}
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

// ── Library B · Speed-emphasis (desktop, compact list) ──────
function LibraryDesktopSpeed({ mode = 'light' }) {
  const t = sbTheme(mode);
  const rows = SAMPLE.slice(0, 11);
  return (
    <div style={{ display: 'flex', height: '100%', background: t.paper }}>
      <SBSidebar active="library" mode={mode} collapsed />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Command bar */}
        <div style={{
          padding: '14px 22px',
          borderBottom: `1px solid ${t.divider}`,
          background: t.paperAlt,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            flex: 1, height: 38, borderRadius: 10,
            border: `1.5px solid ${t.ink}`, background: t.card,
            display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: t.inkSoft }}>⌕</span>
            <span style={{ fontSize: 13, color: t.inkSoft }}>Search artifacts, dependencies, settings…</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>⌘K · @ url · / cmd</span>
          </div>
          <Btn primary mode={mode}>＋ New</Btn>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 22px', borderBottom: `1px solid ${t.divider}`, alignItems: 'center' }}>
          <Pill tone="ink">All · 12</Pill>
          <Pill mode={mode}>JSX · 10</Pill>
          <Pill mode={mode}>HTML · 2</Pill>
          <Pill mode={mode}>has deps · 4</Pill>
          <Pill mode={mode}>needs net · 1</Pill>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>sort: last opened ▾</span>
        </div>

        {/* Dense list */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 22px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 90px 80px 100px 24px',
            padding: '10px 4px', gap: 14,
            fontFamily: 'JetBrains Mono', fontSize: 9.5, color: t.inkFaint,
            textTransform: 'uppercase', letterSpacing: 1,
            borderBottom: `1px dashed ${t.divider}`,
          }}>
            <span></span><span>name</span><span>kind</span><span>size</span><span>opened</span><span></span>
          </div>
          {rows.map((a, i) => (
            <div key={a.name} style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 90px 80px 100px 24px',
              padding: '8px 4px', gap: 14, alignItems: 'center',
              borderBottom: `1px solid ${t.rowSep || t.divider}`,
              background: i === 1 ? t.accentSoft : 'transparent',
            }}>
              <AppIcon size={32} fill={a.fill} glyph={a.glyph} mode={mode} style={{ borderRadius: 8 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                <span>{a.name}</span>
                {a.net && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: t.destructive }}>⌀ net</span>}
                {a.deps > 0 && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: t.inkFaint }}>· {a.deps} dep</span>}
              </div>
              <Pill mode={mode} tone={a.kind === 'html' ? 'neutral' : 'accent'}>{a.kind.toUpperCase()}</Pill>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>{a.size}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>{a.opened}</span>
              <span style={{ color: t.inkFaint, fontSize: 14 }}>›</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px 22px 14px', borderTop: `1px solid ${t.divider}`, fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint, display: 'flex', gap: 16 }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>⌘E edit</span><span>⌘⌫ delete</span><span>⌘D duplicate</span><div style={{ flex: 1 }} /><span>local · indexeddb</span>
        </div>
      </div>
    </div>
  );
}

// ── Library B · Mobile (dense list, sticky FAB) ─────────────
function LibraryMobileSpeed({ mode = 'light' }) {
  const t = sbTheme(mode);
  const rows = SAMPLE.slice(0, 9);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.paper, position: 'relative' }}>
      <StatusBar mode={mode} />
      <div style={{ padding: '4px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, flex: 1 }}>Library</div>
        <Pill tone="ink">12</Pill>
      </div>
      <div style={{ padding: '0 16px 10px' }}>
        <Input placeholder="Search · paste url · paste code" icon="⌕" mode={mode} />
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px', overflow: 'hidden' }}>
        <Pill tone="ink">All</Pill>
        <Pill mode={mode}>JSX</Pill>
        <Pill mode={mode}>HTML</Pill>
        <Pill mode={mode}>deps</Pill>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 8px' }}>
        {rows.map((a, i) => (
          <div key={a.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 8px', borderBottom: `1px solid ${t.divider}`,
            background: i === 0 ? t.accentSoft : 'transparent',
          }}>
            <AppIcon size={34} fill={a.fill} glyph={a.glyph} mode={mode} style={{ borderRadius: 9 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', gap: 6, alignItems: 'center' }}>
                {a.name}
                {a.net && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: t.destructive }}>⌀</span>}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: t.inkSoft }}>
                opened {a.opened} · {a.size}
              </div>
            </div>
            <Pill mode={mode} tone={a.kind === 'html' ? 'neutral' : 'accent'} style={{ fontSize: 9 }}>{a.kind}</Pill>
            <span style={{ color: t.inkFaint, fontSize: 14 }}>›</span>
          </div>
        ))}
      </div>
      {/* FAB */}
      <div style={{
        position: 'absolute', bottom: 28, right: 18,
        width: 52, height: 52, borderRadius: 16,
        background: t.ink, color: t.paper,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, fontWeight: 300,
        boxShadow: '0 4px 0 rgba(26,26,26,0.15)',
      }}>＋</div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

Object.assign(window, { LibraryDesktopArtifact, LibraryMobileArtifact, LibraryDesktopSpeed, LibraryMobileSpeed, SBSidebar });
