# SANDBOX Web

Run AI-generated JSX and HTML artifacts in your browser as a personal library of mini-apps.

---

## Run it locally

### Prerequisites

- **Node 20+** (developed against Node 22) and npm 10+.
- A modern browser. Safari, Chrome, Firefox, and Edge all work.

### First-time setup

From the repo root:

```sh
npm install
```

This installs both workspaces (`app/` + `runtime/`) and, on first install, downloads the four runtime libraries (React, ReactDOM, Babel Standalone, Tailwind) into `runtime/public/libs/`. The download is ~3.5 MB and only runs once — re-runs see them cached.

### Start the dev servers

```sh
npm run dev
```

This boots both servers in one terminal via `concurrently`:

| URL | What it serves |
|---|---|
| `http://localhost:5173` | The app SPA (Library, Run, Compose, Details, Settings). This is what you visit in the browser. |
| `http://localhost:5174/shell.html` | The sandboxed runtime shell. The app loads this *inside an iframe*. You don't visit it directly. |

The two are intentionally on different ports — and therefore different browser origins — so artifact code running inside the runtime iframe is structurally walled off from your library, settings, and any future session data.

If a port is already in use, stop the other process first; both servers refuse to silently move to a different port (it would break the security model).

### Other scripts

```sh
npm run typecheck    # tsc --noEmit across both workspaces
npm run build        # static build for both — outputs to app/dist and runtime/dist
```

---

## Using it

Open **`http://localhost:5173`** in a browser. The Library shows one starter artifact ("Hello, SANDBOX") on first run.

### Add an artifact

Four ways:

1. **Drop** a `.jsx`, `.tsx`, `.js`, `.html`, or `.txt` file anywhere on the page — a dashed overlay confirms the drop target.
2. **Paste** code anywhere on the Library page (Cmd/Ctrl + V). Pastes shorter than 40 characters are ignored to avoid accidents.
3. **Click "＋ Add mini-app"** for a chooser modal with a file picker, a URL field, and a paste textarea side-by-side.
4. **Paste a raw URL** (e.g. a GitHub raw `.jsx` URL) into the URL field. Subject to CORS — if the host doesn't allow cross-origin fetch, save the file locally and use the file picker instead.

In the customize view: edit the name, pick an icon (emoji / glyph / image upload + tile fill), confirm the kind (JSX or HTML), and click **Add to Library**.

If the artifact imports any npm packages, they're auto-fetched from the CDN allowlist (jsdelivr / unpkg / cdnjs) at save time and cached locally. Subsequent runs use the cache.

### Run an artifact

Click a tile in the Library. The artifact mounts inside a sandboxed iframe with React + Babel + Tailwind preloaded. The thin header at the top shows the icon, name, and a Close link back to the Library.

States you may see:

- **booting / mounting** — a hint after 800 ms while the runtime starts up
- **runtime timeout** — after 12 s with no reply, a Retry button appears (usually a browser extension blocked the iframe)
- **artifact error** — your artifact threw; the overlay shows the stack with a Reload button
- **offline banner** — the artifact made a network call that failed; a dismissable pill appears at the bottom

### Manage artifacts

- **Right-click** a tile (or **long-press** on touch): Open · Details · Edit code · Rename · Change icon · Share · Delete.
- The **Details** screen shows metadata, dependencies, and the same actions inline.
- **Compose** (`/compose?id=...`) opens the source in a monospace editor. Detected imports show as pills; saving re-fetches any new ones.

### Settings

Visit `/settings` or open it from the sidebar.

- **Appearance** — system / light / dark, plus five accent presets.
- **Featured mini-apps** — add starter Pomodoro, Stopwatch, Dice, Palette, or Notes to your library.
- **Dependencies** — cached CDN bundles, with their size and how many artifacts use each. Deleting one names the affected artifacts.
- **Storage** — usage by artifacts vs dependencies, browser quota bar, "request persistent storage" button.
- **Logs** — console output captured from the app and from running artifacts; filter by level (LOG / INFO / WARN / ERROR / DEBUG) and search.
- **Allow network** toggle — when off, dependency fetching is blocked. Already-cached deps keep working.
- **Reset library** — destructive; wipes IndexedDB after a confirm.

### Share an artifact

From Details or the context menu:

- **Share** uses `navigator.share()` on platforms that support sharing files (mostly mobile), otherwise downloads a `.jsx` / `.html` file with a slug-name.
- **Copy source** writes the source to the clipboard.

---

## What lives where

```
sendbox website/
├── CLAUDE.md              ← orientation for coding agents
├── TODO.md                ← v1 progress
├── README.md              ← this file
├── plan/                  ← product + technical + visual spec, and the verbatim native source
├── design/                ← wireframe prototypes (source of truth for visuals)
├── app/                   ← Vite + React + TS + Tailwind SPA (port 5173)
├── runtime/               ← static origin serving the sandboxed runtime shell (port 5174)
└── .claude/agents/        ← subagent definitions used by Claude Code
```

For deeper context — the porting analysis, product requirements, technical architecture, visual contract — see the docs in [`plan/`](./plan/).

---

## Stopping the servers

`Ctrl + C` in the terminal running `npm run dev` stops both. The dev servers write nothing to disk you'd need to clean up.

To wipe your local library and start fresh, either:

- Open `/settings`, scroll to the danger zone, and click **Reset library**, or
- Open browser devtools → Application → IndexedDB → delete the `sandbox-web` database.
