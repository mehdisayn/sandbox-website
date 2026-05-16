/* global React */

// SANDBOX wireframe kit — shared primitives, tokens, and aesthetic
// ──────────────────────────────────────────────────────────────

const SB_LIGHT = {
  ink: '#1a1a1a',
  inkSoft: '#5a5a5a',
  inkFaint: '#a6a6a6',
  paper: '#fbfaf6',
  paperAlt: '#f3f1ea',
  card: '#ffffff',
  divider: '#d9d4c7',
  border: '#cfc9b8',
  accent: '#e8c547',
  accentSoft: '#fdf6dc',
  destructive: '#c0392b',
};

const SB_DARK = {
  ink: '#f4f3ee',
  inkSoft: '#a8a8a8',
  inkFaint: '#666666',
  paper: '#171717',
  paperAlt: '#0e0e0e',
  card: '#1a1a1a',
  divider: '#3a3a3a',
  border: '#3a3a3a',
  accent: '#e8c547',
  accentSoft: '#3a3216',
  destructive: '#c0392b',
};

// Tile fill palette for app icons (the 10 named fills + default)
const SB_FILLS = {
  light: {
    default: '#ece8de',
    sage:    '#d6e2c8',
    olive:   '#cdd3a8',
    sand:    '#ecdfb6',
    apricot: '#f3cf9d',
    clay:    '#e3a98e',
    rose:    '#eab6c0',
    lilac:   '#d6c8e8',
    sky:     '#bcd5ec',
    mist:    '#cfd9d6',
    stone:   '#c9c4b7',
  },
  dark: {
    default: '#2a2a2a',
    sage:    '#3a4a30',
    olive:   '#3f4326',
    sand:    '#4a3e1f',
    apricot: '#5a3e23',
    clay:    '#5a3022',
    rose:    '#5a2a36',
    lilac:   '#3a2a52',
    sky:     '#1f3a52',
    mist:    '#2f3a38',
    stone:   '#3a382f',
  },
};

function sbTheme(mode) { return mode === 'dark' ? SB_DARK : SB_LIGHT; }

// ── Primitives ────────────────────────────────────────────────

// Frame — a screen viewport. Holds the wireframe content with ink border + paper bg.
function Frame({ width, height, mode = 'light', label, sub, kind = 'mobile', children, scale = 1, style = {} }) {
  const t = sbTheme(mode);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 12, ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: 'Caveat', fontSize: 22, color: '#1a1a1a' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        {sub && <span style={{ fontSize: 16, color: '#7a7466' }}>· {sub}</span>}
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontSize: 10, color: '#9a9282', letterSpacing: 0.5 }}>
          {kind === 'desktop' ? `${Math.round(width)}×${Math.round(height)}` : `${Math.round(width)}×${Math.round(height)}`}
        </span>
      </div>
      <div style={{
        width, height,
        background: t.paper,
        border: `1.5px solid ${mode === 'dark' ? '#3a3a3a' : '#1a1a1a'}`,
        borderRadius: kind === 'mobile' ? 28 : 8,
        boxShadow: '0 2px 0 rgba(26,26,26,0.06), 6px 8px 0 rgba(26,26,26,0.04)',
        overflow: 'hidden',
        position: 'relative',
        color: t.ink,
        fontFamily: 'Inter',
      }}>
        {children}
      </div>
    </div>
  );
}

// HandNote — handwritten annotation pinned in the artboard margin
function HandNote({ children, top, left, right, bottom, rotate = -2, width = 160, color = '#b4271f', arrow = null }) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom, width,
      transform: `rotate(${rotate}deg)`,
      fontFamily: 'Caveat', fontSize: 18, lineHeight: 1.15,
      color, zIndex: 5, pointerEvents: 'none',
    }}>
      {children}
      {arrow && (
        <div style={{ position: 'absolute', ...arrow.pos, fontSize: 22 }}>{arrow.char || '↘'}</div>
      )}
    </div>
  );
}

