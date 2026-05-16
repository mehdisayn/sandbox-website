# SANDBOX Web

## Built by

Syed Mehedi Hussain — [syedmehedihussain.codes](https://syedmehedihussain.codes) · [github.com/mehdisayn](https://github.com/mehdisayn) · [linkedin.com/in/syedmehedihussain](https://www.linkedin.com/in/syedmehedihussain)

## What it does

A personal library of AI-generated mini-apps that run in your browser. Drop in a `.jsx`, `.tsx`, `.js`, `.html`, or `.txt` file (or paste code, or paste a URL) and SANDBOX runs it inside a sandboxed iframe. JSX is transpiled in-browser with Babel; React, ReactDOM, and Tailwind are preloaded. Any imported npm packages are auto-fetched from a CDN allowlist (jsdelivr / unpkg / cdnjs) and cached locally so the next run works offline. No backend, no accounts, single-user — everything lives in your browser's IndexedDB.

## Tech stack

| Layer | Choice |
|---|---|
| Build | Vite |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router |
| Storage | Dexie over IndexedDB |
| Runtime sandbox | Static iframe shell on a separate origin |
| Icons | lucide-react |
| Fonts | Inter (UI), JetBrains Mono (filenames / sizes / timers) |
| In-iframe transpile | @babel/standalone |
| Hosting | Two static deployments (app origin + runtime origin) |

## Security

The runtime executes arbitrary AI-generated JavaScript via `Babel.transform` + `new Function()`. The mitigations are layered so a compromise of one doesn't compromise the user's library:

1. **Separate origin for the runtime.** The shell is served from a different origin than the app. The browser's same-origin policy structurally prevents artifact code from touching the app's IndexedDB, storage, cookies, or DOM.
2. **`sandbox="allow-scripts"` (no `allow-same-origin`).** The iframe gets an opaque origin, so it can't even reach storage on the runtime origin itself.
3. **Explicit `postMessage` validation.** Outbound messages use a concrete `targetOrigin`; inbound messages are trusted by `event.source` identity (since the sandboxed iframe's `event.origin` is `"null"`).
4. **CSP on the runtime origin.** `default-src 'none'` baseline; `connect-src` restricted to the CDN allowlist; `frame-ancestors` restricted to the app origin only.
5. **Nothing secret on the runtime origin.** It serves only static shell HTML — no tokens, no credentials, no API keys.
6. **`referrerpolicy="no-referrer"`** on the iframe, so artifacts can't leak which artifact is running.
7. **CDN allowlist is enforced.** Dependency fetches only resolve against `cdn.jsdelivr.net`, `unpkg.com`, and `cdnjs.cloudflare.com`. Network access is user-toggleable in Settings.

## Versions

| Package | Version |
|---|---|
| Vite | ^5.4.0 |
| React / ReactDOM (host) | ^19.0.0 |
| React (in-iframe UMD) | 18.3.1 |
| TypeScript | ^5.6.0 |
| Tailwind CSS | ^3.4.16 |
| React Router DOM | ^6.28.0 |
| Dexie | ^4.0.0 |
| lucide-react | ^0.460.0 |
| @fontsource/inter, jetbrains-mono | ^5.1.0 |
| @babel/standalone (in-iframe) | 7 (CDN-pinned) |
| autoprefixer | ^10.4.20 |
| postcss | ^8.4.49 |
| concurrently (dev) | ^9.0.0 |

Node 20+ and npm 10+ required. Developed against Node 22.
