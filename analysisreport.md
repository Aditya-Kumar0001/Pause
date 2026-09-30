# Pause_cafe — Deployment Analysis & Fix Plan (PLAN ONLY — nothing below has been implemented)

Project: Pause Café (`pause-coffee-and-eatery`)
Path: C:\Users\souvi\Downloads\Pause_cafe

This report replaces the earlier draft. It covers three things the user asked for:
1. Why Kinkoo visit-code claiming (customer generates a code, admin enters it) breaks in production, and the fix plan.
2. Why login is unreliable, and the plan to drop email/password login and keep Google sign-in only.
3. The current SQLite/Firestore database structure and concrete efficiency fixes.

No code, config, or database has been changed. `server/index.js`, `server/kinkooApi.js`, `src/pages/AccountPage.tsx`, `src/services/accountDataService.ts`, and `.env.example` already have **uncommitted, in-progress edits** from a prior session that partially address item 1 (see "Already in progress" below) — these were left untouched and are only described here for context.

---

## 1. Kinkoo visit-code claim fails in production

Flow: signed-in customer calls `POST /api/kinkoo/visit-token` → gets a 6-digit code (5 min TTL, SHA-256 hash stored in SQLite `visit_tokens`) → admin calls `POST /api/kinkoo/visit/inspect` then `POST /api/kinkoo/visit/verify` (`server/kinkooApi.js:484-643`, wired from `src/pages/admin/AdminDashboardPage.tsx` via `visitTokenService.checkToken` / `markAsVerifiedVisit`).

Every one of these calls goes through `verifyFirebaseToken()` (identity) and, for admin routes, `requireAdmin()` (reads `admins/{uid}` from Firestore via REST). Root causes below are ranked by how likely each is to be *the* prod failure, based on what's checkable in this repo.

### 1a. Firebase project ID mismatch/missing on the API server (root cause, high confidence)
- `createKinkooApi()` used to resolve `activeProjectId` as `projectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID` with no trimming (`server/kinkooApi.js:441`, pre-edit). If the prod host only sets `VITE_FIREBASE_PROJECT_ID` (client var) and not `FIREBASE_PROJECT_ID` (server var), or the value has stray whitespace/quotes from the hosting dashboard, `verifyFirebaseToken` rejects every token — including the admin's — with a generic `"Sign in again to continue."`. From the UI this looks exactly like "the code doesn't work," because `visit/inspect` never gets past auth.
- **Already in progress (uncommitted):** the working tree already trims/falls back across `projectId`, `FIREBASE_PROJECT_ID`, `VITE_FIREBASE_PROJECT_ID` in both `server/index.js` and `server/kinkooApi.js`, and now returns distinct, diagnosable error messages/status codes (`api-401`, `api-500`) instead of one generic message, surfaced in `AccountPage.tsx`. `.env.example` also gained a `FIREBASE_PROJECT_ID` line.
- **Plan:** keep this change. Additionally:
  - Confirm the production deploy target actually sets `FIREBASE_PROJECT_ID` (server-side var, not `VITE_`-prefixed) — this is the single most common miss for this bug class.
  - Add a startup assertion in `server/index.js`: if `firebaseProjectId` is empty, log a loud warning (or refuse to start) rather than silently deferring the failure to the first request.

### 1b. Static-only hosting can't run the SQLite API at all (confirmed, from prior report)
- `PROJECT_DOCUMENTATION.md` states production must run `server/index.js` on Node ≥22.18 with persistent disk; `node:sqlite` (used in `server/sqliteStore.js:3`) requires a real Node process, not a static host (Netlify/Vercel static, GitHub Pages, etc.).
- If the site is deployed as a static build only, `/api/kinkoo/*` doesn't exist server-side; the SPA falls back to `index.html` for the API path, the client gets a non-JSON 200, `response.json()` fails, and every Kinkoo call (token generation **and** admin verify) fails.
- **Plan:** verify the actual prod host. If it's static-only, either (a) move the whole site to a Node host, or (b) split: keep the static site on Netlify and run `server/index.js` as a separate persistent Node service, setting `VITE_KINKOO_API_BASE_URL` (client build var) to that service's origin and `KINKOO_ALLOWED_ORIGINS` (server var) to the website's origin. Confirm one durable disk path for `KINKOO_SQLITE_PATH` that survives redeploys — a fresh/empty DB on every deploy is functionally identical to "nothing was ever claimed."