// Hatch — diagonal hatched placeholder background
function Hatch({ width = '100%', height = 80, dense = false, color = 'rgba(26,26,26,0.18)', radius = 4, children, style = {} }) {
  const size = dense ? 5 : 7;
  return (
    <div style={{
      width, height, borderRadius: radius,
      backgroundImage: `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px ${size}px)`,
      border: `1px dashed ${color.replace('0.18', '0.35')}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono', fontSize: 10, color: color.replace('0.18', '0.55'),
      textTransform: 'uppercase', letterSpacing: 1,
      ...style,
    }}>{children}</div>
  );
}

// AppIcon — the rounded tile with glyph (the heart of SANDBOX's visual identity)
function AppIcon({ size = 56, fill = 'default', glyph = '', mode = 'light', emoji = null, image = false, style = {} }) {
  const t = sbTheme(mode);
  const bg = SB_FILLS[mode][fill] || SB_FILLS[mode].default;
  const r = Math.round(size * 0.28);
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: image ? undefined : bg,
      backgroundImage: image ? `repeating-linear-gradient(135deg, rgba(26,26,26,0.2) 0 1px, transparent 1px 6px)` : undefined,
      border: `1.5px solid ${t.ink}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: emoji ? 'system-ui' : 'JetBrains Mono',
      fontSize: emoji ? size * 0.52 : Math.max(10, size * 0.22),
      color: t.ink, fontWeight: 600, letterSpacing: 0.5,
      flexShrink: 0,
      ...style,
    }}>
      {emoji || glyph}
    </div>
  );
}

// Btn — a sketched button placeholder
function Btn({ children, primary = false, ghost = false, danger = false, full = false, mode = 'light', size = 'md', style = {} }) {
  const t = sbTheme(mode);
  const h = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  let bg = t.card, fg = t.ink, bd = t.ink;
  if (primary) { bg = t.ink; fg = t.paper; bd = t.ink; }
  if (ghost) { bg = 'transparent'; fg = t.ink; bd = t.border; }
  if (danger) { bg = 'transparent'; fg = t.destructive; bd = t.destructive; }
  return (
    <div style={{
      height: h, padding: size === 'lg' ? '0 22px' : '0 14px',
      borderRadius: 12, border: `1.5px solid ${bd}`,
      background: bg, color: fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontSize: size === 'sm' ? 12 : 13, fontWeight: 500,
      width: full ? '100%' : undefined,
      ...style,
    }}>{children}</div>
  );
}

// Input — sketched input field
function Input({ placeholder, value, mono = false, mode = 'light', icon = null, full = true, height = 36, style = {} }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      height, padding: '0 12px',
      borderRadius: 10, border: `1.5px solid ${t.border}`,
      background: t.card,
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: value ? t.ink : t.inkSoft,
      fontFamily: mono ? 'JetBrains Mono' : 'Inter',
      width: full ? '100%' : undefined,
      ...style,
    }}>
      {icon && <span style={{ color: t.inkSoft, fontFamily: 'JetBrains Mono', fontSize: 11, opacity: 0.6 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{value || placeholder}</span>
    </div>
  );
}

// Pill — small label/badge
function Pill({ children, mode = 'light', tone = 'neutral', style = {} }) {
  const t = sbTheme(mode);
  const tones = {
    neutral: { bg: t.paperAlt, fg: t.inkSoft, bd: t.border },
    accent:  { bg: t.accentSoft, fg: '#7a5a08', bd: t.accent },
    danger:  { bg: 'transparent', fg: t.destructive, bd: t.destructive },
    ink:     { bg: t.ink, fg: t.paper, bd: t.ink },
  };
  const c = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: c.bg, color: c.fg, border: `1px solid ${c.bd}`,
      fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 500, letterSpacing: 0.5,
      ...style,
    }}>{children}</span>
  );
}

// Row — a settings/details row (icon · label · value · chevron)
function Row({ tileFill = 'default', tileGlyph = '·', label, value, mode = 'light', last = false, danger = false, chevron = '›', tileSize = 26 }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      borderBottom: last ? 'none' : `1px solid ${t.divider}`,
    }}>
      <AppIcon size={tileSize} fill={tileFill} glyph={tileGlyph} mode={mode} />
      <span style={{ flex: 1, fontSize: 14, color: danger ? t.destructive : t.ink, fontWeight: 500 }}>{label}</span>
      {value && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: t.inkSoft }}>{value}</span>}
      <span style={{ color: t.inkFaint, fontSize: 18 }}>{chevron}</span>
    </div>
  );
}

// Card group container — bordered rounded "group" list
function Group({ children, mode = 'light', label, style = {} }) {
  const t = sbTheme(mode);
  return (
    <div style={{ marginBottom: 18, ...style }}>
      {label && (
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: 1, color: t.inkSoft,
          textTransform: 'uppercase', padding: '0 14px 8px',
        }}>{label}</div>
      )}
      <div style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

// Top bar — mobile or desktop nav row
function TopBar({ title, left = null, right = null, mode = 'light', kind = 'mobile', center = true }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: kind === 'mobile' ? '14px 16px 12px' : '14px 22px 12px',
      borderBottom: `1px solid ${t.divider}`,
      background: t.paper,
    }}>
      <div style={{ minWidth: 60, display: 'flex', alignItems: 'center', gap: 8 }}>{left}</div>
      <div style={{ flex: 1, textAlign: center ? 'center' : 'left', fontWeight: 600, fontSize: 14, color: t.ink, letterSpacing: -0.2 }}>{title}</div>
      <div style={{ minWidth: 60, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>{right}</div>
    </div>
  );
}

