# SANDBOX → Web — The Idea

**Status:** Idea / pre-build · documentation only, no code yet
**Last updated:** May 2026
**Companion docs:** [`PRD.md`](./PRD.md) (product requirements) · [`ARCHITECTURE.md`](./ARCHITECTURE.md) (technical architecture)

This document is the "total knowledge" of taking the existing **SANDBOX** Android app and rebuilding it as a website. It answers: *Is it possible? What changes? What stays? How do we get there?*

---

## 1. What SANDBOX is today

SANDBOX is a personal **Expo / React Native, Android-only** app. It's an "AI artifact runtime":

1. You share a `.jsx` or `.html` file (typically AI-generated, e.g. from Claude) into the app via an Android share intent.
2. You give it a name and an icon (emoji, glyph, or a picked image).
3. It becomes a tappable "mini-app" in a **Library**.
4. Tapping it runs the artifact inside a `react-native-webview` shell that comes preloaded with **React + ReactDOM + Babel + Tailwind**.
5. If the artifact imports an npm package, the app detects the import at save time and fetches a UMD build from a CDN whitelist (jsDelivr / unpkg / cdnjs), caching it locally so it works offline next time.

It is **single-user, local-only** — no accounts, no sync, no telemetry. Everything lives on the device in SQLite (metadata) + the file system (artifact source, cached dependency JS, the runtime shell).

Current screens: Library, Run, Details, Compose, Share (intent receiver), Settings hub, Appearance, Dependencies, Storage, Logs, Featured, About, Credits.

### How the runtime actually works (the key technical fact)

`runtime-shell.ts` builds a **complete HTML document** — React/ReactDOM/Babel/Tailwind inlined as `<script>` tags, plus a small bridge that:
- listens for a `postMessage` saying `{type:'mount', source, kind, deps}`,
- transpiles JSX with `Babel.transform`,
- builds a CommonJS `require` shim that resolves `react`, `react-dom`, and any cached deps,
- mounts the component with `ReactDOM.createRoot().render()`,
- wraps `fetch`/`XHR` to report network failures back to the host.

`react-native-webview` is just a chrome-less browser hosting that HTML. **The runtime is already a web app.**

---

## 2. Is a web version possible? — Yes, and it's a strong fit

The most important insight: **the artifact runtime is already browser code.** Porting it to the web is not a *port*, it's an *un-wrapping* — the WebView becomes a real `<iframe>`, and the `ReactNativeWebView.postMessage` bridge becomes the standard `window.postMessage` bridge between a page and its iframe.

- The hard, valuable logic (`runtime-shell.ts`, `dep-fetcher.ts`, `import-detector.ts`) is platform-agnostic TypeScript that ports **with edits, not rewrites**.
- The expensive-but-mechanical part is rebuilding the UI screens in DOM/CSS instead of React Native components.
- "Requires internet" is satisfied simply by being a hosted website that fetches dependencies from CDNs — it does **not** require a backend (see §3).

Some things even get *easier* on the web (real URLs, no native build pipeline, `fetch` is just `fetch`, the browser is the target platform). One thing gets genuinely *harder* and is net-new work: the **security model** for running arbitrary AI-generated code in a browser tab (see §4.1).

---

## 3. Your decisions

Three decisions were made up front; they shape everything below.

| Decision | Choice | Implication |
|---|---|---|
| **Storage** | Local-only now (IndexedDB), accounts/sync later | No backend for v1. Data layer is built behind a repository abstraction so a server can be added later without a rewrite. |
| **Codebase** | New web-native codebase (Vite + React + TS + Tailwind) | Not reusing the Expo `react-native-web` target. You're bringing your own design; a clean DOM/CSS codebase fits it better than RN-for-web shims. |
| **Share-in** | Drag-drop + paste + file picker + URL import | No PWA Web Share Target needed. The Android share-intent is replaced by ordinary browser ingestion. |

---

## 4. What changes — layer by layer

