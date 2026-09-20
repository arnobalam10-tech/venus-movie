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
| Video source | **3 VidSrc mirrors**, labeled to the user as **Server 1 / Server 2 / Server 3**: Server 1 = `vidsrc.me` (default, auto-loaded — swapped in after real-world testing showed it's more reliable than `vidsrc.to`), Server 2 = `vidsrc.to`, Server 3 = `vidsrc.xyz`. A visible server switcher lets the user change source if the default fails or is slow. |
| Home page discovery rows | Beyond Trending/Top Rated/New Releases/dynamic genres, the home page also has Netflix-style **"Top 10 Movies Today"** and **"Top 10 TV Shows Today"** rows (TMDB daily trending, sliced to 10, shown with large rank numerals). |

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
   * Rows: "Trending Now", "Top 10 Movies Today", "Top 10 TV Shows Today" (ranked numerals, Netflix-style), "Top Rated", "New Releases", plus one row per TMDB genre (dynamic, movies and TV interleaved or separate tabs — see Open Questions).
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

---

## 13. TV Casting (Android TV App) — web side built & verified, Android app written but unbuilt (no local tooling)

A companion Android TV app lets a user cast whatever they're watching on the website straight to their TV, without the TV ever needing a typed-in login. Modeled on how smart-TV apps handle "device pairing" (the same category of flow YouTube/Netflix TV apps use), not on Google Cast/Chromecast — that's a deliberate choice, explained below.

### 13.1 Why not real Google Cast

Real Cast (the "cast icon appears automatically" experience from YouTube/Prime) needs two things we don't have:

1. **A sender-side Cast API in the browser.** iOS Safari has never implemented the Google Cast sender APIs — no cast icon, no device discovery, ever, on any browser on iOS (every iOS browser is required to run on Apple's WebKit engine underneath, so "Chrome on iPhone" doesn't get it either). Since the user wants this working from iOS Safari, real Cast is off the table regardless of how the TV app is built.
2. **A direct, independently-fetchable media URL.** Real Cast works by the phone handing the TV a raw video URL/manifest that the TV fetches on its own. Our video isn't ours — it's a third-party VidSrc iframe embed. We have no legitimate direct stream URL to hand off, and no programmatic control over VidSrc's player (cross-origin).

So instead: a **custom pairing + relay system**, built entirely on our own stack, which works identically from any browser because it never touches an OS-level cast API at all.

**Implementation note:** the TV side talks to the backend via short-interval HTTP polling (~3s), not a Supabase Realtime WebSocket subscription as originally sketched here. There's no first-class lightweight Supabase Realtime client for plain Kotlin — the officially supported one is a fuller multiplatform SDK with meaningfully more dependency surface to get wrong in a project that can't be compile-tested locally. Polling only needs the same single HTTP call mechanism the app already uses for everything else. A few seconds of latency between casting and playback starting is imperceptible for this use case.

### 13.2 Pairing flow (replaces TV login)

1. TV app launches, generates a random `device_token` (persisted locally so it survives restarts), calls `POST /api/tv/register`. Server creates a `tv_devices` row with a short numeric pairing code (e.g. 6 digits, ~10 min expiry) and returns `{ device_token, code }` to the TV.
2. TV displays the code on screen and starts polling `GET /api/tv/poll?device_token=...` every ~3 seconds.
3. User opens `/tv` on the website (already logged into their Venus account on their phone), types the code in.
4. `POST /api/tv/pair` looks up the pending row by code, links it to the current `user_id`, marks it paired.
5. TV's next poll sees `paired: true` and switches its screen from "Enter this code" to "Connected".
6. **Pairing persists.** The TV keeps its `device_token` locally forever (until app data is cleared) and reconnects automatically on every future launch — no re-pairing needed. The phone's `/tv` tab checks for an existing paired device for the signed-in user and shows "Connected" directly, skipping the code-entry step, if one exists.
7. v1 supports **one paired TV per account** (simplest schema/UX for a personal setup; can extend to multiple later if needed).

### 13.3 Casting flow

* Once paired, a **"Cast to TV"** button appears in the video player (next to the fullscreen button) on `/movie/[id]` and `/tv/[id]/[season]/[episode]`.
* Pressing it records `{ mediaType, tmdbId, season?, episode? }` against the paired device's row.
* TV is always polling; on its next poll it sees the new cast and loads that title full-screen. Casting something new while already casting just replaces what's playing — both `MainActivity` (idle) and `PlayerActivity` (already playing something) run the same poll loop and react to a changed `issuedAt` timestamp, so switching mid-playback works the same way as an initial cast.
* **No play/pause/seek/volume control from the phone** — descoped per product decision, since we have no reliable programmatic access to VidSrc's player to make it worthwhile.

### 13.4 How the TV actually plays the video without a full login

The TV app is a thin **WebView shell**, not a fully logged-in browser session. Rather than replicating cookie-based Supabase auth inside the WebView (extra complexity, extra attack surface), the TV requests a narrow, short-lived, single-purpose **view token** scoped only to displaying a specific title:

* `GET /tv-embed/movie/[id]?token=...` / `GET /tv-embed/tv/[id]/[season]/[episode]?token=...` — a stripped-down page (no header, no nav, just the VidSrc iframe) that validates a signed token (HMAC, short expiry, bound to that specific `device_token`) instead of a full user session. The header is hidden on these routes via a small `x-pathname` request header threaded from the proxy to the root layout, rather than restructuring the whole route tree into groups for this one exception.
* The token is minted fresh server-side on every poll response once something's been cast, so the TV always has a live, unexpired token by the time it acts on it — never exposed to the public otherwise.
* This keeps the TV's access intentionally narrow: it can display exactly what's cast to it, nothing more (no browsing, no account access), which matches the product's actual needs.

### 13.5 New Supabase schema

```sql
create table public.tv_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_token text not null unique,
  pairing_code text,
  code_expires_at timestamptz,
  paired_at timestamptz,
  cast_media_type text check (cast_media_type in ('movie', 'tv')),
  cast_tmdb_id integer,
  cast_season integer,
  cast_episode integer,
  cast_issued_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tv_devices enable row level security;

create policy "Users can view their own paired device"
  on public.tv_devices for select
  using (auth.uid() = user_id);
```

The `cast_*` columns hold "what to play right now" for the polling model (§13.1 implementation note) — updated by `/api/tv/cast`, read by `/api/tv/poll`.

Registration (`POST /api/tv/register`) and pairing (`POST /api/tv/pair`) happen through server-side routes using the service-role client (the TV isn't authenticated yet when it registers, and RLS above only grants read access to an already-paired owner) — same pattern as the admin panel's service-role usage.

### 13.6 APK distribution

* The compiled `.apk` is committed as a static file (`public/venus-tv.apk`), served directly by Vercel — a direct, stable download URL with no extra hosting needed.
* A **"Download TV App"** button on `/login` links straight to it; clicking starts the download immediately, no extra page or store listing.
* Since this environment has no Android build tooling, the `.apk` is produced by a GitHub Actions workflow (`.github/workflows/build-tv-apk.yml`) that builds it on every push touching `android-tv/**` and auto-commits the result to `public/venus-tv.apk`. This workflow is itself unverified — needs a check of the GitHub Actions tab after the first push.

### 13.7 Scope note

This is a second, separate codebase (Kotlin/Android, not Next.js) with its own build toolchain. Unlike the website, it can't be iterated on and verified live in a browser — real-device testing will lean much more on the user. Build-tooling availability (Android SDK/Gradle) needs to be checked before implementation starts.
