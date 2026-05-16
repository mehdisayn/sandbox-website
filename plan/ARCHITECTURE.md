# SANDBOX Web — Technical Architecture

**Status:** Draft v1 · pre-build
**Last updated:** May 2026
**Companion docs:** [`idea.md`](./idea.md) (porting analysis) · [`PRD.md`](./PRD.md) (product requirements)

This document is the technical design for SANDBOX Web. It assumes the product context in `PRD.md` and the porting rationale in `idea.md`.

---

## 1. System topology

SANDBOX Web is a **static site with no backend** (for v1). It is deployed across **two origins**:

| Origin | Serves | Why separate |
|---|---|---|
| **App origin** — e.g. `sandbox.example.com` | The React SPA: all screens, the Library, IndexedDB, settings. | This is where the user's data lives. |
| **Runtime origin** — e.g. `runtime.example.com` (or a fully distinct domain) | Only the static runtime shell HTML (React + ReactDOM + Babel + Tailwind inlined). Nothing secret, no storage. | Isolates arbitrary artifact code from the user's data via the browser's same-origin policy. See §3. |

Both are static deployments (e.g. Cloudflare Pages / Vercel / Netlify). There is no server-side code in v1. "Requires internet" means: loading the two origins, and fetching not-yet-cached dependencies from public CDNs.

```
                 ┌─────────────────────────────┐
   user ───────▶ │  App origin (the SPA)        │
                 │  • Library / Settings / etc. │
                 │  • IndexedDB (Dexie)         │
                 │  • repository layer          │
                 │  • dependency fetcher        │
                 └──────────────┬──────────────┘
                                │ <iframe sandbox>
                                │ postMessage bridge
                                ▼
                 ┌─────────────────────────────┐
                 │  Runtime origin (the shell)  │
                 │  • React/ReactDOM/Babel/TW   │
                 │  • runs the artifact code    │
                 │  • NO access to app data     │
                 └─────────────────────────────┘
                                │
                                ▼  fetch() at save time
                 ┌─────────────────────────────┐
                 │  CDN whitelist               │
                 │  jsdelivr / unpkg / cdnjs    │
                 └─────────────────────────────┘
```

---

## 2. Artifact runtime

### 2.1 The shell

`lib/runtime-shell.ts` from the native app builds a complete HTML document with React, ReactDOM, Babel Standalone, and Tailwind inlined as `<script>` tags, plus a bridge script. **This file is ~95% reused.** It is served as a static asset from the runtime origin (the browser HTTP-caches it; there is no per-run serialization, which is what `runtime-assets.ts` existed to avoid in the native app — that file is no longer needed).

### 2.2 The host component

`components/artifact-runner.tsx` becomes a thin React component on the app origin:

1. Render `<iframe>` pointing at the runtime origin's shell URL, with the `sandbox` attribute (see §3).
2. Listen on `window.addEventListener('message', ...)`.
3. When the shell posts `{stage:'ready'}`, post `{type:'mount', source, kind, deps}` to `iframe.contentWindow`.
4. Handle `{stage:'mounted'|'error'|'network-error'|'dep-error'}` to drive loading / error / offline-banner UI.

### 2.3 The postMessage bridge

The message **protocol is unchanged** from the native app. Only the transport changes:

| Direction | Native (WebView) | Web (iframe) |
|---|---|---|
| host → shell | `webviewRef.postMessage(json)` | `iframe.contentWindow.postMessage(json, RUNTIME_ORIGIN)` |
| shell → host | `window.ReactNativeWebView.postMessage(json)` | `window.parent.postMessage(json, APP_ORIGIN)` |

Messages:
- **host → shell:** `{ type: 'mount', source, kind: 'jsx'|'html', deps: [{name, source}] }`
- **shell → host:** `{ stage: 'ready' | 'mounted' | 'error' | 'network-error' | 'dep-error', detail? }`

Inside the shell, the existing logic is unchanged: `Babel.transform` transpiles JSX, a CommonJS `require` shim resolves `react` / `react-dom` / cached deps, `ReactDOM.createRoot().render()` mounts the component, and `fetch`/`XHR` are wrapped to report network failures. `mountHTML` still does `document.write` — fine inside the sandboxed iframe (it's the artifact's own sandbox to replace).