### 4.1 Artifact runtime — `react-native-webview` → sandboxed `<iframe>`

- **`runtime-shell.ts` is ~95% reused.** Only the bridge transport changes:
  - shell → host: `window.ReactNativeWebView.postMessage(...)` becomes `window.parent.postMessage(...)`
  - host → shell: `webviewRef.postMessage(...)` becomes `iframe.contentWindow.postMessage(...)`
  - The message protocol is unchanged: host sends `{type:'mount', source, kind, deps}`; shell replies `{stage:'ready'|'mounted'|'error'|'network-error'|'dep-error'}`.
  - The Babel transform, the `require` shim, `loadCachedDeps`, `mountJSX`/`mountHTML`, the network-error wrapping, and the error overlay all stay as-is.
- **`components/artifact-runner.tsx`** becomes a thin React component: render an `<iframe>`, listen for messages, post `mount` on `ready`.
- **`lib/runtime-assets.ts` mostly disappears.** Its whole job was writing the shell to disk to dodge the RN→WebView bridge serialization cost. On the web the shell is just a static HTTP asset the browser caches.
- **Security (net-new, important).** Running arbitrary AI-generated JS in a browser tab is dangerous if it runs on your app's origin — it could read your IndexedDB (the whole artifact library), cookies, and DOM. The mitigation: serve the runtime shell from a **separate origin**, load it in an `<iframe sandbox="allow-scripts">` *without* `allow-same-origin`, use explicit `targetOrigin` on `postMessage`, validate `event.origin` on inbound messages, and set a restrictive CSP on the runtime origin. This is detailed in [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.

### 4.2 Storage — `expo-sqlite` + `expo-file-system` → IndexedDB (Dexie)

- The SQLite database *and* the file system collapse into **one IndexedDB database**. Artifact source and dependency JS become **string columns**, not files on disk.
- `lib/storage.ts` becomes Dexie setup; the file-system helpers (`ensureDir`, `dirSize`, `runtimeStorageBytes`) are deleted; storage usage comes from `navigator.storage.estimate()`.
- `lib/artifacts.ts` loses the `file_path` column (source stored inline). The two creation paths — `createArtifactFromUri` and `createArtifactFromSource` — collapse into one, because on the web you always already have the text. `expo-crypto`'s `randomUUID` becomes the built-in `crypto.randomUUID()`.
- **Accounts-later is designed in from day one:** all data access goes through a repository interface (`ArtifactRepo`, `DependencyRepo`, `PrefsRepo`). Today the implementation is Dexie-backed; later an API-backed implementation is added with the UI and runtime untouched. The Dexie schema is kept relationally identical to the future server schema so migration is a data copy, not a reshape.

### 4.3 Dependency fetching — works directly from the browser

- `lib/dep-fetcher.ts`'s core logic — `candidateUrls`, `isJavaScript`, `fetchFirstWorking`, the `CDN_HOSTS` allowlist, the artifact↔dependency link table — is **reused as-is**. Only the persistence calls swap from `expo-file-system` to Dexie.
- `lib/import-detector.ts` (a single regex that finds bare import specifiers) ports with **zero changes**.
- jsDelivr, unpkg, and cdnjs all send permissive CORS headers (`Access-Control-Allow-Origin: *`) on their JS assets, so the browser can `fetch()` them directly. **No proxy is needed for v1.** A serverless proxy becomes worthwhile only later — for shared/server-side dep caching, or to support a CDN that isn't CORS-friendly.

### 4.4 Share-in / share-out — Android intents → browser APIs

- **In:** the Android share intent is replaced by four ordinary browser ingestion paths, all converging on one internal entry point `{ content, filename, kind }`:
  - `<input type="file">` (replaces `expo-document-picker`)
  - drag-and-drop onto a dropzone
  - paste code directly
  - URL import — paste a raw `.jsx`/`.html` URL, the app fetches it
