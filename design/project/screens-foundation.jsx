/* global React, AppIcon, SB_FILLS, sbTheme, Caption, Pill, Btn, Input, Hatch */

// Foundation card — sets the wireframe's visual vocabulary
// ──────────────────────────────────────────────────────────────

function Foundation() {
  const cell = { display: 'flex', flexDirection: 'column', gap: 8 };
  const Swatch = ({ hex, name, mode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <div style={{ width: 22, height: 22, borderRadius: 4, background: hex, border: `1px solid ${mode === 'dark' ? '#3a3a3a' : '#cfc9b8'}` }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: mode === 'dark' ? '#a8a8a8' : '#5a5a5a' }}>{name}</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: mode === 'dark' ? '#f4f3ee' : '#1a1a1a' }}>{hex}</div>
      </div>
    </div>
  );

  const ColorBlock = ({ mode }) => {
    const t = sbTheme(mode);
    return (
      <div style={{
        background: t.paper, color: t.ink,
        border: `1.5px solid ${mode === 'dark' ? '#3a3a3a' : '#1a1a1a'}`,
        borderRadius: 12, padding: 18, flex: 1,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Caveat', fontSize: 22, fontWeight: 600 }}>{mode === 'dark' ? 'Dark' : 'Light'}</span>
          <Caption mode={mode}>{mode === 'dark' ? '#171717 paper' : '#fbfaf6 paper'}</Caption>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Swatch hex={t.ink} name="ink" mode={mode} />
          <Swatch hex={t.inkSoft} name="ink soft" mode={mode} />
          <Swatch hex={t.paperAlt} name="paper alt" mode={mode} />
          <Swatch hex={t.card} name="card" mode={mode} />
          <Swatch hex={t.border} name="border" mode={mode} />
          <Swatch hex={t.divider} name="divider" mode={mode} />
          <Swatch hex={t.accent} name="accent" mode={mode} />
          <Swatch hex={t.destructive} name="destructive" mode={mode} />
        </div>
      </div>
    );
  };

  const fillNames = ['default','sage','olive','sand','apricot','clay','rose','lilac','sky','mist','stone'];

  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, height: '100%', boxSizing: 'border-box', background: '#fbfaf6' }}>
      {/* Left column: type + tokens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <Caption>System / typography</Caption>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: 'Inter', fontSize: 32, fontWeight: 700, letterSpacing: -0.6 }}>SANDBOX <span style={{ color: '#9a9282', fontWeight: 400, fontSize: 24 }}>/ Web</span></div>
            <div style={{ fontFamily: 'Inter', fontSize: 14, color: '#5a5a5a' }}>Inter — UI, 400/500/600/700 · large title 32/-0.6 · body 13–14 · caption 11</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#1a1a1a', marginTop: 4 }}>JetBrains Mono — filenames, sizes, timers</div>
            <div style={{ fontFamily: 'Caveat', fontSize: 22, color: '#b4271f', marginTop: 4 }}>Caveat — wireframe annotations only</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <ColorBlock mode="light" />
          <ColorBlock mode="dark" />
        </div>

        <div>
          <Caption>Component vocabulary</Caption>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <Btn primary>Add</Btn>
            <Btn>Cancel</Btn>
            <Btn ghost>Skip</Btn>
            <Btn danger>Delete</Btn>
            <Pill tone="accent">JSX</Pill>
            <Pill>HTML</Pill>
            <Pill tone="ink">v 1.2.0</Pill>
            <Pill tone="danger">offline</Pill>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <Input placeholder="Search artifacts…" icon="⌕" full={false} style={{ width: 240 }} />
            <Input placeholder="https://… raw .jsx URL" mono icon="@" full={false} style={{ width: 280 }} />
          </div>
        </div>
      </div>

      {/* Right column: icon system */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <Caption>App-icon system — 56px tile · 16r · 1.5px ink border</Caption>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: '#5a5a5a', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>fills — light</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {fillNames.map((f) => (
                  <div key={f} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <AppIcon size={44} fill={f} glyph={f.slice(0, 2).toUpperCase()} mode="light" />
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#5a5a5a' }}>{f}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#5a5a5a', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>fills — dark</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 10, background: '#171717', borderRadius: 8 }}>
                {fillNames.map((f) => (
                  <div key={f} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <AppIcon size={44} fill={f} glyph={f.slice(0, 2).toUpperCase()} mode="dark" />
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#a8a8a8' }}>{f}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Caption>Three icon types · stored as (type, value)</Caption>
          <div style={{ marginTop: 12, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <AppIcon size={56} fill="rose" emoji="🍅" />
              <Pill style={{ marginTop: 4 }}>emoji</Pill>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#5a5a5a' }}>'🍅'</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <AppIcon size={56} fill="lilac" glyph="PL" />
              <Pill style={{ marginTop: 4 }}>glyph</Pill>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#5a5a5a' }}>'palette'</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <AppIcon size={56} fill="default" image />
              <Pill style={{ marginTop: 4 }}>image</Pill>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#5a5a5a' }}>blob://…</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Foundation = Foundation;
