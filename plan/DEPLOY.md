# DEPLOY.md — GitHub Pages (app) + Cloudflare Pages (runtime)

## Context

The repo runs locally on two ports (`:5173` app, `:5174` runtime) and the two-origin security model is baked in from day one ([`ARCHITECTURE.md`](./ARCHITECTURE.md) §3). To put the demo online without spending money, we deploy each origin to a different free static host:

| | Host | URL | Why this host |
|---|---|---|---|
| **App** | GitHub Pages | `https://mehdisayn.github.io/sandbox-website/` | Free, lives next to the repo, no extra account needed. |
| **Runtime** | Cloudflare Pages | `https://sandbox-runtime.pages.dev/` (or custom domain later) | Unlimited bandwidth on the free tier (the 3.1 MB Babel bundle is served on every cold load), real HTTP headers (so the CSP stays a response header, not a `<meta>` tag), GitHub auto-deploy. |

Goal: a public URL anyone can open on phone/laptop/Safari/Chrome/Firefox, with the security model identical to local dev. This covers TODO #26–#33.

This plan is **execution-ready** — every change has a concrete file or dashboard step. After approval, I'll implement in the sequencing order at the bottom.

---

## Topology and invariants

```
┌─────────────────────────────────────────────┐
│  https://mehdisayn.github.io/sandbox-website/│  ← App origin
│  (GitHub Pages, project page on /sandbox-…) │
│                                             │
│   iframe src=https://sandbox-runtime.       │
│            pages.dev/shell.html?app=https…  │
│                                             │
└───────────────────────┬─────────────────────┘
                        │ postMessage
                        ▼
┌─────────────────────────────────────────────┐
│  https://sandbox-runtime.pages.dev/          │  ← Runtime origin
│  (Cloudflare Pages, served at root)         │
│                                             │
│  /shell.html, /libs/{react,react-dom,babel, │
│                       tailwind}.js          │
│  + _headers (CSP, Referrer-Policy, etc.)    │
└─────────────────────────────────────────────┘
```

**Five invariants to preserve through the deploy:**

1. **Two real origins.** `github.io` ≠ `pages.dev`. Browser same-origin policy is the structural defense; nothing about the deploy weakens it.
2. **CSP on the runtime as a real HTTP header.** Cloudflare Pages supports `_headers`; we do *not* fall back to `<meta http-equiv>` (which doesn't enforce `frame-ancestors`).
3. **App origin is `https://mehdisayn.github.io`** (scheme + host, no path). The base path `/sandbox-website/` is part of the URL but **not** part of the origin — important for `frame-ancestors` and `event.origin` checks.
4. **No backend.** Both sites are pure static dists. No serverless functions, no env-leaked secrets. The Google OAuth client ID for the future Drive milestone is public by design.
5. **Build-time env vars only.** No runtime config fetching, no `window.__CONFIG__`. Origins are baked into the JS at build time.

---

## Decisions

| Decision | Pick | Why |
|---|---|---|
| App host | GitHub Pages, project page (`/sandbox-website/`) | Repo is `mehdisayn/sandbox-website`, not `mehdisayn.github.io` — project page is the only option without renaming the repo. |
| Runtime host | Cloudflare Pages, free plan | Unlimited bandwidth (Babel is 3.1 MB), real headers, easy GitHub integration via the dashboard (no GHA token needed). |
| Runtime project name | `sandbox-runtime` | Predictable URL: `sandbox-runtime.pages.dev`. |
| App base path | `/sandbox-website/` in prod, `/` in dev | Forced by project-page URL shape. |
| Routing | `createBrowserRouter` with `basename` matching the base path | Existing `app/src/routes.tsx` already uses `createBrowserRouter`; just needs `basename` set conditionally. |
| SPA deep-link fallback | Copy `dist/index.html` → `dist/404.html` post-build | GH Pages serves `404.html` for unknown paths; React Router then takes over. |
| Runtime CSP | Stays in `_headers` (response header) | `frame-ancestors` is **ignored** in a `<meta>` tag — must be a header. |
| App CSP | None for now | The app loads its own bundle; tighter CSP later when the Drive milestone lands. |
| Per-host build | App via GitHub Actions; runtime via CF's built-in GitHub integration | One workflow file (`deploy-app.yml`), one CF dashboard setup. No CF API token in GHA secrets. |
| Demo banner | A small "DEMO · data stays in your browser" pill in the sidebar footer | TODO #31. Single line of UI, gated on `import.meta.env.VITE_DEMO`. |

---

## Per-piece changes

### 1. App — `app/vite.config.ts`

Add a conditional `base`:

```ts
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/sandbox-website/' : '/',
  plugins: [react()],
  // …existing config
}));
```

### 2. App — router basename

`app/src/routes.tsx`:

```ts
export const router = createBrowserRouter([ /* routes */ ], {
  basename: import.meta.env.BASE_URL.replace(/\/$/, ''),
});
```

`import.meta.env.BASE_URL` is the value of `base` from `vite.config.ts`; this keeps dev/prod in sync without a separate flag.

### 3. App — production env file

New file `app/.env.production`:

```
VITE_RUNTIME_ORIGIN=https://sandbox-runtime.pages.dev
VITE_APP_ORIGIN=https://mehdisayn.github.io
VITE_DEMO=1
```

`VITE_APP_ORIGIN` is **scheme + host only** — no path. That's what the runtime validates `event.origin` against (the path isn't part of origin per the URL spec).

