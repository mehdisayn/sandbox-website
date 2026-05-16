/* global React, AppIcon, Btn, Input, Pill, Caption, Hatch, sbTheme, StatusBar, HomeIndicator, TopBar, SBSidebar */

// Empty / first-run + Add-to-Library (Share/Import) modal
// ──────────────────────────────────────────────────────────────

// ── Empty state · Desktop ──────────────────────────────────
function EmptyDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ display: 'flex', height: '100%', background: t.paper }}>
      <SBSidebar active="library" mode={mode} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 28, position: 'relative' }}>

        {/* Card stack illustration */}
        <div style={{ position: 'relative', width: 200, height: 140 }}>
          <div style={{ position: 'absolute', left: 30, top: 22, width: 130, height: 90, borderRadius: 14, background: t.paperAlt, border: `1.5px solid ${t.ink}`, transform: 'rotate(-6deg)' }} />
          <div style={{ position: 'absolute', left: 22, top: 14, width: 130, height: 90, borderRadius: 14, background: t.card, border: `1.5px solid ${t.ink}`, transform: 'rotate(-2deg)' }} />
          <div style={{ position: 'absolute', left: 40, top: 4, width: 130, height: 90, borderRadius: 14, background: t.accentSoft, border: `1.5px solid ${t.ink}`, transform: 'rotate(4deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
            <AppIcon size={40} fill="rose" glyph="JSX" mode={mode} />
            <div style={{ fontSize: 10, fontWeight: 600, transform: 'rotate(-4deg)' }}>my-app.jsx</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', maxWidth: 460 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>Run AI artifacts in your browser.</div>
          <div style={{ fontSize: 14, color: t.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
            Drop a .jsx or .html file, paste a Claude artifact, or import from a URL. SANDBOX keeps every one in your personal library — runnable from any browser, no install.
          </div>
        </div>

        <div style={{
          width: 560, padding: '28px 24px',
          border: `1.5px dashed ${t.ink}`, borderRadius: 14,
          background: t.card,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft, letterSpacing: 1 }}>DROPZONE</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Drop a file here</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkFaint }}>.jsx · .html · .htm · .js · .txt</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <Btn mode={mode}>Pick a file</Btn>
            <Btn mode={mode}>Paste code</Btn>
            <Btn mode={mode}>Import URL</Btn>
            <Btn primary mode={mode}>Try a sample</Btn>
          </div>
        </div>

        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint, marginTop: 4 }}>
          local-only · no account · stored in this browser
        </div>
      </div>
    </div>
  );
}

// ── Empty state · Mobile ────────────────────────────────────
function EmptyMobile({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: t.paper, position: 'relative' }}>
      <StatusBar mode={mode} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 22px', gap: 22 }}>

        <div style={{ position: 'relative', width: 160, height: 120 }}>
          <div style={{ position: 'absolute', left: 24, top: 18, width: 110, height: 76, borderRadius: 12, background: t.paperAlt, border: `1.5px solid ${t.ink}`, transform: 'rotate(-6deg)' }} />
          <div style={{ position: 'absolute', left: 18, top: 10, width: 110, height: 76, borderRadius: 12, background: t.card, border: `1.5px solid ${t.ink}`, transform: 'rotate(-2deg)' }} />
          <div style={{ position: 'absolute', left: 32, top: 2, width: 110, height: 76, borderRadius: 12, background: t.accentSoft, border: `1.5px solid ${t.ink}`, transform: 'rotate(4deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon size={34} fill="rose" glyph="JSX" mode={mode} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 }}>Run AI artifacts<br />in your browser.</div>
          <div style={{ fontSize: 12.5, color: t.inkSoft, marginTop: 10, lineHeight: 1.5 }}>
            Drop, paste, or import a .jsx or .html artifact.<br />SANDBOX keeps your library local to this browser.
          </div>
        </div>

        <Btn primary mode={mode} size="lg" style={{ width: '100%', marginTop: 6 }}>＋ Add your first artifact</Btn>

        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>
          try a sample · or paste from clipboard
        </div>
      </div>
      <HomeIndicator mode={mode} />
    </div>
  );
}