- **Out:** `expo-sharing` becomes a `Blob` + `URL.createObjectURL` download; `navigator.share()` is used as a progressive enhancement where supported; copy-source-to-clipboard is a cheap extra.

### 4.5 Navigation — `expo-router` → React Router v6

Routes: `/` (Library), `/run/:id`, `/details/:id`, `/compose`, `/settings` plus `/settings/*` sub-routes (appearance, dependencies, storage, logs, featured, about, credits), and `/share` as a modal route. URLs become real and bookmarkable for free.

### 4.6 UI layer — rebuilt in DOM / CSS / Tailwind

Every screen is rebuilt from React Native components into semantic HTML + CSS. This is mechanical but broad — it's the bulk of the line count. The theme tokens (`constants/theme.ts`) and the settings context (`lib/settings-context.tsx`) port nearly directly. The icon system keeps its stored string keys (`'star'`, etc.) and only remaps the rendering component (`lucide-react-native` → `lucide-react`).

### 4.7 PWA — optional, recommended later for offline

Not required for share-in (per your decision). But a manifest + service worker that precaches the app shell and runtime bundles, and runtime-caches CDN dependency responses, would give "cached artifacts run offline" — matching the native app's offline behavior. This is a polish-phase nice-to-have, not a v1 requirement.

---

## 5. Native module → web replacement table

| Native dependency | Purpose in SANDBOX | Web replacement |
|---|---|---|
| `react-native-webview` | Artifact runtime container | Sandboxed `<iframe>` on a separate origin |
| `expo-sqlite` | Metadata + dependency relations DB | Dexie (IndexedDB) |
| `expo-file-system` | Artifact / dependency / runtime files | IndexedDB string & Blob columns; runtime libs → static assets |
| `expo-document-picker` | Manual import fallback | `<input type="file">` |
| `expo-image-picker` | Custom icons from camera roll | `<input type="file" accept="image/*">` → Blob in IndexedDB |
| `expo-sharing` | Share artifact out | `navigator.share()` + `Blob` download fallback |
| `expo-haptics` | Tap feedback | `navigator.vibrate()` (Android web) / no-op elsewhere |
| `expo-linking` + `app.json` intent filters | Android share-in | Drag-drop + paste + file input + URL import |
| `expo-crypto` (`randomUUID`) | Artifact / dependency IDs | `crypto.randomUUID()` (built into the browser) |
| `expo-blur` | Blurred sheets / headers | CSS `backdrop-filter: blur()` |
| `expo-image` | Image rendering with caching | `<img loading="lazy">` + object URLs |
| `react-native-reanimated` / `react-native-gesture-handler` | Animations, long-press menu | CSS transitions / Web Animations API / Framer Motion; pointer + `contextmenu` events |
| `@expo/vector-icons` / `lucide-react-native` | Icons | `lucide-react` (1:1 names); keep stored glyph-name strings stable |
| `@expo-google-fonts/inter` | Inter font | `@fontsource/inter` or a Google Fonts `<link>` |
| `expo-router` | File-based navigation | React Router v6 |
| `expo-splash-screen` / `expo-status-bar` / `expo-system-ui` | Launch splash, system UI color | PWA manifest + `<meta name="theme-color">` / a CSS loading screen |
| `expo-constants` | App version / constants | Vite `import.meta.env` + a constants module |

---

## 6. What stays · what's net-new · what gets simpler

### Stays (port with edits, not rewrites)
- `runtime-shell.ts` — ~95% reused; only the `postMessage` transport lines change.
- `import-detector.ts` — pure regex, zero changes.
- `dep-fetcher.ts` core logic — candidate URLs, `isJavaScript` heuristic, CDN allowlist, link table.
- The bridge message protocol.
- The 4-table relational data model.
- Business logic in `artifacts.ts` — `inferKind`, `inferName`, `displayFilename`, rename/icon/touch semantics.
- The runtime `.bundle` files (React/ReactDOM/Babel/Tailwind) — re-obtain from CDN.