### 1c. Client-side Firebase silently disabled by an unrelated, optional env var (new finding, high confidence, also breaks login — see §2)
- `src/firebase/config.ts:15` — `isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)` requires **every** field, including `measurementId` (Google Analytics), to be truthy.
- `measurementId` is optional in Firebase and very commonly left unset in production env panels (it's not needed for Auth/Firestore to function). If it's missing, `isFirebaseConfigured` is `false`, so `firebaseAuth`/`firestore` are both `null` — the customer can't generate a code and the admin can't inspect/verify one, and neither can sign in at all (§2). This fails silently/generically ("Firebase is not configured") and is easy to miss because local `.env.local` has it set.
- **Plan:** change the check to only require the fields Auth/Firestore actually need (`apiKey`, `authDomain`, `projectId`, `appId` at minimum — `storageBucket`/`messagingSenderId`/`measurementId` are not required for those SDKs to initialize). Verify prod env vars against this narrowed list.

### 1d. CORS lockout when the API is on a different origin than the site
- `server/index.js:70-86` only sets CORS headers, and only allows the `OPTIONS` preflight through, when `origin` is in `KINKOO_ALLOWED_ORIGINS`. If the site and API are split (per 1b) and this env var is unset or doesn't exactly match the deployed site origin (scheme+host+port, no trailing slash), every cross-origin Kinkoo call — including visit-token and visit-verify — is blocked by the browser before it reaches the server logic.
- **Plan:** confirm `KINKOO_ALLOWED_ORIGINS` is set in prod and exactly matches the deployed site's origin(s) (comma-separated if more than one, e.g. apex + `www`).

### 1e. Missing/misconfigured Firestore `admins/{uid}` record
- `requireAdmin()` (`server/kinkooApi.js:250-289`) reads `admins/{uid}` and requires `active === true` and `role === 'admin'`. If the admin's Firestore record wasn't created in the production Firestore project (separate from any staging/dev project), every admin-only endpoint — including `visit/inspect` and `visit/verify` — fails with "No Firestore admin record was found," which reads to the admin as "the code isn't working."
- **Plan:** this is a data/ops check, not a code fix: confirm the admin's UID has an `admins/{uid}` doc with `active: true, role: 'admin'` in the *production* Firestore project (matches §1a's `FIREBASE_PROJECT_ID`).

### 1f. `node:sqlite` runtime availability
- `server/sqliteStore.js:3` imports `node:sqlite`, which requires Node ≥22.5 behind a flag, stable-ish at ≥22.18 (matches `package.json` `engines`). If the prod host pins an older/different Node runtime than declared, the API process fails at import time — total outage, not a partial one, so easy to distinguish from 1a/1c in logs.
- **Plan:** confirm the prod host's Node runtime version matches `engines.node` in `package.json` exactly (hosting platforms sometimes default to an LTS that's older).

### Diagnostic order recommended
Check in prod, cheapest first: (1) `GET /api/kinkoo/health` returns `{ok:true}` from the real API host (rules out 1b/1f) → (2) browser devtools network tab on a failed claim: CORS error (1d) vs 401/500 JSON body (1a/1c/1e, and the in-progress error messages now say which) → (3) confirm env vars server-side (`FIREBASE_PROJECT_ID`, `KINKOO_ALLOWED_ORIGINS`, `KINKOO_SQLITE_PATH`) and client-side (`VITE_FIREBASE_*`, `VITE_KINKOO_API_BASE_URL`) in the actual hosting dashboard, not just `.env.example`.

---

## 2. Login: drop email/password, keep Google-only

Two separate login surfaces exist today:

| Surface | File | Methods |
| --- | --- | --- |
| Customer sign-in (`/signin`) | `src/pages/AuthPage.tsx` | Google popup, email/password sign-in, email/password sign-up, password reset |
| Admin staff gateway (`/admin-controls/login`) | `src/pages/admin/AdminLoginPage.tsx` | Email/password only (no Google option today) |

The user's ask ("remove the normal id password login, keep just google login") reads as targeting the **customer-facing** login, since that's what's coupled to the Kinkoo claim flow being reported broken. The admin gateway is a separate, intentionally-gated staff form (further gated by the Firestore `admins/{uid}` check regardless of how the admin authenticates) — flagged as an open question below rather than assumed.

