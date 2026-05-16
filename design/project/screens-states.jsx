/* global React, AppIcon, Btn, Pill, sbTheme, StatusBar, HomeIndicator, SAMPLE, Hatch, Caption */

// Interaction states · long-press, right-click, delete confirm, URL import, error
// ──────────────────────────────────────────────────────────────

// ── Long-press / context menu · Mobile ──────────────────────
function LongPressMobile({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <StatusBar mode={mode} />
      {/* Faint library grid behind blur */}
      <div style={{
        padding: '20px 18px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18,
        filter: 'blur(2.5px)', opacity: 0.45, pointerEvents: 'none',
      }}>
        {SAMPLE.slice(0, 8).map((a) => (
          <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <AppIcon size={52} fill={a.fill} glyph={a.glyph} mode={mode} />
            <div style={{ fontSize: 10, fontWeight: 500 }}>{a.name}</div>
          </div>
        ))}
      </div>
      {/* Dim overlay */}
      <div style={{ position: 'absolute', inset: 0, background: mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(26,26,26,0.32)' }} />

      {/* Lifted icon */}
      <div style={{
        position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%) scale(1.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: -6, borderRadius: 22,
            border: `2.5px solid ${t.accent}`, boxShadow: '0 8px 0 rgba(0,0,0,0.18)',
          }} />
          <AppIcon size={68} fill="rose" emoji="🍅" mode={mode} style={{ borderRadius: 19 }} />
        </div>
        <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, textShadow: '0 1px 0 rgba(0,0,0,0.4)' }}>Pomodoro</div>
      </div>

      {/* Floating menu */}
      <div style={{
        position: 'absolute', left: '50%', top: 260, transform: 'translateX(-50%)',
        width: 240, background: t.card, border: `1.5px solid ${t.ink}`,
        borderRadius: 14, padding: 6,
        boxShadow: '0 14px 0 rgba(0,0,0,0.18)',
      }}>
        {[
          ['▶', 'Open',        false],
          ['ⓘ', 'Details',     false],
          ['✎', 'Edit code',   false],
          ['Aa','Rename',      false],
          ['◐', 'Change icon', false],
          ['↗', 'Share',       false],
          ['✕', 'Delete',      true],
        ].map(([g, l, danger], i, arr) => (
          <div key={l} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '9px 12px',
            borderBottom: i === arr.length - 1 ? 'none' : `1px solid ${t.divider}`,
            color: danger ? t.destructive : t.ink,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, width: 18 }}>{g}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
          </div>
        ))}
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

// ── Right-click context · Desktop ───────────────────────────
function RightClickDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '28px 32px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>Library</div>
      </div>
      <div style={{
        padding: '8px 32px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 22,
      }}>
        {SAMPLE.slice(0, 11).map((a, i) => (
          <div key={a.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: i === 2 ? 1 : 0.85 }}>
            <div style={{ position: 'relative' }}>
              {i === 2 && (
                <div style={{ position: 'absolute', inset: -4, borderRadius: 22, border: `2px solid ${t.accent}` }} />
              )}
              <AppIcon size={64} fill={a.fill} glyph={a.glyph} mode={mode} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</div>
          </div>
        ))}
      </div>

      {/* Right-click menu */}
      <div style={{
        position: 'absolute', left: 380, top: 178,
        width: 220, background: t.card, border: `1.5px solid ${t.ink}`,
        borderRadius: 10, padding: 4,
        boxShadow: '0 12px 0 rgba(26,26,26,0.10)',
      }}>
        {[
          ['Open',         '↵'],
          ['Open in new tab', '⌘↵'],
          ['Details',      ''],
          ['Edit code',    '⌘E'],
          ['Rename',       ''],
          ['Change icon',  ''],
          ['Duplicate',    '⌘D'],
          ['Share',        ''],
          ['---'],
          ['Delete',       '⌘⌫', true],
        ].map((row, i) => {
          if (row[0] === '---') return <div key={i} style={{ height: 1, background: t.divider, margin: '4px 6px' }} />;
          const [l, k, danger] = row;
          return (
            <div key={l} style={{
              display: 'flex', alignItems: 'center', padding: '6px 10px',
              borderRadius: 6, fontSize: 12.5,
              color: danger ? t.destructive : t.ink,
              background: l === 'Open' ? t.accentSoft : 'transparent',
            }}>
              <span style={{ flex: 1 }}>{l}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>{k}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Delete confirm dialog ───────────────────────────────────
function DeleteConfirm({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.45)' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 340, background: t.card, border: `1.5px solid ${t.ink}`,
        borderRadius: 16, padding: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        boxShadow: '0 16px 0 rgba(0,0,0,0.15)',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: t.card, border: `1.5px solid ${t.destructive}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.destructive, fontSize: 22, fontWeight: 700,
        }}>!</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Delete <span style={{ fontFamily: 'JetBrains Mono' }}>chart.js</span>?</div>
        <div style={{ fontSize: 12, color: t.inkSoft, textAlign: 'center', lineHeight: 1.5 }}>
          Will break <b style={{ color: t.ink }}>2 artifacts</b> until they re-fetch.
        </div>
        <div style={{ width: '100%', padding: 10, background: t.paperAlt, borderRadius: 10, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon size={24} fill="mist" glyph="~~" mode={mode} style={{ borderRadius: 7 }} />
            <span style={{ fontSize: 12 }}>Sparkline</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AppIcon size={24} fill="olive" glyph="HB" mode={mode} style={{ borderRadius: 7 }} />
            <span style={{ fontSize: 12 }}>Habits</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Btn ghost mode={mode} full>Cancel</Btn>
          <Btn danger mode={mode} full>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

// ── URL import (loading) · Mobile ───────────────────────────
function URLImport({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar mode={mode} />
      <div style={{ flex: 1, padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Import from URL</div>
          <div style={{ fontSize: 12, color: t.inkSoft, marginTop: 4 }}>Paste a raw .jsx or .html link.</div>
        </div>

        <div style={{
          padding: 14, background: t.card, border: `1.5px solid ${t.ink}`, borderRadius: 12,
          fontFamily: 'JetBrains Mono', fontSize: 11, color: t.ink, wordBreak: 'break-all', lineHeight: 1.5,
        }}>
          https://gist.githubusercontent.com/<wbr/>user/abc123/raw/<wbr/>pomodoro.jsx
        </div>

        <div style={{
          padding: 14, background: t.paperAlt, borderRadius: 12, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 999,
            border: `2px dashed ${t.inkSoft}`, animation: 'none',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Fetching…</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkSoft, marginTop: 2 }}>1.4 KB · checking content-type</div>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>cors ok</span>
        </div>

        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint, lineHeight: 1.6 }}>
          allowed hosts:<br/>
          · raw.githubusercontent.com<br/>
          · gist.githubusercontent.com<br/>
          · cdn.jsdelivr.net · unpkg.com · cdnjs.cloudflare.com<br/>
          other hosts require proxy (deferred)
        </div>

        <div style={{ flex: 1 }} />
        <Btn primary mode={mode} size="lg">Continue</Btn>
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

Object.assign(window, { LongPressMobile, RightClickDesktop, DeleteConfirm, URLImport });
