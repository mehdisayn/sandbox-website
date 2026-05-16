# SANDBOX Web — Design Spec

**Status:** Draft v1 · pre-build
**Last updated:** May 2026
**Source of truth:** `design/project/*.jsx` — wireframe prototypes from Claude Design.
**Companion docs:** [`PRD.md`](./PRD.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) · [`idea.md`](./idea.md)

This document is the **visual contract** for SANDBOX Web. It distills the wireframe bundle in `design/project/` into the tokens, typography, components, and screen layouts that production code must match. When this document and the wireframes disagree, the wireframes win — read them directly.

> Implement the visual output, not the prototype's structure. The wireframes use a single-file React-via-Babel setup for fast iteration; production is Vite + React + TS + Tailwind (see [`ARCHITECTURE.md`](./ARCHITECTURE.md) §8).

---

## 1. Aesthetic in one paragraph

SANDBOX is a **paper-and-ink wireframe aesthetic** brought to life — warm off-white "paper" backgrounds, a single ink stroke at 1.5px, soft rounded corners, and a single warm-yellow accent. Icons are rounded **tiles** (the "app-icon system") on a palette of muted natural fills. Type is Inter for UI, JetBrains Mono for filenames/sizes/timers, and Caveat for handwritten annotations *in design files only* — never in production UI. The mood is calm, personal, and bookish; the opposite of glossy SaaS.

---

## 2. Tokens

Canonical values live in `design/project/kit.jsx` (`SB_LIGHT`, `SB_DARK`, `SB_FILLS`). Mirror these exactly when porting to Tailwind config / CSS variables.

### 2.1 Light

| Token | Value | Use |
|---|---|---|
| `ink` | `#1a1a1a` | Primary text, borders, primary button background |
| `inkSoft` | `#5a5a5a` | Secondary text, captions |
| `inkFaint` | `#a6a6a6` | Chevrons, tertiary text |
| `paper` | `#fbfaf6` | App background |
| `paperAlt` | `#f3f1ea` | Section/grouped background |
| `card` | `#ffffff` | Card / input / button neutral surface |
| `divider` | `#d9d4c7` | Row separators |
| `border` | `#cfc9b8` | Card / input borders |
| `accent` | `#e8c547` | Highlights, primary CTA, SANDBOX logo |
| `accentSoft` | `#fdf6dc` | Accent tint (pill bg, soft highlights) |
| `destructive` | `#c0392b` | Delete, danger states |

### 2.2 Dark

| Token | Value |
|---|---|
| `ink` | `#f4f3ee` |
| `inkSoft` | `#a8a8a8` |
| `inkFaint` | `#666666` |
| `paper` | `#171717` |
| `paperAlt` | `#0e0e0e` |
| `card` | `#1a1a1a` |
| `divider` | `#3a3a3a` |
| `border` | `#3a3a3a` |
| `accent` | `#e8c547` |
| `accentSoft` | `#3a3216` |
| `destructive` | `#c0392b` |

### 2.3 Accent presets (settings → appearance)

Five user-selectable accents. Keys are the accent; values are the soft companion (light mode).

```
yellow  #e8c547 / #fdf6dc   ← SANDBOX default
clay    #e3a98e / #fce6da
sky     #bcd5ec / #e5eff8
lilac   #d6c8e8 / #ece4f4
sage    #d6e2c8 / #eaf2dd
```

Dark-mode `accentSoft` is derived as a low-lightness companion (`#3a3216` for yellow). When a user picks a non-yellow accent, derive an analogous low-lightness tone.

### 2.4 Tile fills (the icon palette)

11 named fills used as the background for app icons. Don't invent new ones; new artifacts pick from this set.

| Name | Light | Dark |
|---|---|---|
| `default` | `#ece8de` | `#2a2a2a` |
| `sage` | `#d6e2c8` | `#3a4a30` |
| `olive` | `#cdd3a8` | `#3f4326` |
| `sand` | `#ecdfb6` | `#4a3e1f` |
| `apricot` | `#f3cf9d` | `#5a3e23` |
| `clay` | `#e3a98e` | `#5a3022` |
| `rose` | `#eab6c0` | `#5a2a36` |
| `lilac` | `#d6c8e8` | `#3a2a52` |
| `sky` | `#bcd5ec` | `#1f3a52` |
| `mist` | `#cfd9d6` | `#2f3a38` |
| `stone` | `#c9c4b7` | `#3a382f` |

### 2.5 Radii, strokes, shadows

- **Stroke:** `1.5px solid ink` is the canonical border for tiles, primary buttons, and frames.
- **Hairline:** `1px solid divider` for row separators and card borders.
- **Radii:** tile `28% of size` (≈16 at 56px) · button `12` · input `10` · card / group `14` · frame (mobile) `28` · frame (desktop) `8` · pill `999`.
- **Shadow:** essentially flat. Frames use a paper-shadow stack `0 2px 0 rgba(26,26,26,0.06), 6px 8px 0 rgba(26,26,26,0.04)`. Cards do not stack additional shadow.

