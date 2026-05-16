// Tokens ported from design/project/kit.jsx — SB_LIGHT / SB_DARK / SB_FILLS.
// The CSS variable form (consumed by Tailwind) lives in src/index.css.
// This file exists for code that needs raw hex (e.g. <meta name="theme-color">).

export const SB_LIGHT = {
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
} as const;

export const SB_DARK = {
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
} as const;

export const SB_FILLS = {
  light: {
    default: '#ece8de', sage: '#d6e2c8', olive: '#cdd3a8', sand: '#ecdfb6',
    apricot: '#f3cf9d', clay: '#e3a98e', rose: '#eab6c0', lilac: '#d6c8e8',
    sky: '#bcd5ec', mist: '#cfd9d6', stone: '#c9c4b7',
  },
  dark: {
    default: '#2a2a2a', sage: '#3a4a30', olive: '#3f4326', sand: '#4a3e1f',
    apricot: '#5a3e23', clay: '#5a3022', rose: '#5a2a36', lilac: '#3a2a52',
    sky: '#1f3a52', mist: '#2f3a38', stone: '#3a382f',
  },
} as const;

export type FillName = keyof typeof SB_FILLS['light'];
export type ThemeMode = 'light' | 'dark';
