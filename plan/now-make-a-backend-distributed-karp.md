# Backend Plan — Drive-backed cross-device sync (v1.1)

## Context

SANDBOX Web today is local-only — every artifact lives in the browser's IndexedDB via Dexie, scoped to one device + one browser profile. If the user clears site data or switches machines, their library is gone. We need cross-device persistence so the app is usable as a daily tool, not just a single-device toy.

The user has three hard constraints on this milestone:

1. **No hosting cost.** Zero. No backend server, no managed database, no object storage.
2. **Sign-in is optional.** The current local-only experience must keep working untouched. The app must never demand an account to do its job.
3. **Strictly personal.** No public sharing, no featured catalog, no discovery, no multi-user features. v1.1 is a sync milestone, not a social one.

These constraints rule out a traditional backend (would cost money, would shift to "account required" by default if we're not careful). They also rule out a hybrid (backend for metadata + Drive for blobs) because the backend itself still costs something. The answer is **Google Drive's `drive.appdata` scope as the entire backend** — Google handles identity, storage, durability, billing. We ship zero new infrastructure. The app stays a pure two-origin static deployment.

This plan is **deferred until after v1 ships**. Pre-requisites:
- TODO #25 (manual v1 walk-through smoke test)
- TODO #26–#33 (GitHub Pages demo deployment)

It is also gated on real user demand — the user noted "hopefully we can manage funding if the idea is good." If we get to a point where sharing/featured matters, we revisit and add a real backend then; the Drive plan does not paint us into a corner because the repository abstraction (see §5) lets us slot in `ApiArtifactRepo` later without touching the UI.

---

## Architecture at a glance

```
       ┌─────────────────────────────────┐
       │  App origin (the SPA)            │   sign-in lives here only
       │  ┌───────────────────────────┐  │
       │  │ active repo singletons    │  │   ← the seam
       │  └─────────┬─────────────────┘  │
       │            │ when signed-in     │
       │   ┌────────▼─────────┐          │
       │   │ DriveArtifactRepo│          │
       │   │  • Dexie cache   │          │
       │   │  • sync queue    │          │
       │   └────┬─────────┬───┘          │
       └────────│─────────│──────────────┘
                │         │
            Dexie     fetch + OAuth token (in-memory only)
                          │
                          ▼
              accounts.google.com (GIS) ─── token
              www.googleapis.com/drive/v3 ── appDataFolder I/O
                          │
                          ▼
       ┌─────────────────────────────────┐
       │  User's Google Drive (appdata)   │   hidden, app-only
       │   manifest.json                  │
       │   prefs.json                     │
       │   tombstones.json                │
       │   artifacts/<uuid>.json × N      │
       └─────────────────────────────────┘

       ┌─────────────────────────────────┐
       │  Runtime origin (sandbox shell)  │   unchanged.
       │  • No knowledge of auth          │   never sees tokens,
       │  • No knowledge of Drive         │   never gains capability
       └─────────────────────────────────┘
```

**Five invariants:**

1. **Two-origin security is not weakened.** Auth and Drive calls happen on the app origin only. The runtime origin learns nothing new. No `allow-*` flags are added to the iframe sandbox. Artifact JS remains in an opaque-origin sandbox that cannot reach the token or the Drive client. ([`plan/ARCHITECTURE.md`](../../rasp/projects/sandbox-website/sandbox-website/plan/ARCHITECTURE.md) §3 is the contract.)
2. **The repository abstraction is the only insertion point.** `ArtifactRepo`, `PrefsRepo`, `DependencyRepo` interfaces (`app/src/lib/repo/types.ts`) stay frozen. Screens and runtime components are not modified.
3. **Dexie is always the on-device store.** Signed-out: Dexie is the source of truth. Signed-in: Dexie is the read-through/write-through cache; Drive is the source of truth.
4. **Tokens are in-memory only.** Never `localStorage`, `sessionStorage`, or IndexedDB. Tab close == soft sign-out for that tab; silent re-auth on next open.
5. **Dependencies stay local.** `DependencyRepo` does not sync. Deps are a CDN cache, not user data.

---

## Decisions and rationale

| Decision | Pick | Why |
|---|---|---|
| OAuth scope | `drive.appdata` | Hidden folder, narrow scope, less alarming consent screen. Trade-off: user can't browse files directly. Mitigation: ship a Settings → "Export library" JSON-download button as the escape hatch. |
| OAuth flow | GIS **token client** (implicit) | The "code client" requires a backend to exchange the code for a refresh token. Violates the $0 constraint. Implicit flow → 1-hour token, silent re-auth via `prompt: ''`. |
| File layout in Drive | One JSON per artifact + `manifest.json` + `prefs.json` + `tombstones.json` | Per-artifact files mean an edit on device A only conflicts with the same artifact's edit on device B. Manifest gives one-read library listing without N round-trips. Tombstones make cross-device delete reliable. |
| Authority | Drive is source of truth; Dexie is cache | Reads serve from Dexie instantly, reconcile in background. Writes are optimistic (Dexie first, then queued to Drive). Snappy UI, robust offline. |
| Conflict resolution | Per-artifact last-write-wins by `modifiedTime`, losing version preserved as a `.conflict-<ts>.json` backup | Per-field merge / 3-way merge of source code is risky for JSX. LWW + backup is predictable and lossless. |
| `lastOpened` sync | **Device-local only**, not synced | Bumping `rev` on every artifact open doubles write traffic for a UI-nicety. Library sort can be per-device. |
| Account model | Optional, local-only is the default | User's explicit answer. Preserves the current "no install, no account" positioning. |
| Sharing | None in v1.1 | User's explicit answer. Strictly personal. |
| Migration on first sign-in | Inspect-then-prompt (see §6) | Silent-upload risks polluting an existing remote library. Plain prompt is annoying when there's nothing to merge. Inspect first, prompt only when ambiguous. |

---

## File layout in the user's Drive

```
appDataFolder/                  # hidden, app-only, invisible in Drive UI
├── manifest.json               # library index (see shape below)
├── prefs.json                  # theme, accent, allowNetwork toggle
├── tombstones.json             # { id, deletedAt }[]
└── artifacts/
    ├── <uuid>.json             # one Artifact row, base64 image-icon inline
    └── …
```

`manifest.json` shape:
```jsonc
{
  "schemaVersion": 1,
  "appVersion": "1.1.0",
  "deviceLastWriter": "<random per-install id>",
  "updatedAt": 1748140000000,
  "artifacts": [
    {
      "id": "uuid", "driveFileId": "...",
      "name": "...", "iconType": "...", "iconValue": "...", "iconFill": null,
      "fileKind": "jsx",
      "sizeBytes": 1234,
      "createdAt": 1740000000000,
      "rev": 7,                    // per-artifact monotonic counter
      "contentHash": "sha-256-hex" // SHA-256 of source; fast conflict detect
    }
  ]
}
```

`rev` increments on every artifact mutation. `contentHash` lets two-device "wrote the same thing" be detected without diffing source. Manifest writes use `If-Match: <etag>` for optimistic concurrency; on 412, refetch + re-diff + retry.

---

## Auth flow

### Library and storage

- **Google Identity Services (GIS)** loaded as a single `<script>` from `app/index.html`.
- **Token client** (`google.accounts.oauth2.initTokenClient`) — never the code client (would need a backend).
- **`VITE_GOOGLE_CLIENT_ID`** baked at build time. OAuth client IDs are public by design; protection is the **Authorized JavaScript Origins** allowlist in GCP, which gates which sites can mint tokens with this client ID. Add `http://localhost:5173` for dev.

### What's stored where

| Item | Location | Lifetime |
|---|---|---|
| Access token + expiry | In-memory (`auth/google.ts` closure) | Until tab close or ~1h expiry |
| User profile (sub, email, name) | `prefs.google_user` | Until sign-out |
| `cloud_enabled` flag | `prefs.cloud_enabled` | Until sign-out |
| Refresh token | nowhere — we don't have one | n/a |

In-memory tokens are non-negotiable. Persisting OAuth bearer tokens to any browser-readable store is a known footgun — XSS on the app origin would otherwise grant total account compromise.

### Sign-in sequence

1. Settings → Sync → "Sign in with Google."
2. `requestAccessToken({ prompt: 'consent' })` on the first ever sign-in; `{ prompt: '' }` thereafter.
3. Verify the returned `scope` contains `drive.appdata`. If the user un-ticked it, abort with a clear message.
4. Fetch `oauth2.userinfo` once for display name/email; cache profile (not token) in `prefs`.
5. Account-switch check (§7): if `sub` differs from the cached previous user, warn and offer to wipe local data before continuing.
6. Run the first-sign-in migration (§6).
7. Swap `active.ts`'s repo references to Drive-backed implementations.
8. Sidebar pill shows "Syncing → Synced."

### Token refresh

Wrap every Drive call in `withFreshToken(fn)`:
- If <60s of life remain, request a new token first.
- On 401, request new token and retry once.
- On silent-refresh failure → set `tokenStale` flag. Reads still serve from Dexie. Writes still queue. UI shows "Signed out — click to reconnect." No data loss.

---

## Sync engine

Module: `app/src/lib/sync/engine.ts`. Exposes `{ state, queueDepth, lastError }` for the sidebar status pill.

### Write queue (persistent)

Add a Dexie table `syncQueue { id, op, payloadKey, attemptCount, lastError, enqueuedAt }`. Persistent so closing the tab mid-write doesn't lose changes.

**Coalescing per `payloadKey`**: three renames of the same artifact → one Drive write. Compose-screen source edits are debounced 500 ms before enqueueing, same UX as draft-saves.

### Conflict resolution (per artifact)

On each `artifact.put`:
1. Compute `localRev = base.rev + 1`, `localHash = sha256(source)`.
2. Fetch the remote artifact's `appProperties` only (cheap metadata read) for `remoteRev`, `remoteContentHash`.
3. If `remoteRev === base.rev` → write, no conflict.
4. If `remoteRev > base.rev && remoteContentHash === localHash` → another device wrote the same thing; adopt remote rev, skip write.
5. If `remoteRev > base.rev && hashes differ` → **conflict**:
   - Save losing version to `artifacts/<id>.conflict-<ts>.json`.
   - Apply the winner (by `modifiedTime`).
   - Toast: "Conflicting edit from <device> — saved your previous version as a backup."

### Read reconciliation

Triggers: app boot (after sign-in), `window.online` event, periodic manifest HEAD (60s).

1. Fetch manifest. If unchanged `updatedAt`, done.
2. Diff manifest's artifact list against Dexie by `(id, rev)`:
   - Remote-only → pull, insert into Dexie.
   - Local-only, not tombstoned → push (enqueue).
   - In tombstones (remote) → delete locally.
   - Both, remote rev higher → pull + overwrite.
   - Both, local rev higher → push.
3. Apply `prefs.json` delta (single file, LWW).
4. Individual artifact source is only pulled lazily — when the user opens an artifact whose local source is stale per the manifest.

### Rate limits

Drive's per-user-per-100-seconds soft cap is the practical ceiling. Mitigations: write coalescing, 500 ms source-edit debounce, ≤5 concurrent pulls on reconcile, exponential backoff (2s → 60s, jittered) on 429/403. For a single user in normal use, the cap should be impossible to hit.

---

## First sign-in migration

Decision tree (`app/src/lib/migration/first-signin.ts`):

| Local state | Remote state | Action |
|---|---|---|
| Empty (or just the seed sample) | No manifest | First-ever sign-in. Skip sample; write empty manifest. |
| Empty (or just sample) | Manifest exists | Pull everything from Drive. Replace sample with synced library. |
| Has user artifacts | No manifest | Silently upload all → write manifest. No prompt needed. |
| Has user artifacts not in remote | Manifest exists | **Prompt**: "Found N local artifacts not in your synced library. Add them / Keep local-only / Discard." |
| Same UUID exists locally and remotely with different content | (effectively impossible — cosmologically tiny `crypto.randomUUID()` collision rate) | Treat as a sync conflict per §5.2. |

The seeded `SAMPLE_ARTIFACT` constant (in `app/src/lib/sample-artifact.ts`) is detected by id and excluded from upload — otherwise it'd clutter every fresh device.

---

## Sign-out and account switching

### Sign-out

Modal: "Sign out? Your synced artifacts will stay in your Google Drive. Choose what stays on this device:"
- **Keep local copy** (default) — Dexie remains intact. Re-sign-in reconciles cleanly via UUIDs+revs.
- **Wipe local copy** — clear Dexie, return to first-run state with the sample.

Then: revoke token via `google.accounts.oauth2.revoke`, clear `cloud_enabled` and `google_user` prefs, drop in-memory token, swap `active.ts` back to Dexie repos.

### Account switching (critical)

On every sign-in success, compare the returned `sub` against `prefs.google_user.sub`:
- **Match or first ever** → normal flow.
- **Mismatch** → warning modal: "Signing in as a different account. Local artifacts may belong to the previous user. Wipe local data?" **Default to yes, wipe.**

Without this check, a shared-browser scenario would silently merge Alice's local data into Bob's Drive on Bob's first sign-in. This is the single most important non-obvious correctness rule in the whole plan.

---

## New file structure

```
app/src/lib/
├── auth/
│   ├── google.ts            # GIS loader, token client, withFreshToken, revoke
│   └── account.ts           # current-user state, sub mismatch detection
├── cloud/
│   ├── drive-client.ts      # typed wrapper for Drive v3 REST in appDataFolder
│   └── manifest.ts          # manifest read/write/diff, tombstone helpers
├── repo/
│   ├── drive-repos.ts       # DriveArtifactRepo, DrivePrefsRepo
│   ├── active.ts            # NEW. Re-exports artifactRepo/dependencyRepo/prefsRepo;
│   │                        #      internal `current` reference swaps on sign-in/out.
│   ├── dexie-repos.ts       # unchanged classes; just no longer the only path
│   ├── dexie.ts             # adds syncQueue table in v(2) Dexie migration
│   └── types.ts             # frozen
├── sync/
│   ├── engine.ts            # queue runner, conflict resolver, online/offline listener
│   ├── queue.ts             # Dexie-backed FIFO with per-key coalescing
│   └── reconcile.ts         # boot + online-event pull-and-merge
└── migration/
    └── first-signin.ts      # decision tree from §6

app/src/screens/settings/
├── Sync.tsx                 # NEW sub-screen: sign-in/out, status, force resync,
│                            #     wipe local cache, view conflict backups
└── SettingsHub.tsx          # add a "Sync" Row to the Data group

app/src/components/
└── SyncStatusPill.tsx       # sidebar footer status indicator
```

**Reuse:**
- `DexieArtifactRepo`, `DexieDependencyRepo`, `DexiePrefsRepo` — used as-is. When signed in, the Drive repos call into them for cache reads.
- `app/src/lib/repo/dexie.ts` — only addition is a `v(2)` migration adding the `syncQueue` table. The `icons` table stays a no-op declaration; image icons remain data-URLs inside `iconValue` (deferred refactor; not coupled to this milestone).
- `dep-fetcher.ts`, `ingestion.ts`, `artifacts.ts`, all screens, `import-detector.ts`, `settings-context.tsx`, `prefs.ts` — **untouched.**

---

## The mechanical refactor: swapping the seam

The riskiest piece of code-level work.

Today: `app/src/lib/repo/dexie-repos.ts:96-98` exports `artifactRepo`, `dependencyRepo`, `prefsRepo` as Dexie singletons. ~15 consumers import them directly.

Plan:
1. Add `app/src/lib/repo/active.ts` that re-exports the three singletons. Initially still Dexie.
2. Sweep all ~15 consumers — change import path from `'../lib/repo/dexie-repos'` to `'../lib/repo/active'`. No behavior change.
3. Implement the Drive repos.
4. On sign-in, `active.ts` swaps its **internal references** to the Drive-backed wrappers. The exported singleton object identities stay stable so React `useEffect` references don't break — implement the exports as thin facades whose methods delegate through a mutable `current` field.

This swap is the entire integration surface for the UI. Everything else is below it.

---

## Risks and open questions

| Risk | Mitigation / current thinking |
|---|---|
| Drive 100-sec-per-user rate limit | Write coalescing, 500ms source debounce, ≤5 concurrent pulls, exponential backoff. Single user → should be unreachable. |
| GIS popup blocked on iOS Safari | Ship popup-first; fall back to GIS redirect mode if blocked. Verify in §11 smoke tests. |
| User revokes Drive access externally | Next call 401 → silent refresh fails → engine pauses with reconnect banner. No local data loss. |
| User wipes appdata folder externally | Practically impossible via Drive UI (appdata is hidden), but if it happens, next boot's "no manifest" branch treats it as fresh sign-in. Local Dexie copy is the safety net. |
| Token theft via XSS on app origin | XSS already implies total compromise of IndexedDB; we haven't made things worse. Two-origin model still protects against artifact-origin escalation. |
| Manifest write race between two devices | Use `If-Match: <etag>` on every manifest update. On 412, refetch + re-diff + retry. Manifest is small, retry is cheap. |
| Image-icon size in JSON | Image icons are base64 data-URLs in `iconValue`. Add a soft warning in `IconPicker.pickImage` if image > 500 KB. |
| **Open** | `lastOpened` device-local vs synced. Recommend device-local. |
| **Open** | LWW + backup vs 3-way merge for source conflicts. Recommend LWW. |
| **Open** | `drive.appdata` vs `drive.file`. Recommend `appdata` + JSON-export escape hatch. |

---

## Verification — manual smoke tests

Run on Chrome desktop, Safari iOS, Firefox desktop. Use two Google accounts (A and B).

1. **Local-only unchanged.** Fresh profile. Add/edit/delete artifacts. Sign-in panel offers it but no sync is attempted.
2. **First sign-in with local library.** Sign in with A, watch 3 artifacts upload, manifest appear. Verify via Drive API explorer that `files.list?spaces=appDataFolder` returns expected files.
3. **Cross-device pull.** Second browser profile, sign in as A, see the 3 artifacts pull down. Open one — source matches.
4. **Concurrent edit, no conflict.** Edit artifact X in browser 1, Y in browser 2. Reconcile fires on both; both edits land.
5. **Concurrent edit, conflict.** Set X.source to `// A` in browser 1, sync. Offline in browser 2, set X.source to `// B`. Reconnect → one wins, the other is preserved as a `.conflict-<ts>.json`, toast surfaces.
6. **Offline replay.** Sign in. Offline. Make 5 edits, close tab. Reopen offline — edits visible, queue depth 5. Go online — queue drains.
7. **Sign-out / sign-in round-trip.** "Keep local" → app feels like local mode. Re-sign-in → no duplicates, no re-syncs of unchanged artifacts.
8. **Account switch.** Sign out (keep), sign in as B. Warning fires. Wipe. Confirm empty library.
9. **Token expiry.** Sign in. Wait an hour. Edit. Brief silent re-auth, then sync.
10. **Security regression (critical).** Sign in. In an artifact iframe's DevTools console, attempt `window.parent.postMessage`, `indexedDB.open('sandbox-web')`, `fetch('https://www.googleapis.com/drive/v3/files', { headers: { Authorization: 'Bearer …' } })`. **All must be blocked.** The runtime origin must not have gained any capability.
11. **Quota sanity.** Network panel during normal idle use — should be ~1 manifest HEAD per 60s. Saves fire ≤5 calls per debounce window.
12. **Export escape hatch.** Settings → Storage → Export library → single JSON downloads with every artifact's source. Open in a text editor; sanity-check.

---

## Sequencing

Three shippable subphases.

**Phase A — Plumbing, no behavior change.**
1. Add `active.ts`, sweep all consumers to import from it.
2. Add `syncQueue` table (Dexie v2 migration), unused.
3. Add Sync sub-screen as a stub ("Sign-in coming soon").

**Phase B — Drive client + repos.**
4. Implement `auth/google.ts`, `cloud/drive-client.ts`, `cloud/manifest.ts`.
5. Implement `DriveArtifactRepo`, `DrivePrefsRepo`.
6. Implement `sync/engine.ts`, `sync/queue.ts`, `sync/reconcile.ts`.
7. Wire sign-in flow + first-sign-in migration + account-switch protection.
8. Run smoke tests 1–11.

**Phase C — Polish.**
9. Conflict-backup file viewer in Settings → Sync.
10. JSON export button in Settings → Storage (smoke test #12).
11. Image-size soft warning in `IconPicker`.
12. iOS popup-blocked → redirect fallback.

TODO.md `#26–#33` deployment work is independent and can happen in parallel.

---

## Critical files to modify or create

**Existing (read for context):**
- `app/src/lib/repo/types.ts` — the contracts. Do not modify.
- `app/src/lib/repo/dexie-repos.ts` — current singletons; class implementations stay.
- `app/src/lib/repo/dexie.ts` — schema; adds `syncQueue` in v2.
- `app/src/lib/sample-artifact.ts` — seed sample id constant, used by migration.
- `app/src/lib/settings-context.tsx` — confirms prefs flow through `prefsRepo`.
- `plan/ARCHITECTURE.md` §3 (security model), §4.3 (repository abstraction), §6 (accounts-later pattern) — the design these decisions slot into.

**New (to create):**
- `app/src/lib/repo/active.ts`
- `app/src/lib/repo/drive-repos.ts`
- `app/src/lib/auth/google.ts`, `app/src/lib/auth/account.ts`
- `app/src/lib/cloud/drive-client.ts`, `app/src/lib/cloud/manifest.ts`
- `app/src/lib/sync/engine.ts`, `app/src/lib/sync/queue.ts`, `app/src/lib/sync/reconcile.ts`
- `app/src/lib/migration/first-signin.ts`
- `app/src/screens/settings/Sync.tsx`
- `app/src/components/SyncStatusPill.tsx`