---

## 3. Typography

Three families. Bring them in via `@fontsource/inter`, `@fontsource/jetbrains-mono`, and `@fontsource/caveat` (or a Google Fonts `<link>`).

| Family | Use | Weights |
|---|---|---|
| **Inter** | All UI text | 400 / 500 / 600 / 700 |
| **JetBrains Mono** | Filenames, sizes, timers, version numbers, glyph labels, "JSX" / "HTML" pills | 400 / 500 / 600 |
| **Caveat** | Wireframe annotations — **do NOT use in production UI** | 400 / 600 / 700 |

### Sizes

| Role | Size / tracking |
|---|---|
| Large title (e.g. "SANDBOX") | Inter 32 · weight 700 · letter-spacing −0.6 |
| Title | Inter 22–24 · 600 |
| Body | Inter 13–14 · 400/500 |
| Label / row label | Inter 14 · 500 |
| Caption (uppercase, tracked) | JetBrains Mono 10 · 600 · letter-spacing 1.2 · uppercase, color `inkSoft` |
| Filename / size / value | JetBrains Mono 10–11 · color `inkSoft` |
| Mono glyph in tile | JetBrains Mono · size = `max(10, tile×0.22)` · weight 600 · letter-spacing 0.5 |
| Emoji in tile | system-ui · size = `tile × 0.52` |

---

## 4. The app-icon system

The single most distinctive visual element. An **AppIcon** is a rounded tile + a glyph or emoji or image.

- **Tile:** square with radius = `28% of size`, `1.5px solid ink` border, fill from `SB_FILLS`.
- **Default size:** 56×56 in library and modals; 26–44 in rows and small contexts.
- **Three icon types** (stored as `(iconType, iconValue, iconFill)`):
  1. `emoji` — a single emoji rendered in system-ui at 52% of tile size (e.g. `🍅`).
  2. `glyph` — a 1–3 char JetBrains Mono string (e.g. `PL`, `$`, `MD`, `⚄`).
  3. `image` — a user-uploaded image stored as a Blob in IndexedDB; rendered as `<img>` filling the tile, ink border on top.
- **Stored glyph names** (`'star'`, `'palette'`, …) keep their string keys stable across native and web; only the rendering component changes (`lucide-react-native` → `lucide-react`).

---

## 5. Component vocabulary

All canonical components live in `design/project/kit.jsx`. When porting, the API can change — match the visual output, not the prop names.

| Component | Role |
|---|---|
| `Frame` | Screen viewport (mobile/desktop chrome). Production renders this as the body itself, not a card. |
| `AppIcon` | Rounded tile with glyph/emoji/image. |
| `Btn` | Button: `primary` (ink fill, paper text), default (card fill, ink border), `ghost` (transparent, border-only), `danger` (transparent, destructive border + text), sizes `sm` 28 / `md` 36 / `lg` 44, radius 12. |
| `Input` | 36px high, radius 10, `1.5px border`, optional mono leading icon, `card` background. |
| `Pill` | Small mono 10px badge, radius 999. Tones: `neutral`, `accent`, `danger`, `ink` (filled). |
| `Row` | Settings/details row: tile · label · optional mono value · chevron `›`. Bottom border = `divider`. |
| `Group` | Card container for rows: `card` bg, `1px border`, radius 14, optional uppercase caption above. |
| `TopBar` | Mobile/desktop nav bar: left slot · centered title · right slot. Bottom border `divider`. |
| `StatusBar` | Mobile system bar: `9:41` left, indicators right. |
| `HomeIndicator` | Mobile home-bar pill at the bottom. |
| `Divider` | 1px solid (or dashed) `divider` line; supports vertical. |
| `Caption` | Mono 10, uppercase, letter-spaced, color `inkSoft` — the "section label" voice. |
| `Glyph` | Inline mono character (for nav, list affordances). |

---

## 6. Layout

### Breakpoints
- **Mobile target:** 360×740 viewport (the wireframe size).
- **Desktop target:** 1240×780 viewport.

Anything between scales the desktop layout down to a comfortable single-column variant — no separate tablet design. Mobile and desktop have **distinct layouts** for Library, Run, Compose, and Settings hub; sub-screens reuse the mobile leaf inside the desktop SPA's center column.

### Spacing
The wireframes consistently use multiples of 4 (`4 8 10 12 14 18 22 24`). Treat these as the spacing scale.

### Frame chrome
- Mobile frames: radius 28, `1.5px` border, paper-shadow stack.
- Desktop frames: radius 8, same border + shadow.
- In production, **drop the outer frame** — it's a wireframe artifact. Apply paper-shadow tokens only if the design calls for them inside a screen.

