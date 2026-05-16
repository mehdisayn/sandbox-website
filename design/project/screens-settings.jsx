/* global React, AppIcon, Btn, Input, Pill, Caption, sbTheme, StatusBar, HomeIndicator, TopBar, Row, Group, SBSidebar, Glyph, Hatch */

// Settings hub + sub-screens
// ──────────────────────────────────────────────────────────────

// ── Settings hub · Desktop ──────────────────────────────────
function SettingsDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ display: 'flex', height: '100%', background: t.paper }}>
      <SBSidebar active="settings" mode={mode} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
        <div style={{ width: 580, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ padding: '0 4px 18px' }}>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.6 }}>Settings</div>
          </div>

          <Group mode={mode}>
            <Row mode={mode} tileFill="lilac" tileGlyph="◐" label="Appearance" value="System" />
            <Row mode={mode} tileFill="sand" tileGlyph="★" label="Featured mini-apps" value="6 starters" last />
          </Group>

          <Group mode={mode}>
            <Row mode={mode} tileFill="sky" tileGlyph="⧉" label="Dependencies" value="4 · 184 KB" />
            <Row mode={mode} tileFill="sage" tileGlyph="◆" label="Storage" value="84.2 KB / 50 MB" />
            <Row mode={mode} tileFill="rose" tileGlyph="!" label="Allow network" value="On" chevron="◉" last />
          </Group>

          <Group mode={mode}>
            <Row mode={mode} tileFill="mist" tileGlyph="≣" label="Logs" value="38 entries" />
            <Row mode={mode} tileFill="apricot" tileGlyph="i" label="About" />
            <Row mode={mode} tileFill="olive" tileGlyph="♥" label="Tell a friend" />
            <Row mode={mode} tileFill="default" tileGlyph="©" label="Credits" last />
          </Group>

          <Group mode={mode}>
            <Row mode={mode} tileFill="default" tileGlyph="↺" label="Reset library" danger last chevron="" />
          </Group>

          <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint, marginTop: 12 }}>
            SANDBOX Web · v 1.2.0 · build 412 · local-only
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings hub · Mobile ───────────────────────────────────
function SettingsMobile({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar mode={mode} />
      <div style={{ padding: '4px 18px 14px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>Settings</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 14px' }}>
        <Group mode={mode}>
          <Row mode={mode} tileFill="lilac" tileGlyph="◐" label="Appearance" value="System" />
          <Row mode={mode} tileFill="sand" tileGlyph="★" label="Featured" value="6" last />
        </Group>
        <Group mode={mode}>
          <Row mode={mode} tileFill="sky" tileGlyph="⧉" label="Dependencies" value="4" />
          <Row mode={mode} tileFill="sage" tileGlyph="◆" label="Storage" value="84.2 KB" />
          <Row mode={mode} tileFill="rose" tileGlyph="!" label="Allow network" value="On" chevron="◉" last />
        </Group>
        <Group mode={mode}>
          <Row mode={mode} tileFill="mist" tileGlyph="≣" label="Logs" />
          <Row mode={mode} tileFill="apricot" tileGlyph="i" label="About" />
          <Row mode={mode} tileFill="default" tileGlyph="©" label="Credits" last />
        </Group>
        <Group mode={mode}>
          <Row mode={mode} tileFill="default" tileGlyph="↺" label="Reset library" danger last chevron="" />
        </Group>
        <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 9, color: t.inkFaint, marginTop: 4 }}>
          v 1.2.0 · build 412
        </div>
      </div>
      {/* Bottom tab */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${t.divider}`, background: t.paperAlt,
        padding: '8px 0 18px', justifyContent: 'space-around',
      }}>
        {[['▦','Library'],['✎','Compose'],['⚙','Settings', true]].map(([g,l,active]) => (
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

// ── Sub-screen wrapper (mobile-sized card) ──────────────────
function SubShell({ title, mode = 'light', right = null, children, withTabs = false }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', background: t.paper, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar mode={mode} />
      <TopBar mode={mode} title={title} left={<span style={{ fontSize: 13, color: t.inkSoft }}>‹ Settings</span>} right={right} />
      <div style={{ flex: 1, overflow: 'hidden', padding: '14px 14px 16px' }}>{children}</div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

// ── Appearance ──────────────────────────────────────────────
function Appearance({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <SubShell title="Appearance" mode={mode}>
      <Caption mode={mode} style={{ padding: '0 6px 8px' }}>Theme</Caption>
      <Group mode={mode}>
        {[['System','Match this browser', true], ['Light','Cream paper'], ['Dark','Charcoal night']].map(([l, s, sel]) => (
          <div key={l} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderBottom: l === 'Dark' ? 'none' : `1px solid ${t.divider}`,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 999,
              border: `1.5px solid ${sel ? t.ink : t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel && <div style={{ width: 10, height: 10, borderRadius: 999, background: t.ink }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{l}</div>
              <div style={{ fontSize: 11, color: t.inkSoft }}>{s}</div>
            </div>
          </div>
        ))}
      </Group>
      <Caption mode={mode} style={{ padding: '14px 6px 8px' }}>Accent</Caption>
      <div style={{ display: 'flex', gap: 10, padding: '0 6px' }}>
        {[
          ['#e8c547', true, 'yellow'],
          ['#e3a98e', false, 'clay'],
          ['#bcd5ec', false, 'sky'],
          ['#d6c8e8', false, 'lilac'],
          ['#d6e2c8', false, 'sage'],
        ].map(([c, sel, n]) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: c,
              border: `${sel ? '2.5px' : '1.5px'} solid ${sel ? t.ink : t.border}`,
            }} />
            <div style={{ fontSize: 9.5, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>{n}</div>
          </div>
        ))}
      </div>
    </SubShell>
  );
}