### Why login is unreliable today (feeds into the Google-only fix)
- Same root cause as §1c: `isFirebaseConfigured` requiring `measurementId` can take out **all** sign-in methods, Google included, if that one optional var is unset in prod.
- `auth/unauthorized-domain`: Google's popup sign-in (`signInWithPopup`, `src/services/customerAuthService.ts:107`) requires the production domain to be registered under Firebase Console → Authentication → Settings → Authorized domains. If the prod domain isn't listed there, Google sign-in fails with a clear code that's already mapped to a message (`authService.ts`/`customerAuthService.ts`) — but only if the app got far enough to show it (see previous bullet).
- Email/password failures reported by users are very likely just masking the same `isFirebaseConfigured`/domain issues, which is part of why consolidating to a single, well-tested path (Google) reduces the surface area of prod login bugs.

### Plan to remove email/password, keep Google-only
1. **`src/pages/AuthPage.tsx`**: remove the `mode` state machine for `signup`/`reset`; remove the email/password/confirm-password form fields, the "Forgot password?" link, and the sign-up/sign-in mode switch. Keep only the "Continue with Google" button and its loading/error states. Simplify copy accordingly ("Welcome to Pause" / "Sign in to keep your Pause moments close.").
2. **`src/context/AuthContext.tsx`**: drop `signInWithEmail`, `signUpWithEmail`, `sendPasswordReset` from `AuthContextType` and the provider value; keep `signInWithGoogle` and `signOut`.
3. **`src/services/customerAuthService.ts`**: remove `signInWithEmail`, `signUpWithEmail`, `sendPasswordReset` and their now-unused imports (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`, `sendPasswordResetEmail`, `updateProfile`). Keep `signInWithGoogle`, `signOut`, and `syncUserProfile`/`finishSignIn` (still used by Google sign-in).
4. **`readableAuthError`**: drop the now-dead email/password error codes (`auth/invalid-email`, `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found`, `auth/email-already-in-use`, `auth/weak-password`, `auth/operation-not-allowed`); keep the Google-relevant ones (`popup-closed-by-user`, `popup-blocked`, `cancelled-popup-request`, `network-request-failed`, `user-disabled`, `too-many-requests`, `unauthorized-domain`).
5. **Firestore rules (`firestore.rules:29-63`)**: no change needed — the `users/{uid}` create/update rules are already provider-agnostic (they just record whatever `provider` string `syncUserProfile` sends, which will now always be `google.com`).
6. **Firebase Console (ops, not code)**: once email/password sign-in is removed from the UI, disable the Email/Password provider in Firebase Console → Authentication → Sign-in method, so no stray path remains for someone to sign in against the API directly. Confirm the prod domain is in Authorized domains (fixes the popup issue above).
7. **Fix `isFirebaseConfigured`** (`src/firebase/config.ts:15`) as described in §1c — required regardless, since it currently can break Google sign-in too.
8. **Admin gateway — needs a decision, see below.**

### Open question: does the admin gateway also move to Google-only?
`AdminLoginPage.tsx`/`authService.loginAsAdmin` is currently email/password against a fixed Firebase Auth account, separately gated by the `admins/{uid}` Firestore check. Two reasonable options:
- **Keep as-is**: staff credentials are intentionally out-of-band from the public Google flow (simpler to hand out/revoke without touching each staffer's personal Google account).
- **Match customer flow**: switch to `signInWithPopup` + Google, relying entirely on the `admins/{uid}` allow-list for authorization (a non-staff Google account just gets "not an authorized café admin"). This is simpler code-wise and consistent with "just Google login," but requires every admin to sign in with a specific Google account you've pre-authorized, and Google-auth's UX doesn't support instant same-device "logout this staff member" the way revoking a password does.

Recommendation: leave the admin gateway on email/password unless told otherwise — it's a separate, small, already-gated surface, and email/password disable is aimed at fixing the flaky *customer* login. Flagging here instead of assuming.

---

## 3. Database structure and efficiency fixes

### Current structure (as implemented, matches `PROJECT_DOCUMENTATION.md`)

**Firestore** (`firestore.rules`): `users/{uid}` (profile), `admins/{uid}` (staff allow-list), `visits/{visit_<hash>}` (verified in-person visits, create-only from the API), `community_members/{id}`. Legacy `ledger`, `redemptions`, `kinkooAccounts` are read-only, kept only for one-time import into SQLite.

**SQLite** (`server/sqliteStore.js`, WAL mode, `foreign_keys=ON`, `busy_timeout=5000`, `BEGIN IMMEDIATE` for balance-changing transactions):

| Table | Primary key | Existing indexes |
| --- | --- | --- |
| `accounts` | `user_id` | (PK only) |
| `ledger` | `id` | `ledger_user_time(user_id, timestamp DESC)` |
| `visit_tokens` | `token_hash` | `visit_tokens_user(user_id, created_at DESC)` |
| `monthly_visits` | `(user_id, month_key)` | (PK only) |
| `redemptions` | `id` | `code` UNIQUE, `redemptions_user(user_id, created_at DESC)` |
| `rewards` | `id` | (PK only) |
| `experience_slots` | `id` | (PK only) |
| `experience_bookings` | `id` | **none besides PK** |
| `firebase_visit_outbox` | `token_hash` | (PK only) |
| `legacy_imports` | `user_id` | (PK only) |

This split (Firestore for identity/verified records, SQLite for transactional loyalty math) is a reasonable design — it keeps the balance/voucher/stock updates atomic in one place. The efficiency issues below are about missing indexes for query patterns actually used in `server/kinkooApi.js`, not the overall shape.

### Efficiency fixes (indexes — add via `CREATE INDEX IF NOT EXISTS` in `sqliteStore.js`)

1. **`admin/visits` listing does a full scan as data grows.** `GET /api/kinkoo/admin/visits` runs `WHERE status='verified' ORDER BY verified_at DESC LIMIT 500` (`kinkooApi.js:679`); the only index on `visit_tokens` is `(user_id, created_at DESC)`, which doesn't help this query at all. Add `CREATE INDEX visit_tokens_status_verified ON visit_tokens(status, verified_at DESC)`.

2. **Weekly-gift dedup check scans the user's whole ledger.** `WEEKLY_GIFT` lookup is `WHERE user_id=? AND type='WEEKLY_GIFT' AND reference_id=?` (`kinkooApi.js:512`); the existing index is `(user_id, timestamp DESC)`, so SQLite still filters by `type`/`reference_id` row-by-row within that user's ledger. Add `CREATE INDEX ledger_user_type_ref ON ledger(user_id, type, reference_id)`. (This id is already effectively unique per user+week via the `weekly_<uid>_<week>` primary key too, but the index still saves the lookup before the insert.)

3. **Active-voucher check on redeem scans per-user redemption history.** `SELECT id FROM redemptions WHERE user_id=? AND reward_id=? AND status='issued' AND expires_at > ?` (`kinkooApi.js:538`) only has `(user_id, created_at DESC)` to lean on. Add `CREATE INDEX redemptions_user_reward_status ON redemptions(user_id, reward_id, status)`.

4. **Monthly-reward-used check on experience booking uses `substr()` on `created_at`, which can't use any index.** `kinkooApi.js:722-723`: `WHERE user_id=? AND monthly_reward=1 AND status != 'cancelled' AND substr(created_at,1,7)=?`. Recommend adding a stored `month_key` column to `experience_bookings` (computed at insert time, same `monthInBusinessZone()` helper already used elsewhere) and indexing `(user_id, month_key, monthly_reward)` — replaces a string-function scan with a direct index seek.

5. **`experience_bookings` has no lookup index at all.** Cancel (`kinkooApi.js:756-760`) selects by PK (fine), but there's no index for a plausible future "user's bookings" or "slot's bookings" admin view; low priority unless that's needed. Add `CREATE INDEX experience_bookings_user ON experience_bookings(user_id, created_at DESC)` only if/when that query is added — flagging, not urgent.

### Other structural notes (not urgent, informational)
- **Single-writer constraint**: `node:sqlite` + WAL is fine for one Node process. If the prod deploy ever scales the API horizontally (multiple instances), they must all point at the same durable file and effectively serialize writes through SQLite's own locking (`busy_timeout=5000` already helps) — this does not scale past a small number of concurrent instances. If growth requires real horizontal scaling, the eventual fix is a managed Postgres/MySQL (or a replicated SQLite like LiteFS/Turso), not something to build now.
- **In-memory admin auth cache** (`adminAuthorizationCache`, `kinkooApi.js:11-12`, 30s TTL) is per-process; fine as-is, just note it resets on every deploy/restart (acceptable — it's a performance cache, not a source of truth).
- **Backups**: confirm the prod host backs up `KINKOO_SQLITE_PATH` (including WAL state) before any storage/plan changes, per `PROJECT_DOCUMENTATION.md:41` — this is the single biggest risk to "accounts appearing reset."

---

## Not fixed
No code, configuration, or database has been changed by this report. Everything above is a plan for review; implementation should happen as a separate, explicit follow-up once the prod environment variables (§1, §2) have been confirmed and the admin-gateway question (§2) is answered.