// ── Add to Library · Desktop modal (centered) ───────────────
function AddDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', position: 'relative', background: t.paper, overflow: 'hidden' }}>
      {/* Library faintly behind */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }}>
        <div style={{ padding: '40px 60px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 30 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: 60, height: 60, borderRadius: 16, background: t.paperAlt, border: `1.5px solid ${t.ink}` }} />
          ))}
        </div>
      </div>
      {/* Backdrop blur */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.32)', backdropFilter: 'blur(2px)' }} />

      {/* Modal */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 540, background: t.card, border: `1.5px solid ${t.ink}`, borderRadius: 16,
        boxShadow: '0 12px 0 rgba(26,26,26,0.08)',
        padding: '20px 22px 18px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn ghost mode={mode}>Cancel</Btn>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Add to Library</div>
          <Btn primary mode={mode}>Add</Btn>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: t.paperAlt, padding: 4, borderRadius: 10, border: `1px solid ${t.border}` }}>
          {[['⎘','File'], ['⌨','Paste', true], ['@','URL']].map(([g, l, active]) => (
            <div key={l} style={{
              flex: 1, padding: '7px 8px', borderRadius: 7,
              background: active ? t.card : 'transparent',
              border: active ? `1px solid ${t.border}` : '1px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 12, fontWeight: 500, color: active ? t.ink : t.inkSoft,
            }}>
              <span style={{ fontFamily: 'JetBrains Mono' }}>{g}</span>{l}
            </div>
          ))}
        </div>

        {/* Preview row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: t.paperAlt, borderRadius: 12, border: `1px solid ${t.border}` }}>
          <AppIcon size={48} fill="rose" emoji="🍅" mode={mode} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 500 }}>pomodoro.jsx</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkSoft, marginTop: 2 }}>1.2 KB · pasted from clipboard</div>
          </div>
          <Pill tone="accent">JSX</Pill>
        </div>

        {/* Name */}
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, fontWeight: 600, letterSpacing: 1, color: t.inkSoft, marginBottom: 6 }}>NAME</div>
          <Input value="Pomodoro" mode={mode} />
        </div>

        {/* Icon picker */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, fontWeight: 600, letterSpacing: 1, color: t.inkSoft }}>ICON</div>
            <div style={{ display: 'flex', gap: 4, fontSize: 11, color: t.inkSoft }}>
              <span style={{ padding: '2px 8px', borderRadius: 6, border: `1px solid ${t.ink}`, color: t.ink, fontWeight: 500 }}>Emoji</span>
              <span style={{ padding: '2px 8px' }}>Glyph</span>
              <span style={{ padding: '2px 8px' }}>Upload</span>
              <span style={{ padding: '2px 8px' }}>Auto</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
            {['🍅','⏱','⏰','🎯','📝','🎲','🎨','📊','📚','📂','🌤','🌙','⭐','🍔','✂','🔔','🧮','💡','🪄','🛒'].map((e, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 8,
                border: i === 0 ? `1.5px solid ${t.ink}` : `1px solid ${t.border}`,
                background: i === 0 ? t.accentSoft : t.card,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{e}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'JetBrains Mono', fontSize: 10, color: t.inkFaint }}>
          <span>imports detected:</span>
          <Pill mode={mode}>chart.js</Pill>
          <Pill mode={mode}>date-fns</Pill>
          <span>· will fetch on save</span>
        </div>
      </div>
    </div>
  );
}

// ── Add to Library · Mobile bottom-sheet ────────────────────
function AddMobile({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ height: '100%', position: 'relative', background: t.paper, overflow: 'hidden' }}>
      <StatusBar mode={mode} />
      <div style={{ padding: 18, opacity: 0.4 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Library</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.3)' }} />

      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: t.card, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        border: `1.5px solid ${t.ink}`, borderBottom: 'none',
        padding: '12px 18px 22px',
        display: 'flex', flexDirection: 'column', gap: 14,
        maxHeight: '85%',
      }}>
        {/* Grabber */}
        <div style={{ width: 40, height: 4, background: t.border, borderRadius: 2, alignSelf: 'center', marginBottom: 4 }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: t.inkSoft }}>Cancel</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Add to Library</span>
          <span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>Add</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: t.paperAlt, borderRadius: 12, border: `1px solid ${t.border}` }}>
          <AppIcon size={40} fill="rose" emoji="🍅" mode={mode} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 500 }}>pomodoro.jsx</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: t.inkSoft }}>1.2 KB</div>
          </div>
          <Pill tone="accent">JSX</Pill>
        </div>

        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, fontWeight: 600, letterSpacing: 1, color: t.inkSoft, marginBottom: 6 }}>NAME</div>
          <Input value="Pomodoro" mode={mode} />
        </div>

        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <span style={{ padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${t.ink}`, fontSize: 11, fontWeight: 500 }}>Emoji</span>
            <span style={{ padding: '4px 10px', fontSize: 11, color: t.inkSoft }}>Glyph</span>
            <span style={{ padding: '4px 10px', fontSize: 11, color: t.inkSoft }}>Upload</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
            {['🍅','⏱','⏰','🎯','📝','🎲','🎨','📊','📚','📂','🌤','🌙','⭐','🍔','✂','🔔'].map((e, i) => (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 8,
                border: i === 0 ? `1.5px solid ${t.ink}` : `1px solid ${t.border}`,
                background: i === 0 ? t.accentSoft : t.card,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{e}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Drag-over state (Desktop) — file mid-drop ───────────────
function DragOverDesktop({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ display: 'flex', height: '100%', background: t.paper, position: 'relative' }}>
      <SBSidebar active="library" mode={mode} />
      <div style={{ flex: 1, padding: '28px 32px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4, opacity: 0.3 }}>Library</div>
        <div style={{
          marginTop: 20,
          height: 'calc(100% - 64px)',
          border: `2.5px dashed ${t.accent}`, borderRadius: 18,
          background: t.accentSoft,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 52, opacity: 0.5 }}>⤓</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Drop to add to Library</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: t.inkSoft }}>1 file · my-app.jsx · 2.4 KB</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EmptyDesktop, EmptyMobile, AddDesktop, AddMobile, DragOverDesktop });
