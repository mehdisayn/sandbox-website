# SANDBOX Web — TODO

Tracking the build from scaffold to v1.

---

## Done

- [x] **Phase 0 — Scaffold.** Two-workspace setup (`app/` SPA on :5173, `runtime/` static origin on :5174). Vite + React + TypeScript + Tailwind + React Router. Theme tokens wired as CSS variables. Repository interfaces stubbed.
- [x] **Phase 1 — Runtime spike.** Sandboxed iframe loads a separate-origin shell with React + ReactDOM + Babel + Tailwind. `postMessage` bridge with `event.origin` validation. CSP locks `frame-ancestors` to the app origin. A hardcoded JSX artifact mounts and runs end-to-end.
- [x] **Phase 2 — Storage + Library.**
  - [x] **#11** Dexie storage wired; the sample artifact is seeded on first run.
  - [x] **#12** Artifact helpers: `inferKind`, `inferName`, `displayFilename`, `sizeBytes`.
  - [x] **#13** Kit components: `Btn`, `Pill`, `Input`, `Row`, `Group`, `TopBar`, `Caption`, `AppIcon`.
  - [x] **#14** Library — grid + list views, search, right-click + long-press context menu, empty state, sidebar + mobile bottom nav.
- [x] **Phase 3 — Ingestion.**
  - [x] **#15** Four ways to add an artifact — file picker, drag-and-drop anywhere, paste, URL import. All converge on the same `{ content, filename, kind }` shape.
  - [x] **#16** Add modal: chooser view (drop zone + URL + paste) → customize view (name, icon picker with emoji/glyph/image + 11 fill swatches, kind toggle, source preview).
  - [x] **#17** Compose screen: monospace editor, kind toggle (locked when editing), name + icon picker, live "detected imports" pills.
- [x] **Phase 4 — Dependency cache.**
  - [x] **#18** Dependency fetcher with CDN allowlist (jsdelivr / unpkg / cdnjs), candidate URLs, JS sniffing, cache-first lookup, "allow network" toggle. Detected imports are fetched on save and replayed into the iframe at mount.
- [x] **Phase 6 — Polish.**
  - [x] **#19** Details: inline rename, icon edit, share, copy source, delete.
  - [x] **#20** Settings hub + sub-screens — Appearance, Dependencies, Storage, Logs, Featured, About, Credits. Plus an "allow network" toggle and a destructive reset-library action.
  - [x] **#21** Theme + accent: system / light / dark, five accent presets, follows OS dark-mode in system mode, persists across reloads.
  - [x] **#22** Share-out — native share when available, file download fallback, copy-source-to-clipboard.
  - [x] **#23** Run-screen states — boot-slow hint, hard timeout with Retry, error overlay with Reload, dismissable offline banner.
  - [x] **#24** Accessibility — skip link, semantic landmarks, aria-labels on icon-only controls, focus rings standardized.

---

## Remaining

- [ ] **#25 · v1 success-criteria walk-through.** A manual end-to-end pass in a real browser:
  1. Add an artifact by dropping, pasting, picking, or pasting a URL — with a custom name and icon.
  2. Open it; it runs in the sandboxed runtime.
  3. An artifact that imports an npm package works — the dependency is fetched once, cached, and reused.
  4. The artifact code cannot read the Library, settings, or anything else outside its sandbox.
  5. Rename, re-icon, and delete work without errors.
  6. Everything above works from a clean modern browser with no install and no account.

---

## Out of scope for v1

- Accounts, sync, shareable links.
- PWA installability and offline app-shell caching.
- Multi-file artifacts or bundled assets.
- Languages beyond JSX and HTML.
- Telemetry, analytics, monetization.
