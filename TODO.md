# SANDBOX Web — TODO

## You are here

**v1 is feature-complete.** The app and runtime both work locally on a fresh clone. You're now deploying the demo.

**Currently:** mid-way through the deploy plan in [`DEPLOY.md`](./DEPLOY.md). Step 1 of 5 is done locally (runtime build hygiene + `_headers` file). **Not committed yet.** Step 2 (app base path + router basename + production env) is next.

---

## What's left

- [ ] **Deploy the demo.** Follow [`DEPLOY.md`](./DEPLOY.md) — 5 small steps, app → GitHub Pages, runtime → Cloudflare Pages, $0/month.
  - [x] Step 1 — runtime build hygiene + `_headers` (uncommitted)
  - [ ] Step 2 — app base path + router basename + production env
  - [ ] Step 3 — demo banner ("data stays in your browser")
  - [ ] Step 4 — GitHub Actions workflow for the app
  - [ ] Step 5 — Cloudflare Pages dashboard setup + smoke tests

- [ ] **One manual smoke test** (sample artifact, an artifact that imports an npm package, sandbox isolation, rename/delete). Do this once the demo is live to confirm everything still works in a real browser at the public URLs.

---

## After the demo is live

- [ ] **v1.1 — cross-device sync via Google Drive.** Plan written at [`~/.claude/plans/now-make-a-backend-distributed-karp.md`](../.claude/plans/now-make-a-backend-distributed-karp.md). Sign-in optional, $0 hosting, strictly personal. Deferred until the demo proves the idea is wanted.

---

## Done (v1)

Phases 0–4 + Phase 6 — scaffold, runtime spike, storage + Library, ingestion (drop/paste/URL/compose), dependency cache, polish (Details, Settings, theme/accent, share, run-screen states, accessibility). All 24 sub-tasks shipped.

---

## Out of scope for v1

- PWA installability and offline app-shell caching.
- Multi-file artifacts or bundled assets.
- Languages beyond JSX and HTML.
- Telemetry, analytics, monetization.
- Public sharing, featured catalog, multi-user features.
