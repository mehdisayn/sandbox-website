import type { Config } from 'tailwindcss';

// Tokens from design/project/kit.jsx — SB_LIGHT / SB_DARK / SB_FILLS.
// CSS variables drive dark mode; static fallbacks are the light values.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink:         'rgb(var(--ink) / <alpha-value>)',
        'ink-soft':  'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        paper:       'rgb(var(--paper) / <alpha-value>)',
        'paper-alt': 'rgb(var(--paper-alt) / <alpha-value>)',
        card:        'rgb(var(--card) / <alpha-value>)',
        divider:     'rgb(var(--divider) / <alpha-value>)',
        border:      'rgb(var(--border) / <alpha-value>)',
        accent:      'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        destructive: 'rgb(var(--destructive) / <alpha-value>)',
        // tile fill palette — used as `bg-fill-sage` etc.
        fill: {
          default: 'rgb(var(--fill-default) / <alpha-value>)',
          sage:    'rgb(var(--fill-sage) / <alpha-value>)',
          olive:   'rgb(var(--fill-olive) / <alpha-value>)',
          sand:    'rgb(var(--fill-sand) / <alpha-value>)',
          apricot: 'rgb(var(--fill-apricot) / <alpha-value>)',
          clay:    'rgb(var(--fill-clay) / <alpha-value>)',
          rose:    'rgb(var(--fill-rose) / <alpha-value>)',
          lilac:   'rgb(var(--fill-lilac) / <alpha-value>)',
          sky:     'rgb(var(--fill-sky) / <alpha-value>)',
          mist:    'rgb(var(--fill-mist) / <alpha-value>)',
          stone:   'rgb(var(--fill-stone) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        tile: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config;