// StatusBar — mobile status bar (time + indicators)
function StatusBar({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      height: 32, padding: '0 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13, fontWeight: 600, color: t.ink, fontVariantNumeric: 'tabular-nums',
    }}>
      <span>9:41</span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: 1 }}>•••  ◐  ▮</span>
    </div>
  );
}

// HomeIndicator — bottom home bar
function HomeIndicator({ mode = 'light' }) {
  const t = sbTheme(mode);
  return (
    <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', width: 120, height: 4, borderRadius: 2, background: t.ink, opacity: 0.7 }} />
  );
}

// Sketchy divider line
function Divider({ mode = 'light', dashed = false, vertical = false, style = {} }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      [vertical ? 'width' : 'height']: 1,
      [vertical ? 'height' : 'width']: '100%',
      borderTop: !vertical ? (dashed ? `1px dashed ${t.divider}` : `1px solid ${t.divider}`) : undefined,
      borderLeft: vertical ? (dashed ? `1px dashed ${t.divider}` : `1px solid ${t.divider}`) : undefined,
      ...style,
    }} />
  );
}

// Caption — small uppercase mono label for sections
function Caption({ children, mode = 'light', style = {} }) {
  const t = sbTheme(mode);
  return (
    <div style={{
      fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 600,
      letterSpacing: 1.2, textTransform: 'uppercase', color: t.inkSoft,
      ...style,
    }}>{children}</div>
  );
}

// Glyph chip — circular badge with a single mono char (for sidebar nav, etc.)
function Glyph({ char, size = 16, mode = 'light', style = {} }) {
  const t = sbTheme(mode);
  return (
    <span style={{
      width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono', fontSize: size * 0.65, color: t.inkSoft, fontWeight: 600,
      flexShrink: 0,
      ...style,
    }}>{char}</span>
  );
}

// SampleArtifacts — the data set the wireframes reference everywhere
const SAMPLE = [
  { name: 'Pomodoro',     glyph: 'PM', fill: 'rose',    kind: 'jsx',  size: '1.2 KB', deps: 0, opened: 'today'      },
  { name: 'Tip Calc',     glyph: '$',  fill: 'sage',    kind: 'jsx',  size: '0.9 KB', deps: 0, opened: '2h ago'     },
  { name: 'Palette',      glyph: 'PL', fill: 'lilac',   kind: 'html', size: '1.4 KB', deps: 0, opened: 'yesterday'  },
  { name: 'Dice',         glyph: '⚄',  fill: 'sky',     kind: 'jsx',  size: '0.6 KB', deps: 0, opened: '3d ago'     },
  { name: 'Stopwatch',    glyph: 'SW', fill: 'apricot', kind: 'jsx',  size: '0.8 KB', deps: 0, opened: '5d ago'     },
  { name: 'Habits',       glyph: 'HB', fill: 'olive',   kind: 'jsx',  size: '2.1 KB', deps: 1, opened: 'a week ago' },
  { name: 'Sparkline',    glyph: '~~', fill: 'mist',    kind: 'jsx',  size: '3.4 KB', deps: 1, opened: 'a week ago' },
  { name: 'Color Picker', glyph: '◐',  fill: 'clay',    kind: 'jsx',  size: '1.7 KB', deps: 0, opened: '2w ago'     },
  { name: 'Markdown',     glyph: 'MD', fill: 'sand',    kind: 'jsx',  size: '4.2 KB', deps: 2, opened: '3w ago'     },
  { name: 'Currency',     glyph: '€',  fill: 'stone',   kind: 'jsx',  size: '1.9 KB', deps: 1, opened: 'a month ago'},
  { name: 'Notes',        glyph: '✎',  fill: 'sage',    kind: 'jsx',  size: '2.6 KB', deps: 0, opened: 'a month ago'},
  { name: 'Weather',      glyph: '☁',  fill: 'sky',     kind: 'jsx',  size: '3.1 KB', deps: 1, opened: 'a month ago', net: true },
];

Object.assign(window, {
  SB_LIGHT, SB_DARK, SB_FILLS, sbTheme, SAMPLE,
  Frame, HandNote, Hatch, AppIcon, Btn, Input, Pill, Row, Group,
  TopBar, StatusBar, HomeIndicator, Divider, Caption, Glyph,
});