Both sides **must** pass an explicit `targetOrigin` (never `'*'`) and **must** validate `event.origin` (and `event.source`) on every inbound message.

---

## 3. Security model

This is the one genuinely net-new concern versus the native app. The runtime executes **arbitrary AI-generated JavaScript** via `Babel.transform` + `new Function()`. If that code ran on the app origin, it could read the user's entire IndexedDB library, cookies, `localStorage`, and DOM — and, once accounts exist, their session.

The mitigation is layered:

1. **Separate origin for the runtime.** The shell is served from a different origin than the app. The browser's same-origin policy then *structurally* prevents artifact code from touching the app's IndexedDB, storage, cookies, or DOM. This is the single most important decision and the reason for the two-origin topology in §1.

2. **`sandbox` attribute, without `allow-same-origin`.** The iframe uses `sandbox="allow-scripts"`. Omitting `allow-same-origin` gives the framed document an opaque origin, so it cannot even reach storage on the runtime origin itself. Add capabilities (`allow-forms`, `allow-popups`, `allow-modals`, …) only if artifacts demonstrably need them. Never `allow-top-navigation`.

3. **Explicit `postMessage` origins.** Both directions use a concrete `targetOrigin`; both sides validate `event.origin` and `event.source` on receipt.

4. **CSP on the runtime origin.** A `Content-Security-Policy` that permits the `'unsafe-inline'` / `'unsafe-eval'` Babel requires, but constrains `connect-src` to the CDN whitelist (plus whatever artifacts legitimately need), restricts `frame-ancestors` to the app origin only, and uses a `default-src 'none'` baseline.

5. **Nothing secret on the runtime origin.** It serves only static shell HTML. No tokens, no credentials, no API keys ever live there — so even a full compromise of the runtime origin yields nothing.

6. **`referrerpolicy="no-referrer"`** on the iframe, so artifacts can't leak which artifact/user is running.

This posture is strictly better than the native app's, where the WebView was configured with broad file access. The cost is that the two-origin setup must be in place from the start — it's not something to bolt on later, *especially* before accounts ship.

---

## 4. Storage layer

### 4.1 Dexie (IndexedDB)

The native app's SQLite database **and** its file system collapse into a single IndexedDB database via Dexie. Artifact source and dependency JS are stored as **inline string columns**, not files.

```
db (IndexedDB via Dexie)
├── artifacts      id, name, iconType, iconValue, iconFill, fileKind,
│                  source (string), sizeBytes, createdAt, lastOpened
├── dependencies   id, name, version, source (string), sizeBytes, downloadedAt
│                  (index on `name`)
├── artifactDeps   [artifactId+dependencyId]  (composite key)
├── prefs          key, value
└── icons          id, blob
```

This shape is intentionally identical, relationally, to the native SQLite schema — and to the future server schema (§6) — so migrations are data copies, not reshapes. IDs are `crypto.randomUUID()` (client-generated, valid server-side later).

### 4.2 Module mapping from the native app

| Native module | Web equivalent |
|---|---|
| `lib/storage.ts` (SQLite init + FS dirs + `ensureDir` / `dirSize` / `runtimeStorageBytes`) | Dexie schema declaration. File-system helpers deleted. Usage via `navigator.storage.estimate()`. |
| `lib/artifacts.ts` | CRUD against Dexie. `file_path` removed; `source` inline. `createArtifactFromUri` + `createArtifactFromSource` collapse into one. `readArtifactSource` becomes a row read. `prepareShareFile` becomes a `Blob` + object-URL download. `expo-crypto` → `crypto.randomUUID()`. |
| `lib/dep-fetcher.ts` | CDN logic unchanged; persistence calls swap `expo-file-system` → Dexie rows. |
| `lib/prefs.ts` | Unchanged in spirit — reads/writes the `prefs` store. |

### 4.3 The repository abstraction

All data access goes through a small set of interfaces — **the UI and the runtime never import Dexie directly**:

```
ArtifactRepo     list / get / create / updateSource / rename / updateIcon / touch / delete
DependencyRepo   ensure / linkToArtifact / loadForArtifact / list / delete
PrefsRepo        get / set
```

v1 ships Dexie-backed implementations (`DexieArtifactRepo`, …). This indirection is what makes accounts/sync (§6) an additive change rather than a rewrite. Where practical, store `navigator.storage.persist()` should be requested so the browser is less likely to evict the library.