---

## 7. Screens

The wireframes define every screen in light + dark, mobile + desktop where applicable. Each section below names the source file(s) and the must-match elements; **read the JSX for exact pixel values**.

### 7.1 Library (`/`) — `screens-library.jsx`
Two design variants explored: **A · Artifact-emphasis** (big tiles, minimal chrome) and **B · Speed-emphasis** (compact list + command bar). Ship **A** for v1 unless the user picks B. Both variants ship light + dark, mobile + desktop.

Must include: search bar, view toggle (grid/list), per-artifact context menu (right-click / long-press), drag-and-drop on the whole screen, add-mini-app entry point (file / paste / URL).

### 7.2 Empty / First-run — `screens-empty-add.jsx`
First-run state when the library is empty. A friendly prompt with one big "Add your first artifact" CTA and an inline hint about drag-drop.

### 7.3 Add to Library — `screens-empty-add.jsx`
- Desktop: centered modal.
- Mobile: bottom sheet.
- Drag-over state (whole-window dropzone with hatched outline).
- URL import (fetching) state.

The "customize before saving" surface: editable name, icon picker (emoji / glyph / image), detected file size + kind, "Add to Library" CTA.

### 7.4 Run (`/run/:id`) — `screens-run-details.jsx`
- Full-bleed sandboxed iframe.
- Persistent dock: icon + name on the left, controls on the right.
- States: `mounted` (default), `loading` (spinner / boot delay), `error` (overlay), `network-error` (non-blocking offline banner).
- Light + dark, mobile + desktop.

### 7.5 Details (`/details/:id`) — `screens-run-details.jsx`
Per-artifact metadata + actions: icon, name, date added, file size, file kind, dependencies. Actions: Rename · Change icon · Share · Delete.

### 7.6 Compose (`/compose`) — `screens-compose.jsx`
Code editor. Mono font for the editor body. Kind toggle (`jsx` / `html`), name field, icon picker, Save. On save, imports are detected and dependencies fetched.

### 7.7 Settings hub (`/settings`) — `screens-settings.jsx`
Grouped row list: Appearance · Featured · Dependencies · Storage · Logs · About · Credits · Network-allowed toggle · Reset library (destructive). Use the `Group` + `Row` components.

### 7.8 Settings sub-screens — `screens-settings.jsx`
Each is a mobile-sized leaf; desktop reuses the same content in the SPA's center column.
- Appearance — theme (System/Light/Dark) + accent picker.
- Dependencies — cached bundles with size and usage count, delete with destructive confirm.
- Storage — usage breakdown (artifacts vs dependencies) from `navigator.storage.estimate()`.
- Logs — captured console output, levels, search, clear.
- Featured — built-in starter mini-apps with an "add" action.
- About — version, tagline, platform note.
- Credits — open-source attribution.

### 7.9 Interactions — `screens-states.jsx`
- Long-press menu (mobile).
- Right-click menu (desktop).
- Destructive confirm sheet ("Delete dependency? Affects N artifacts.").

---

## 8. Sample data

The wireframes use a fixed sample set (`SAMPLE` in `kit.jsx`) — Pomodoro, Tip Calc, Palette, Dice, Stopwatch, Habits, Sparkline, Color Picker, Markdown, Currency, Notes, Weather. The first six are the **Featured** mini-apps carried over from the native app.

---

## 9. What's *not* in this doc

- **Motion** — the wireframes are static. Use restrained CSS transitions (150–220ms ease-out) for hover/press; sheet/modal enter at 220ms ease-out. No bouncy spring animation; this is a calm aesthetic.
- **Accessibility tokens** — focus rings, keyboard nav, ARIA roles — are required but not specified visually here. Default to a 2px `accent` focus ring with 2px offset, except on light surfaces where ink at 50% reads better.
- **Caveat annotations** — the red handwritten notes in the wireframes are designer-intent annotations, not production UI. Strip them on port.

---

## 10. Porting checklist (for the implementer)

When porting a wireframe screen to production:

1. Read the source JSX top-to-bottom; note every token, size, and spacing constant.
2. Mirror tokens into Tailwind config (theme.extend.colors → `ink`, `paper`, …, accent palette, fill palette).
3. Build (or reuse) the kit components in §5 — `AppIcon`, `Btn`, `Input`, `Pill`, `Row`, `Group`, `TopBar`, `Caption`.
4. Compose the screen against real data via the `ArtifactRepo` / `DependencyRepo` / `PrefsRepo` interfaces ([`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.3) — never read Dexie directly from the screen.
5. Verify light + dark side-by-side. Spot-check at 360×740 and 1240×780.
6. Strip Caveat annotations and `HandNote` placeholders.