### 4. App — SPA fallback

`app/package.json` build script becomes:

```json
"build": "vite build && cp dist/index.html dist/404.html"
```

This ensures deep links like `/sandbox-website/library` or `/sandbox-website/run/<id>` survive a hard refresh.

### 5. App — demo banner (TODO #31)

Single conditional in `Sidebar.tsx` footer:

```tsx
{import.meta.env.VITE_DEMO && (
  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-soft px-3 py-1.5 rounded-full border border-divider">
    DEMO · data stays in your browser
  </div>
)}
```

### 6. Runtime — `runtime/vite.config.ts`

Three changes:

a. Read `APP_ORIGIN` from env (already done) — verify it falls back correctly.

b. Drop the redundant `rollupOptions.input` (the current build produces both `dist/shell.html` from publicDir copy *and* `dist/public/shell.html` from rollup; the duplicate is confusing). Setting `build.outDir = 'dist'` with just `publicDir = 'public'` is enough — Vite copies `public/` to `dist/`.

c. The `server.headers` and `preview.headers` CSP definitions stay (so local dev preserves the contract). The CSP is duplicated into `runtime/public/_headers` for prod (next step).

### 7. Runtime — `runtime/public/_headers` (new)

Cloudflare Pages reads `_headers` at the build output root. Format:

```
/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com; frame-ancestors https://mehdisayn.github.io; base-uri 'none'; form-action 'none'
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

/libs/*
  Cache-Control: public, max-age=31536000, immutable
```

Note: `frame-ancestors` is **hardcoded to the GitHub Pages origin**. If we add a custom domain later, append it here.

### 8. GitHub Actions — `.github/workflows/deploy-app.yml` (new)

```yaml
name: Deploy app to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm --workspace app run typecheck
      - run: npm --workspace app run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist
      - uses: actions/deploy-pages@v4
```

`npm ci` runs the `runtime` postinstall (download-libs), but that's harmless — we don't use the runtime build artifacts in this job.

### 9. Cloudflare Pages — dashboard setup (one-time, manual)

User does this once:

1. Sign in to dash.cloudflare.com → Pages → "Connect to Git" → authorize GitHub → pick `mehdisayn/sandbox-website`.
2. Project name: `sandbox-runtime` (gives `sandbox-runtime.pages.dev`).
3. Production branch: `main`.
4. Build settings:
   - Framework preset: **None**
   - Build command: `npm ci && npm --workspace runtime run build`
   - Build output directory: `runtime/dist`
   - Root directory: leave blank (use repo root)
5. Environment variables (Production):
   - `APP_ORIGIN=https://mehdisayn.github.io`
   - `NODE_VERSION=22`
6. Save & deploy. Every subsequent push to `main` auto-deploys.

### 10. GitHub Pages — dashboard setup (one-time, manual)

1. Repo Settings → Pages → "Source: GitHub Actions".
2. Wait for the first `deploy-app.yml` run to complete; URL appears in the Actions log.

---

## Smoke tests post-deploy

Run all of these once after the first successful deploy.

