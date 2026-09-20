# Product Requirements Document (PRD)
**Project Name:** Venus
**App Type:** Automated Movie & TV Show Streaming Portal (WiFi-exclusive perk)
**Status:** v1 spec, approved for planning
**Hosting/Deployment:** Vercel (Next.js, App Router)
**Database/Auth:** Supabase

---

## 1. Overview

Venus is a Netflix-style streaming site for a local WiFi business's customers. It hosts no video files. It pulls movie/TV metadata from TMDB and embeds third-party players (VidSrc) when a user hits play. The site is a fast, premium-feeling, zero-maintenance shell — new releases appear automatically because the catalog is generated live from TMDB, not from a manually curated database.

**Core principle: stateless-first.** Supabase stores only what can't come from TMDB — user accounts and watch history. No movie/TV metadata is cached into our own database in v1.

---

## 2. Scope Decisions (from product discussion)

| Decision | Choice |
|---|---|
| TV shows in v1? | **Yes.** Movies and TV shows both ship in v1, with season/episode support for TV. |
| IP allow-list enforcement | **Deferred to Phase 2.** Site is open to any authenticated user in v1; the network-lockdown feature is designed but not enforced yet (see §8). |
| Search API calls | **Server-side proxy** via Next.js API routes (`/api/search`, `/api/discover`, etc.) — keeps the TMDB key server-only and gives us a caching layer. |
| Genre/category rows | **Dynamic**, generated from TMDB's live genre list per media type (movie genres + TV genres), not a hardcoded set. |
| Auth requirement | **Required, admin-provisioned only.** Supabase Email/Password login gates the entire site. There is no self-signup — the `/login` page is sign-in only. Every account is created by the admin via the `/admin` panel (§9), matching how a WiFi business actually hands out access. This is also required for watch history to be attributable to a user. |
| Branding | Site name: **Venus**. Dark mode, premium Netflix-like UI. |
| Video source | **3 VidSrc mirrors**, labeled to the user as **Server 1 / Server 2 / Server 3**: Server 1 = `vidsrc.to` (default, auto-loaded), Server 2 = `vidsrc.me`, Server 3 = `vidsrc.xyz`. A visible server switcher lets the user change source if the default fails or is slow. |

---

## 3. Tech Stack

* **Frontend:** Next.js (App Router) + React, deployed on Vercel.
* **Styling:** Tailwind CSS, dark mode default.
* **Backend/DB/Auth:** Supabase (Postgres + Auth + RLS).
* **Metadata API:** TMDB (v3 API), called only from Next.js API routes/server components — key never shipped to the client.
* **Video Player:** VidSrc iframe embeds, 3 mirror domains with user-facing server switcher.

---

## 4. Authentication

* Supabase Auth, Email/Password.
* **No self-signup.** `/login` is sign-in only, dark/minimal, on-brand as "Venus". All accounts are created by the admin via `/admin` (§9) — the site is a closed, invite-only perk, not open registration.
* Next.js Proxy (`src/proxy.ts`, formerly "middleware" — renamed by Next.js 16) checks session on every route except `/login`; redirects unauthenticated requests to `/login`, and unauthenticated `/api/*` requests get a 401 instead.
* Since accounts are always admin-created via the Supabase Admin API with `email_confirm: true`, there is no email-confirmation flow to build or maintain.

---

## 5. Data Model (Supabase)

Stateless-first: the only persisted data is auth users (managed by Supabase Auth) and watch history. TMDB IDs are the foreign key into "what this row is about" — we never store title, poster, synopsis, etc.

### `watch_history`
Tracks both movies and TV shows (episode-level for TV, so "Jump Back In" can resume to the right episode).

```sql
create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null,
  season_number integer,        -- null for movies
  episode_number integer,       -- null for movies
  last_watched_at timestamptz not null default now(),
  unique (user_id, media_type, tmdb_id)
);

alter table public.watch_history enable row level security;

create policy "Users can view their own watch history"
  on public.watch_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own watch history"
  on public.watch_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watch history"
  on public.watch_history for update
  using (auth.uid() = user_id);
```

On a `/movie/[id]` or `/tv/[id]/[season]/[episode]` page load (authenticated), the app upserts a row keyed on `(user_id, media_type, tmdb_id)`, updating `season_number`/`episode_number`/`last_watched_at`. "Jump Back In" queries the 10 most recent rows for the current user, then re-hydrates poster/title/etc. from TMDB per row (never stored locally).

### `allowed_ips` (Phase 2 — table defined now, not enforced in v1)

```sql
create table public.allowed_ips (
  id uuid primary key default gen_random_uuid(),
  ip_range cidr not null,
  label text,
  created_at timestamptz not null default now()
);

alter table public.allowed_ips enable row level security;

create policy "Service role only"
  on public.allowed_ips for all
  using (false);
```

Using `cidr` instead of a plain IP string so Phase 2 can allow ranges (e.g. `203.0.113.0/24`), not just exact addresses. No policy grants client access — this table will only ever be read from a server-side middleware/service-role context once enforcement is built. Not wired into middleware in v1.

---

## 6. API Integration

### TMDB (server-side only)
All TMDB calls go through Next.js API routes / server components. The client never sees the TMDB key.

* `GET /api/genres/[mediaType]` — proxies TMDB's genre list (movie or tv), used to build dynamic homepage rows.
* `GET /api/discover/[mediaType]?genre=...&page=...` — proxies TMDB discover, used per genre row.
* `GET /api/trending/[mediaType]` — proxies TMDB trending, used for hero + "Trending Now".
* `GET /api/search?q=...&type=movie|tv|multi` — proxies TMDB search, debounced from the client.
* `GET /api/details/[mediaType]/[id]` — proxies TMDB details (+ credits/cast, append_to_response) for detail pages.

