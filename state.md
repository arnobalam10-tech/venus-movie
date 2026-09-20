# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-20 — Live on Vercel; fixed admin routing after production feedback
**Context:** user connected Vercel themselves (imported `.env` directly) and shared the live URL: **https://venus-movie.vercel.app**. Reported sign-in "stuck" and being unable to reach `/admin` even as `admin@admin.com`; suggested a separate admin login.

**Diagnosis (tested directly against the live URL):**
- Opened the production site fresh: confirmed the deployed build has the latest code (sign-in only, no signup toggle).
- Signed in as `admin@admin.com` → worked correctly, redirected to home with real data (Jump Back In, hero, etc. all rendering from production Supabase + TMDB).
- Navigated to `/admin` directly → worked correctly, Users list populated.
- Signed out → worked correctly, back to `/login`.
- So the deployment itself was healthy. The user's earlier "stuck" experience was traced to two separate things: (1) they'd tested `/admin` while logged in as `nafisa@venus.com`, a non-admin self-signup account from before signups were removed — being blocked was correct, not a bug; (2) admin sign-in landed on the homepage like any other account, with no visible link to `/admin` anywhere — so it looked broken even though it technically worked if you knew to type the URL.

**Fix (no separate admin login needed — the existing single-login system already knows who's an admin):**
- Refactored `src/lib/admin.ts`: extracted `isAdminUser(userId)` as a standalone check (was previously buried inside `requireAdmin()`), so it can be reused without re-fetching the current user.
- `src/app/login/actions.ts`: `signIn` now checks `isAdminUser()` after a successful login and redirects to `/admin` instead of `/` for admins.
- `src/components/Header.tsx`: shows a visible "Admin" link (next to Sign out) whenever the logged-in user is an admin, so there's always a way back to the panel.
- `src/lib/supabase/middleware.ts`: the proxy's "already logged in, visiting /login" redirect is now admin-aware too, for consistency.
- Revoked admin access from `moazzir.ch+venustest@gmail.com` — that account had only been granted admin during this session's own Phase 9 testing and isn't meant to be a real admin; it was incidentally still marked admin in the database and would have redirected to `/admin` on sign-in, which would have been confusing.
- **Verified all three cases live locally:** admin sign-in → lands directly on `/admin`, "Admin" link visible in header; revoked-admin account sign-in → lands on `/`, no "Admin" link, `/admin` inaccessible. `npm run build` clean.
- Updated `plan.md` (Phase 9 gets the routing-fix note, Phase 10 marked ✅ live with the production smoke-test results and root-cause explanation).

**Full app status:** live in production at https://venus-movie.vercel.app, all core features working, admin routing now matches expectations (admin lands in the admin panel, regular accounts land in the app, no separate login surface needed).

**Not started yet:**
- Haven't pushed this latest fix to GitHub yet — about to.
- Phase 11 (network/IP lockdown) remains deliberately deferred.

**Next step:**
- Commit and push the admin-routing fix, then confirm with the user that production now behaves as expected once Vercel redeploys.
