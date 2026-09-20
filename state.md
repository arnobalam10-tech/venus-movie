# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-20 — Signup removed entirely; admin panel gets a Users list with credentials
**Context:** user raised two things mid-session: (1) realized self-signup meant users could get into the site without admin control, initially asked about an approval workflow, then changed direction to "no signups, only I can create users, remove signups completely"; (2) reported "the signin button doesnt redirect to the website" — most likely explained by the old signup flow requiring email confirmation before login worked (which is now moot).

**Done:**
- **Removed self-signup completely**, per explicit instruction:
  - `/login` is now sign-in only — removed the sign-up toggle/form from `src/app/login/page.tsx`.
  - Removed the `signUp` server action from `src/app/login/actions.ts`.
  - Deleted `src/app/auth/callback/` (the email-confirmation redirect handler — no longer needed since every account is now created pre-confirmed via the admin panel).
  - Simplified `src/lib/supabase/middleware.ts`'s route checks accordingly (no more `/auth` exception needed).
  - Verified sign-in still correctly redirects to `/` after these changes (confirms the original "doesn't redirect" report was tied to the now-removed signup/confirmation flow, not a bug in sign-in itself).
- **Added a Users list to the admin panel**, after clarifying a real constraint with the user first: Supabase never exposes a password after it's set (one-way hashing) — true for every provider, not a gap in our code. Presented two options; user chose to store plaintext passwords **only for accounts created through the admin panel** (single-add or CSV import), in a new locked-down table, so the admin can look them up later. Since self-signup is now removed entirely, this means going forward every account will have a known password.
  - New table `admin_created_credentials` (`user_id`, `email`, `password`, `created_at`), RLS locked to service-role only — same pattern as `admin_users`/`allowed_ips`.
  - `addUser` and `importCsv` in `src/app/admin/actions.ts` now write to this table on successful creation.
  - New `src/components/admin/UsersList.tsx`: lists every account (via `supabase.auth.admin.listUsers()`) with email, password (from the credentials table when known, `—` otherwise), and created date, newest first.
  - Backfilled a credentials row for `admin@admin.com` (created earlier via direct API, before this table existed) via SQL so it shows correctly.
- **Verified live in the browser:** confirmed `/login` shows sign-in only; logged in as `admin@admin.com` and confirmed the redirect to `/` works; `/admin` → Users list showed all 4 existing accounts correctly (password shown for `admin@admin.com`, `—` for the two pre-existing self-signup accounts); added a new user through the form and confirmed it appeared instantly with its password, no manual refresh needed; cleaned up the test account afterward.
- Cleared a stale `.next` type-cache error (referenced the deleted callback route) — `npx tsc --noEmit`, `npm run lint`, and `npm run build` all clean afterward.
- Updated `PRD.md` (§4 Authentication rewritten for admin-only accounts, §9 Admin Panel extended with the Users list + `admin_created_credentials` schema, §7 route description updated) and `plan.md` (Phase 2 and Phase 9 both updated to reflect what was removed/added and why).
- Committed and pushed to GitHub (continuing from the earlier-authorized push to this repo): signup removal + Users list feature.

**Full app status:** every core feature is built, verified, and pushed. Auth is now closed/admin-only end to end (no signup surface at all). Admin panel: add single user, CSV bulk import, sample CSV download, and a full Users list with credentials for admin-created accounts.

**Not started yet / still needs the user:**
- Vercel connection — same as before, needs the user (no `vercel` CLI here). They mentioned importing the `.env` file directly into Vercel, which covers the key part of this step.
- Once deployed: `NEXT_PUBLIC_SITE_URL` should be updated to the real production URL, and a production smoke test should be run.
- Phase 11 (network/IP lockdown) remains deliberately deferred.

**Next step:**
- Waiting on the user to finish the Vercel connection and share the live URL for a production smoke test.