// ── Dependencies ────────────────────────────────────────────
function Dependencies({ mode = 'light' }) {
  const t = sbTheme(mode);
  const deps = [
    { name: 'react',          ver: '19.1.0', size: '11 KB',  uses: 12, color: '#bcd5ec', pct: 6 },
    { name: 'react-dom',      ver: '19.1.0', size: '132 KB', uses: 12, color: '#eab6c0', pct: 72 },
    { name: 'chart.js',       ver: '4.4.1',  size: '38 KB',  uses: 2,  color: '#d6e2c8', pct: 21 },
    { name: 'date-fns',       ver: '3.6.0',  size: '28 KB',  uses: 1,  color: '#d6c8e8', pct: 15 },
  ];
  return (
    <SubShell title="Dependencies" mode={mode} right={<span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>Edit</span>}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 6px 4px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>184<span style={{ fontSize: 16, color: t.inkSoft, fontWeight: 500 }}> KB</span></div>
        <div style={{ fontSize: 11, color: t.inkSoft }}>across 4 bundles</div>
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', margin: '4px 6px 14px', border: `1px solid ${t.border}` }}>
        {deps.map((d) => <div key={d.name} style={{ flex: d.pct, background: d.color }} />)}
      </div>
      <Group mode={mode}>
        {deps.map((d, i) => (
          <div key={d.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            borderBottom: i === deps.length - 1 ? 'none' : `1px solid ${t.divider}`,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: d.color, border: `1px solid ${t.ink}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 500 }}>{d.name}<span style={{ color: t.inkSoft, fontWeight: 400 }}> @ {d.ver}</span></div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: t.inkSoft }}>· used in {d.uses} artifacts</div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>{d.size}</div>
          </div>
        ))}
      </Group>
    </SubShell>
  );
}

// ── Storage ─────────────────────────────────────────────────
function Storage({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <SubShell title="Storage" mode={mode}>
      <div style={{ padding: '4px 6px' }}>
        <div style={{ fontSize: 11, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>USED</div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6 }}>84.2 <span style={{ fontSize: 14, color: t.inkSoft, fontWeight: 500 }}>KB</span></div>
        <div style={{ fontSize: 11, color: t.inkSoft }}>0.16% of 50 MB browser quota</div>
      </div>
      <div style={{ display: 'flex', height: 14, borderRadius: 8, overflow: 'hidden', margin: '14px 6px', border: `1px solid ${t.ink}` }}>
        <div style={{ flex: 1, background: '#e3a98e' }} />
        <div style={{ flex: 2.2, background: '#bcd5ec' }} />
        <div style={{ flex: 6, background: t.paperAlt }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 6px', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e3a98e' }} /><span style={{ flex: 1, color: t.ink }}>artifacts (12)</span><span style={{ color: t.inkSoft }}>22.4 KB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#bcd5ec' }} /><span style={{ flex: 1, color: t.ink }}>dependencies (4)</span><span style={{ color: t.inkSoft }}>61.8 KB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: t.paperAlt, border: `1px solid ${t.border}` }} /><span style={{ flex: 1, color: t.inkSoft }}>icons & prefs</span><span style={{ color: t.inkSoft }}>0.2 KB</span>
        </div>
      </div>
      <div style={{ padding: '14px 6px 0' }}>
        <Btn ghost mode={mode} full>Request persistent storage</Btn>
      </div>
    </SubShell>
  );
}

// ── Logs ────────────────────────────────────────────────────
function Logs({ mode = 'light' }) {
  const t = sbTheme(mode);
  const rows = [
    ['09:41:02', 'info',  'mount · pomodoro.jsx'],
    ['09:41:02', 'info',  'react 19.1.0 ready'],
    ['09:41:03', 'log',   'setInterval → tick'],
    ['09:41:18', 'warn',  'state update on unmounted comp'],
    ['09:41:33', 'error', 'fetch failed: chart.js (offline)'],
    ['09:42:02', 'info',  'mount · habits.jsx'],
    ['09:42:02', 'log',   'loaded date-fns @ 3.6.0'],
  ];
  const tone = { info: t.inkSoft, log: t.ink, warn: '#b48a08', error: t.destructive };
  return (
    <SubShell title="Logs" mode={mode} right={<span style={{ fontSize: 13, color: t.destructive, fontWeight: 600 }}>Clear</span>}>
      <Input placeholder="filter…" icon="⌕" mode={mode} height={30} style={{ fontSize: 11 }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, marginBottom: 10 }}>
        {['all','info','warn','error'].map((k, i) => <Pill key={k} tone={i === 0 ? 'ink' : 'neutral'} mode={mode}>{k}</Pill>)}
      </div>
      <div style={{
        background: mode === 'dark' ? '#0e0e0e' : t.paperAlt,
        border: `1px solid ${t.border}`, borderRadius: 8,
        padding: 10, fontFamily: 'JetBrains Mono', fontSize: 10, lineHeight: 1.7,
        overflow: 'hidden',
      }}>
        {rows.map(([ts, lvl, msg], i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: t.inkFaint }}>{ts}</span>
            <span style={{ color: tone[lvl], textTransform: 'uppercase', width: 38 }}>{lvl}</span>
            <span style={{ color: t.ink, flex: 1 }}>{msg}</span>
          </div>
        ))}
      </div>
    </SubShell>
  );
}

// ── Featured ────────────────────────────────────────────────
function Featured({ mode = 'light' }) {
  const t = sbTheme(mode);
  const apps = [
    { name: 'Pomodoro',  fill: 'rose',    glyph: 'PM', added: true,  desc: 'Focus / break timer' },
    { name: 'Tip',       fill: 'sage',    glyph: '$',  added: true,  desc: 'Split the bill, fairly' },
    { name: 'Palette',   fill: 'lilac',   glyph: 'PL', added: true,  desc: 'Random color palettes' },
    { name: 'Dice',      fill: 'sky',     glyph: '⚄',  added: false, desc: 'Roll multi-dice' },
    { name: 'Stopwatch', fill: 'apricot', glyph: 'SW', added: false, desc: 'Lap timer · tabular nums' },
    { name: 'Habits',    fill: 'olive',   glyph: 'HB', added: false, desc: 'Daily habit checklist' },
  ];
  return (
    <SubShell title="Featured" mode={mode}>
      <div style={{ fontSize: 12, color: t.inkSoft, padding: '0 6px 12px', lineHeight: 1.5 }}>
        6 built-in starter artifacts — add any to your Library to play with the runtime.
      </div>
      <Group mode={mode}>
        {apps.map((a, i) => (
          <div key={a.name} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderBottom: i === apps.length - 1 ? 'none' : `1px solid ${t.divider}`,
          }}>
            <AppIcon size={36} fill={a.fill} glyph={a.glyph} mode={mode} style={{ borderRadius: 9 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
              <div style={{ fontSize: 11, color: t.inkSoft }}>{a.desc}</div>
            </div>
            {a.added
              ? <span style={{ fontSize: 11, color: t.inkSoft, fontFamily: 'JetBrains Mono' }}>✓ added</span>
              : <Btn primary mode={mode} size="sm">Add</Btn>}
          </div>
        ))}
      </Group>
    </SubShell>
  );
}

// ── About ───────────────────────────────────────────────────
function About({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <SubShell title="About" mode={mode}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 0 20px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: t.accent, border: `1.5px solid ${t.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>S</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>SANDBOX Web</div>
        <div style={{ fontSize: 12, color: t.inkSoft }}>Run AI artifacts in your browser.</div>
      </div>
      <Group mode={mode}>
        <Row mode={mode} tileFill="default" tileGlyph="v" label="Version" value="1.2.0 (412)" chevron="" />
        <Row mode={mode} tileFill="default" tileGlyph="@" label="Runtime" value="React 19.1.0" chevron="" />
        <Row mode={mode} tileFill="default" tileGlyph="◐" label="Storage" value="IndexedDB · Dexie" chevron="" />
        <Row mode={mode} tileFill="default" tileGlyph="⌂" label="Platform" value="Web · static site" chevron="" last />
      </Group>
      <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: 9.5, color: t.inkFaint, marginTop: 16, lineHeight: 1.6 }}>
        local-only · no account · no telemetry<br/>
        accounts + sync — deferred to a later version
      </div>
    </SubShell>
  );
}

// ── Credits ─────────────────────────────────────────────────
function Credits({ mode = 'light' }) {
  const t = sbTheme(mode);
  const oss = [
    ['React',       '19.1.0',   'MIT'],
    ['Dexie.js',    '4.0',      'Apache 2.0'],
    ['Tailwind CSS','runtime',  'MIT'],
    ['Babel Standalone','7.x',  'MIT'],
    ['lucide',      '1.14',     'ISC'],
    ['Inter',       'Variable', 'OFL'],
  ];
  return (
    <SubShell title="Credits" mode={mode}>
      <Caption mode={mode} style={{ padding: '0 6px 8px' }}>Open source</Caption>
      <Group mode={mode}>
        {oss.map((row, i) => (
          <div key={row[0]} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
            borderBottom: i === oss.length - 1 ? 'none' : `1px solid ${t.divider}`,
            fontFamily: 'JetBrains Mono', fontSize: 11,
          }}>
            <span style={{ flex: 1, color: t.ink }}>{row[0]}</span>
            <span style={{ color: t.inkSoft, width: 70 }}>{row[1]}</span>
            <span style={{ color: t.inkFaint, width: 70, textAlign: 'right' }}>{row[2]}</span>
          </div>
        ))}
      </Group>
      <Caption mode={mode} style={{ padding: '14px 6px 8px' }}>Builder</Caption>
      <Group mode={mode}>
        <Row mode={mode} tileFill="sky"  tileGlyph="@" label="Website" value="@yourdomain" />
        <Row mode={mode} tileFill="default" tileGlyph="G" label="GitHub" value="@you" />
        <Row mode={mode} tileFill="default" tileGlyph="@" label="Email" last value="hi@…" />
      </Group>
    </SubShell>
  );
}

Object.assign(window, {
  SettingsDesktop, SettingsMobile,
  Appearance, Dependencies, Storage, Logs, Featured, About, Credits,
});