Use Next.js fetch caching (`revalidate`) on these routes (e.g. 1 hour for trending/discover/genres) so we're not hammering TMDB's rate limits and pages stay fast.

### VidSrc (client-side iframe, no key required)
* Movie: `https://vidsrc.to/embed/movie/{tmdb_id}`
* TV: `https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}`
* Server switcher swaps the domain only: `vidsrc.to` → `vidsrc.me` → `vidsrc.xyz`, same path structure, labeled "Server 1/2/3" in the UI.
* If an iframe fails (onError / load timeout), show a friendly "Stream currently unavailable — try another server" state rather than a blank/broken frame, with the server switcher inline.

---

## 7. Pages & Routes

1. **`/login`** — Email/password sign-in only (no signup), dark minimalist, "Venus" branding.
2. **`/` (Home)** — Authenticated only.
   * Hero: large banner for a trending pick (movie or TV).
   * Row: "Jump Back In" (from `watch_history`, current user).
   * Rows: "Trending Now", "Top Rated", "New Releases", plus one row per TMDB genre (dynamic, movies and TV interleaved or separate tabs — see Open Questions).
3. **`/search`** — Live search box (debounced), grid of results across movies + TV, each tagged with its type.
4. **`/movie/[id]`** — VidSrc movie iframe (Server 1 default, switcher visible) up top; title/synopsis/rating/year/cast below. Writes to `watch_history` on load.
5. **`/tv/[id]`** — Show overview, season/episode picker.
6. **`/tv/[id]/[season]/[episode]`** — VidSrc TV iframe for that episode, server switcher, episode list to jump between episodes. Writes to `watch_history` (with season/episode) on load.
7. **`/admin`** — Admin-only, see §9. Built last, after the core app is done.

---

## 8. Network Lockdown (Phase 2, not built in v1)

Kept in the spec so the schema and middleware hook point exist, but **not enforced** in v1 per product decision — site is available to any authenticated user regardless of network.

When enabled later: Next.js middleware reads the request IP (`x-forwarded-for` behind Vercel), checks it against `allowed_ips` (CIDR match, server-side/service-role only), and renders an "Access Denied — connect to our WiFi to watch" screen if no match.

---

## 9. Admin Panel (build last, after the core streaming app)

The business owner provisions every customer account directly (email + password) — there is no self-service signup (§4). This is the only way accounts get created.

* **Access control:** a new `admin_users` table (`user_id uuid references auth.users(id)`) lists which authenticated users are admins. `/admin` routes check membership server-side (service-role query) and redirect non-admins away — this is separate from, and stricter than, the general auth check in the proxy.
* **Add a single user:** form with email + password → server action calls Supabase's admin API (`supabase.auth.admin.createUser`, service-role key, server-only) to create a pre-confirmed account (no confirmation email needed since the admin is vouching for the address).
* **CSV import:** upload a `.csv` with `email,password` columns → parsed server-side → each row created via the same admin API call → a results summary shown (created / skipped / failed per row, with reasons — e.g. duplicate email, weak password).
* **Sample CSV download:** a static `/admin` download link/button serving a template file with the header row `email,password` and one example row, so the owner knows the exact expected format before importing.
* **Users list:** the admin page also lists every account (email, created date, and password when known). Supabase never exposes a password after it's set — that's a hard technical limit, not a gap — so passwords are only shown for accounts created *through this admin panel*, which saves the plaintext password to `admin_created_credentials` at creation time specifically so the admin can retrieve and hand it out later. This is a deliberate, explicit tradeoff (a second place in the database holds a readable password) accepted because every account is admin-created anyway.
* **Security notes:** `/admin` and its actions are the only place `SUPABASE_SERVICE_ROLE_KEY` is used; it must never reach the client bundle. CSV upload size is capped (500 rows) and validated (valid email format, minimum password length) before any accounts are created.

### `admin_users` and `admin_created_credentials` (created alongside this feature)

```sql
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Service role only"
  on public.admin_users for all
  using (false);

create table public.admin_created_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  password text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_created_credentials enable row level security;

create policy "Service role only"
  on public.admin_created_credentials for all
  using (false);
```

No client-facing policy on either table — like `allowed_ips`, both are only ever read from a server-side/service-role context.

---

## 10. Error Handling

* VidSrc iframe fails to load or times out → friendly fallback UI with server switcher, not a raw broken iframe or console error shown to the user.
* TMDB API route fails or rate-limits → cached/stale data served if available (via Next.js revalidate), otherwise a clean "Couldn't load right now" empty state per row — never a full page crash.
* Supabase auth errors (bad password, etc.) → inline form error messaging, no raw Supabase error text.
* Admin CSV import → per-row error reporting, never a single failed row aborting the whole batch silently.

---

## 11. Non-Functional Requirements

* Fast initial load (Vercel edge + Next.js ISR/caching on TMDB routes).
* Fully responsive (mobile customers on WiFi are a primary use case).
* No ads, no payment flow. Admin panel (§9) is scoped for v1 but built last, after the core viewing experience works end-to-end.

---

## 12. Open Questions (non-blocking, default assumed if unanswered)

* Home page layout for mixed movie/TV rows: interleave both types per genre row, or separate "Movies" / "TV Shows" sections? **Default: interleave, tag each poster with a small type badge.**
* Supabase email confirmation on signup: on or off? **Default: on (Supabase default).**