1. **App loads.** Open `https://mehdisayn.github.io/sandbox-website/` in Chrome desktop. Library greets with the sample artifact.
2. **Runtime loads.** Open `https://sandbox-runtime.pages.dev/shell.html` directly. Page returns 200 and shows an empty body. Check DevTools → Network → Response Headers: `Content-Security-Policy` includes `frame-ancestors https://mehdisayn.github.io`.
3. **Iframe handshake.** From the app, open the sample artifact. The iframe loads, `Hello, SANDBOX` renders, the counter increments. No console errors.
4. **`event.origin` check.** In the app's DevTools console, watch the message log. Messages from the iframe should arrive with `event.origin === "null"` (opaque sandbox); the host's identity check passes because `event.source` matches.
5. **Deep-link refresh.** Open `https://mehdisayn.github.io/sandbox-website/settings/storage` then hit Cmd-R. Page still loads (404.html → React Router → Settings/Storage).
6. **Phone test.** Open the app on iPhone Safari and Android Chrome. Library scrolls; an artifact runs.
7. **CSP enforcement.** From DevTools on the runtime page, paste `<iframe src='https://example.com'>` into an `eval` — should be blocked by `frame-ancestors`. Try `fetch('https://example.com')` — should be blocked by `connect-src`.
8. **Allowlisted CDN.** `fetch('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js')` from the runtime DevTools — should succeed (this is what dep-fetching uses).
9. **Security regression.** From an artifact's iframe DevTools: `indexedDB.open('sandbox-web')` — should fail (opaque origin), `window.parent.location.href` — should throw cross-origin error.
10. **Demo banner shows.** "DEMO · data stays in your browser" pill is visible in the sidebar footer on the deployed app but not in `npm run dev`.

---

## Risks and open questions

| Risk | Mitigation |
|---|---|
| App's React Router basename misconfigured → blank screen on deploy | The `basename: import.meta.env.BASE_URL.replace(/\/$/, '')` pattern is the standard fix and unit-testable. Verify in build preview before deploy. |
| Hardcoded `frame-ancestors` breaks if we later add custom domain | `_headers` is the single source of truth — update it and re-deploy. Document this in the file. |
| `npm ci` slow on Cloudflare Pages (no cache) | First build is slow (~2 min). Subsequent builds reuse the CF build cache. Acceptable for a static site. |
| `pages.dev` URL is ugly | Acceptable for v1 demo. Custom domain (e.g. `runtime.sandbox.example.com`) is a one-line DNS change later. |
| GH Pages serves over HTTP if the user types `http://…` | GH Pages auto-redirects to HTTPS for `*.github.io`. No action. |
| Service worker / PWA cache stale between deploys | Out of scope; no SW shipped. |
| **Open** | Custom domain for the runtime — defer until we know whether we want one. Cost: $0 if we already own a domain. |
| **Open** | Pre-warming CF cache after deploy — Babel is 3.1 MB; first user to hit a new CF edge node pays the latency. Mitigate by adding a `Cache-Control: immutable` (done in `_headers`) so subsequent requests are instant. |

---

## Sequencing

Five PRs, each shippable independently. Each one ends with a green build.

**Step 1 — Runtime build hygiene + headers**
- `runtime/vite.config.ts`: drop redundant `rollupOptions.input`.
- `runtime/public/_headers`: new file with the CSP + cache rules.
- Local check: `npm --workspace runtime run build`; verify `runtime/dist/shell.html` and `runtime/dist/_headers` both exist; no `dist/public/` subdir.

**Step 2 — App base path + router basename + production env**
- `app/vite.config.ts`: conditional `base`.
- `app/src/routes.tsx`: `basename` option on `createBrowserRouter`.
- `app/.env.production`: env vars.
- `app/package.json`: append `&& cp dist/index.html dist/404.html`.
- Local check: `npm --workspace app run build` then `npx serve app/dist -p 8000` and confirm the app loads at `http://localhost:8000/sandbox-website/`.

**Step 3 — Demo banner**
- `app/src/components/Sidebar.tsx`: conditional pill in the footer.
- Local check: `VITE_DEMO=1 npm --workspace app run build` and verify pill renders.

**Step 4 — GitHub Actions for app**
- `.github/workflows/deploy-app.yml`: new file.
- Repo Settings → Pages → Source: GitHub Actions.
- Push to `main`; first deploy. Verify `https://mehdisayn.github.io/sandbox-website/` returns 200.

**Step 5 — Cloudflare Pages for runtime**
- Cloudflare dashboard one-time setup (§9).
- Verify `https://sandbox-runtime.pages.dev/shell.html` returns 200 with the right CSP header.
- End-to-end smoke tests (§11) on the deployed pair.

---

## Critical files to modify or create

**Modify:**
- `app/vite.config.ts` — conditional base
- `app/src/routes.tsx` — basename
- `app/package.json` — build script
- `app/src/components/Sidebar.tsx` — demo banner
- `runtime/vite.config.ts` — drop `rollupOptions.input`

**Create:**
- `app/.env.production`
- `runtime/public/_headers`
- `.github/workflows/deploy-app.yml`

**No backend code, no new dependencies.**