---

## 5. Dependency fetching

When an artifact is saved, `lib/import-detector.ts` (a single regex — ported with **zero changes**) extracts bare import specifiers. For each one not already cached, `lib/dep-fetcher.ts` tries a series of candidate CDN URLs and keeps the first response that looks like JavaScript.

- **CDN whitelist:** `cdn.jsdelivr.net`, `unpkg.com`, `cdnjs.cloudflare.com` — kept as a security allowlist (`CDN_HOSTS`).
- **CORS:** all three send `Access-Control-Allow-Origin: *` on their JS assets, so the browser can `fetch()` them directly. **No proxy is needed in v1.** `fetchFirstWorking` and `isJavaScript` port as-is.
- **When a proxy becomes worthwhile (deferred):** shared/server-side dep caching so users don't each re-fetch; supporting a CDN that isn't CORS-friendly; enforcing the whitelist server-side. A thin serverless function would handle this — it would run the *same* `dep-fetcher` logic, just in Node.
- Fetched bundles are written to the `dependencies` store and linked to the artifact via `artifactDeps`. At run time, `loadForArtifact` reads them and they ride along in the `mount` message's `deps` array.
- The `network-allowed` pref still gates all fetching, exactly as in the native app.

---

## 6. Accounts-later migration path

Accounts + cross-device sync are deferred (`PRD.md` §6), but the architecture is built so they're an **additive change**:

1. **Repository abstraction (§4.3)** — adding accounts means writing `ApiArtifactRepo` / `ApiDependencyRepo` / `ApiPrefsRepo` against a backend API. The UI and the runtime are untouched.
2. **Identical relational shape** — the Dexie schema *is* the future Postgres schema, plus `users`, an `owner_id` FK on `artifacts`, and a `shares` table for shareable links. Migration is a data copy.
3. **Client-generated UUIDs** — IDs created locally are valid server-side; no ID remapping on migration.
4. **The dependency fetcher is a pure function** — in v1 it runs in the browser; with a backend the same code runs server-side as a shared, cached dep service. It is written once, not forked.
5. **Migration on first sign-in** — read the full local Dexie DB, `POST` artifacts + deps + prefs to the API, then switch the active repository implementation (or run hybrid: API as source of truth, Dexie as offline cache).

When accounts arrive, the **separate-origin runtime (§3) becomes even more important** — the artifact must never be same-origin with the session cookie. That's why it's a v1 requirement, not a later add-on.

---

## 7. Native module → web replacement table

| Native dependency | Web replacement |
|---|---|
| `react-native-webview` | Sandboxed `<iframe>` on a separate origin |
| `expo-sqlite` | Dexie (IndexedDB) |
| `expo-file-system` | IndexedDB string & Blob columns; runtime libs → static assets |
| `expo-document-picker` | `<input type="file">` |
| `expo-image-picker` | `<input type="file" accept="image/*">` → Blob in IndexedDB |
| `expo-sharing` | `navigator.share()` + `Blob` download fallback |
| `expo-haptics` | `navigator.vibrate()` (Android web) / no-op |
| `expo-linking` + intent filters | Drag-drop + paste + file input + URL import |
| `expo-crypto` | `crypto.randomUUID()` (built in) |
| `expo-blur` | CSS `backdrop-filter: blur()` |
| `expo-image` | `<img loading="lazy">` + object URLs |
| `react-native-reanimated` / `react-native-gesture-handler` | CSS transitions / Web Animations API / Framer Motion; pointer + `contextmenu` events |
| `@expo/vector-icons` / `lucide-react-native` | `lucide-react` (keep stored glyph-name strings stable) |
| `@expo-google-fonts/inter` | `@fontsource/inter` or Google Fonts `<link>` |
| `expo-router` | React Router v6 |
| `expo-splash-screen` / `expo-status-bar` / `expo-system-ui` | PWA manifest + `<meta name="theme-color">` |
| `expo-constants` | Vite `import.meta.env` / constants module |

---

## 8. Recommended stack (summary)

Vite · React 19 · TypeScript · Tailwind CSS · React Router v6 · Dexie (IndexedDB) · `lucide-react` · sandboxed `<iframe>` on a separate origin · static-site hosting (two deployments: app origin + runtime origin). No backend in v1.
