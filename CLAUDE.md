# CLAUDE.md — Working on SANDBOX Web

This file orients Claude Code (and any coding agent) to the SANDBOX Web project. Read this first; everything else is linked.

---

## 1. What this repo is right now

**Pre-build.** No application code exists yet. The repo currently holds:

- [`idea.md`](./plan/idea.md) — the "is this possible? how do we get there?" porting analysis from the native SANDBOX Android app to a web app.
- [`PRD.md`](./plan/PRD.md) — product requirements for v1.
- [`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) — technical architecture (two-origin static site, sandboxed iframe runtime, Dexie/IndexedDB storage, repository abstraction).
- [`DESIGN.md`](./plan/DESIGN.md) — the visual contract: tokens, type, components, screens.
- `design/` — handoff bundle from Claude Design. **Source of truth for visuals.**
  - `design/README.md` — designer's note to coding agents.
  - `design/project/*.jsx` — wireframe prototypes (React + Babel standalone in one HTML page).
  - `design/assets/` — icon/splash artwork.
- `.claude/agents/` — project subagents (see §4).

**Phases 0 + 1 are done** (scaffold + runtime spike). The repo is now Vite + React + TS + Tailwind + Router across two workspaces: `app/` (the SPA on :5173) and `runtime/` (the sandboxed shell on :5174). See `README.md` for dev commands and [`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) §8 / [`idea.md`](./plan/idea.md) §8 for the phased build order through v1.

---

## 2. The project's first commandment

**The design in `design/project/` is the visual contract.** When you build the app, the production output must match those wireframes (light + dark, mobile + desktop) — not the wireframes' internal HTML/CSS structure. The wireframes are prototypes; the implementation is Vite/React/TS/Tailwind.

[`DESIGN.md`](./plan/DESIGN.md) distills the wireframes into tokens, components, and per-screen requirements. When `DESIGN.md` and the wireframes disagree, **the wireframes win** — read them directly.

---

## 3. Doing work — the loop

1. **Read before writing.** For any non-trivial task, start by reading the relevant doc(s) (`PRD.md` for scope, `ARCHITECTURE.md` for the technical shape, `DESIGN.md` + the wireframe JSX for visuals). Delegate this reading to the **`project-file-reader`** subagent when the answer needs to span multiple files — it keeps token usage off the main context.
2. **Follow the phased build order** from [`idea.md`](./plan/idea.md) §8 — runtime spike first, then storage + library, then ingestion, then dep cache, then polish. Don't build screens before the runtime works.
3. **Stay inside the repository abstraction.** The UI and the runtime **never import Dexie directly**. They go through `ArtifactRepo` / `DependencyRepo` / `PrefsRepo` ([`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) §4.3). This is what makes accounts-later additive instead of a rewrite.
4. **Preserve the two-origin security model from day one.** The runtime shell is served from a separate origin, loaded in `<iframe sandbox="allow-scripts">` (no `allow-same-origin`), with explicit `postMessage` `targetOrigin` and `event.origin` validation ([`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) §3). This is **not** something to bolt on later.
5. **Keep stored values stable across native ↔ web.** Glyph name strings (`'star'`, `'palette'`, …), the relational schema shape, the postMessage protocol, and `iconType` / `iconValue` / `iconFill` are all carried over verbatim. Don't rename them.

---

## 4. Subagents (use them to save tokens)

Project subagents live in `.claude/agents/`. Prefer them over inline work when they fit — they run on cheaper models and keep large file reads off the main context.

| Agent | Model | When to use |
|---|---|---|
| [`project-file-reader`](./.claude/agents/project-file-reader.md) | haiku | Reading / synthesizing across the docs (`PRD.md`, `ARCHITECTURE.md`, `idea.md`, `DESIGN.md`) and the design JSX files. Use whenever you need to gather context from more than one file. |
| [`bash-executor`](./.claude/agents/bash-executor.md) | haiku | Running shell commands — scaffolding, installs, dev server, file ops. Don't trigger destructive commands without confirming with the user. |
| [`test-runner`](./.claude/agents/test-runner.md) | haiku | After any logical chunk of code is written or changed — run tests, surface failures, suggest fixes. |
| [`research-analyst`](./.claude/agents/research-analyst.md) | sonnet | Open-ended external research (libraries, security patterns, comparable products). Only when the user explicitly asks to research. |

**Note:** the subagent definitions were written for the original native SANDBOX project and still reference Expo/RN paths. Treat their project-context sections as approximate — the agent's *role* is what matters; the file paths they cite (`SANDBOX/*.jsx`) now map to `design/project/*.jsx`.

---

## 5. Tech stack (locked decisions)

From [`idea.md`](./plan/idea.md) §3 and [`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) §8.

- **Build:** Vite
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS (mirror the tokens in [`DESIGN.md`](./plan/DESIGN.md) §2 into `tailwind.config` and CSS variables)
- **Routing:** React Router v6 — routes per [`PRD.md`](./plan/PRD.md) §3
- **Storage:** Dexie over IndexedDB, behind a repository interface
- **Runtime:** sandboxed `<iframe>` on a **separate origin** loading the static runtime shell
- **Icons:** `lucide-react` (1:1 names with the native `lucide-react-native`)
- **Fonts:** Inter (UI), JetBrains Mono (filenames/sizes/timers), Caveat (annotations in dev only — never production UI)
- **Hosting:** two static deployments (app origin + runtime origin) on a static host
- **No backend in v1.** Accounts/sync/shareable links are deferred — see [`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) §6.

---

## 6. Conventions

- **No backwards-compat shims** to the native app. The web is a new codebase, not `react-native-web`. Don't pull RN-isms into DOM code.
- **Don't render the wireframes in a browser** unless the user asks. Everything is in the source — `design/project/kit.jsx` is the canonical tokens/components file.
- **No comments explaining what code does.** Comments only when the *why* is non-obvious (a hidden constraint, a security invariant, a workaround for a documented browser quirk).
- **No new docs without being asked.** Stay inside the existing `idea.md` / `PRD.md` / `ARCHITECTURE.md` / `DESIGN.md` set.
- **CDN allowlist is security, not convenience.** Keep `cdn.jsdelivr.net`, `unpkg.com`, `cdnjs.cloudflare.com` as the only fetch destinations for dependency resolution ([`ARCHITECTURE.md`](./plan/ARCHITECTURE.md) §5).
- **IDs are `crypto.randomUUID()`** — client-generated, valid server-side when accounts arrive.

---

## 7. Quick map — where things live

```
sendbox website/
├── CLAUDE.md              ← you are here
├── README.md              ← dev commands
├── package.json           ← workspaces: app/, runtime/
├── plan/                  ← planning docs
│   ├── PRD.md                 ← product requirements
│   ├── ARCHITECTURE.md        ← technical design
│   ├── DESIGN.md              ← visual contract
│   └── idea.md                ← porting analysis
├── design/
│   ├── README.md              ← designer's handoff note
│   ├── project/               ← wireframe prototypes (source of truth for visuals)
│   │   ├── kit.jsx                ← tokens + primitives (canonical)
│   │   ├── app.jsx                ← screen catalog
│   │   └── screens-*.jsx          ← per-screen designs
│   └── assets/                ← app icons, splash artwork
├── app/                   ← Vite + React + TS + Tailwind SPA (:5173)
│   └── src/
│       ├── routes.tsx · main.tsx · index.css
│       ├── lib/{theme,sample-artifact}.ts
│       ├── lib/repo/{types,dexie,dexie-repos}.ts
│       ├── shared/protocol.ts
│       ├── components/{ArtifactRunner,ui/AppIcon}.tsx
│       └── screens/{Library,Run,Stub}.tsx
├── runtime/               ← Vite static origin (:5174) — sandboxed shell
│   ├── public/shell.html      ← runtime shell with bridge
│   ├── public/libs/*.js       ← React 18 UMD, ReactDOM, Babel, Tailwind
│   ├── scripts/download-libs.mjs
│   └── vite.config.ts         ← CSP + frame-ancestors enforcement
└── .claude/
    └── agents/            ← bash-executor, project-file-reader, research-analyst, test-runner
```
