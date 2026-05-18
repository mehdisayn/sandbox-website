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

## Demo deployment — GitHub Pages

The blocker is structural: ARCHITECTURE.md §3 requires the runtime and the app to live on **different origins**, but every `*.github.io` page shares the same `<user>.github.io` origin. Decide the topology first; everything else flows from it.

- [ ] **#26 · Decide origin topology.** Pick one before any pipeline work:
  - **A · Two custom subdomains (recommended).** `sandbox.<yourdomain>` for the app, `sandbox-runtime.<yourdomain>` for the runtime. Two `CNAME` files, two Pages sites, full two-origin isolation. Costs a domain.
  - **B · One github.io, two paths.** `<user>.github.io/sandbox-app/` + `<user>.github.io/sandbox-runtime/`. Same URL origin, so only the `sandbox` attribute provides isolation (still real — opaque origin from the sandbox — but no defense-in-depth). Acceptable for a demo with a banner; not for anything with stored credentials later.
  - **C · App on Pages, runtime on a different free host** (Cloudflare Pages / Netlify / Vercel free tier). True two-origin without buying a domain.

- [ ] **#27 · Build-time origin wiring.** Bake the right origins into the static build:
  - `app/`: `vite build` with `VITE_RUNTIME_ORIGIN` set to the chosen runtime URL.
  - `runtime/`: `vite build` with `APP_ORIGIN` env so the CSP `frame-ancestors` matches.
  - Set Vite `base` per workspace (`/sandbox-app/`, `/sandbox-runtime/`, or `/` for subdomains).

- [ ] **#28 · Runtime CSP without server headers.** GitHub Pages can't set response headers, so the runtime's CSP (currently in `runtime/vite.config.ts`) won't apply on Pages. Move the CSP into `<meta http-equiv="Content-Security-Policy">` inside `shell.html` for the deployed build (dev keeps the header path).

- [ ] **#29 · GitHub Actions workflow.** `.github/workflows/deploy.yml` that on push to `main`:
  1. Installs deps, runs `npm run typecheck`, then `npm run build` (with the env vars from #27).
  2. Publishes `app/dist` and `runtime/dist` via `actions/upload-pages-artifact` + `actions/deploy-pages` (one workflow per repo if going split-repo, or two jobs if same).
  3. Caches `node_modules` and `runtime/public/libs` so the 3.1 MB Babel download doesn't re-run per build.

- [ ] **#30 · SPA-fallback `404.html`.** Pages serves `404.html` for unknown paths. Copy `app/dist/index.html` → `app/dist/404.html` after build so React Router's history-mode routes (`/library`, `/run/:id`, etc.) survive deep-links and refreshes.

- [ ] **#31 · Demo guardrails.** Things only relevant on the public demo:
  - "DEMO · data stays in your browser" pill in the sidebar footer.
  - Disable destructive Reset library confirmation copy if needed (clarify it only wipes local IndexedDB).
  - Verify the CDN allowlist still functions when fronted by Pages' CSP.

- [ ] **#32 · Post-deploy smoke test.** Re-run #25 against the live demo URLs in Chrome, Safari, Firefox — desktop + mobile. Watch for: iframe boot (the `event.origin === "null"` path), drag-drop ingestion on touch, dependency fetch hitting the CDNs, dark mode parity.

- [ ] **#33 · Wire the live URL.** Once deployed, add the demo URL to `README.md` (top) and to the Welcome screen's "About SANDBOX" link target.

---

## Out of scope for v1

- Accounts, sync, shareable links.
- PWA installability and offline app-shell caching.
- Multi-file artifacts or bundled assets.
- Languages beyond JSX and HTML.
- Telemetry, analytics, monetization.