### Net-new work
- Separate-origin runtime + the full `<iframe>` security model.
- The entire UI layer, rebuilt in DOM/CSS/Tailwind.
- React Router configuration replacing file-based routing.
- Drag-drop / paste / URL-import ingestion paths.
- The Dexie schema + the repository abstraction layer.

### Gets simpler
- No RN→WebView bridge serialization problem — `runtime-assets.ts`'s reason to exist disappears.
- No file-system layer — artifact source is just a DB column; the two `createArtifact*` functions collapse into one.
- `crypto.randomUUID()` is built in — drop `expo-crypto`.
- External links, SVG, fonts, color inputs are native browser primitives — no shims.
- Dependency fetching is plain `fetch` against CORS-friendly CDNs.
- Real, bookmarkable URLs for every screen, for free.

---

## 7. Recommended web stack

| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fast, modern, minimal config; first-class TS + React. |
| UI | **React 19 + TypeScript** | Matches the existing app's React version; type-safe. |
| Styling | **Tailwind CSS** | The app's design language is already utility-driven. (The artifact runtime ships its *own* Tailwind inside the iframe — kept separate.) |
| Routing | **React Router v6** | Standard web routing; real URLs. |
| Storage | **Dexie** (IndexedDB) | Ergonomic IndexedDB wrapper; handles schema migrations. |
| Runtime | **Sandboxed `<iframe>` on a separate origin** | Security isolation for arbitrary artifact code. |
| Icons | **`lucide-react`** | 1:1 with the existing `lucide-react-native` names. |
| Deployment | **Static site host** (e.g. Cloudflare Pages / Vercel / Netlify) | No backend in v1; the runtime origin is a second deployment / subdomain. |

---

## 8. Phased build order

This mirrors the native app's own build order — prove the runtime first, then build outward.

0. **Scaffold** — Vite + React + TS + Tailwind + React Router; repository-interface stubs; port theme tokens + settings context; set up the two-origin (app + runtime) dev environment early so security isn't bolted on later.
1. **Runtime spike** — port `runtime-shell.ts`'s bridge; serve it from the runtime origin; build the new `ArtifactRunner` (`<iframe sandbox>` + bridge + origin checks). Prove a hardcoded hello-world JSX artifact renders. This is the riskiest integration, so it goes first.
2. **Storage + library** — Dexie schema behind the repo interface; port `artifacts.ts` + `storage.ts`; build the Library and Details screens.
3. **Ingestion** — file input + drag-drop + paste + URL import → the "Add to Library" modal; the Compose screen.
4. **Dependency cache** — port `dep-fetcher.ts` + `import-detector.ts` to Dexie persistence; direct browser CDN fetch; the Dependencies management screen; wire deps into the `mount` message.
5. **PWA (optional)** — manifest + service worker; precache app shell + runtime bundles; offline run of cached artifacts.
6. **Polish** — remaining settings sub-screens, animations, dark mode, empty states, share-out, accessibility.
7. **(Deferred) Accounts** — backend API, auth, database, object storage, shareable links, and the local→cloud migration on first sign-in. If the Phase 0 repository abstraction held, only the repository implementations change.

---

## 9. Open questions to resolve alongside the design

These don't block the documents, but they should be settled before or during the build:

1. **Hosting & origins** — which static host? Should the separate runtime origin be a subdomain (e.g. `runtime.yourdomain.com`) or a fully distinct domain (stronger isolation)?
2. **Featured mini-apps** — do the 6 built-in starter apps (Pomodoro, Tip calculator, Palette, Dice, Stopwatch, Habits) carry over verbatim?
3. **Settings scope for v1** — keep the Logs / Storage / Dependencies screens at 1:1 parity, or trim some for the first web release?
4. **PWA timing** — ship offline support (manifest + service worker) in v1, or defer to the polish phase?
5. **Design** — `DESIGN.md` is intentionally not written here; the design you provide becomes the visual contract, the same role `DESIGN.md` plays in the native repo.
