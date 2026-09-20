# Product Requirements Document (PRD)
**Project Name:** WiFi VOD Portal
**App Type:** Automated Movie & TV Show Streaming Site
**Hosting/Deployment:** Vercel (Next.js)
**Database/Auth:** Supabase

## 1. The Vibe & Overview
We are building an automated, Netflix-style streaming website exclusive to a local WiFi business. The site does not host any video files itself. Instead, it acts as a dynamic shell: it automatically pulls movie details (posters, cast, descriptions) from free movie databases, and embeds a third-party streaming player when a user clicks play. 

The goal is a fast, premium-feeling, zero-maintenance site where new movies appear automatically as they are released globally. 

## 2. The Tech Stack & APIs
*   **Frontend Framework:** Next.js (React) using App Router - Deployed on Vercel for lightning-fast page loading.
*   **Styling:** Tailwind CSS (Dark mode default, sleek, modern UI).
*   **Backend / Database:** Supabase - Used for user authentication, managing watch history, and storing an IP Allow-list.
*   **Movie Data API (OMDb / TMDB):** We will use the free tier of OMDb API or TMDB to fetch movie metadata. When the app loads, it asks this API for the latest trending movies to build the UI grid.
*   **Video Streaming API (VidSrc):** We will use VidSrc (vidsrc.to / vidsrc.me) as the video player. It is a free iframe embed that streams the actual movie by matching the IMDb or TMDB ID.

## 3. User Authentication & Database Setup
*   **Supabase Auth:** The site must be locked behind an Email/Password login screen. Unauthenticated users should only see a sleek, minimalist login/signup form.
*   **Watch History (Jump Back In):** Because we use an external iframe (VidSrc) for video playback, standard HTML5 timestamp tracking is impossible due to cross-origin security. 
    *   *Solution:* We will build a "Recently Watched" feature. When an authenticated user opens a `/movie/[id]` page, Supabase should insert or update a record in a `watch_history` table with the current timestamp. 
    *   This will populate a "Jump Back In" row on the homepage, showing recently clicked movies.
*   **Network Lockdown (Critical):** This site is a perk exclusively for paying WiFi customers. We need to verify the user's IP address against a Supabase table (`allowed_ips`). If they are not on our approved ISP network, they should see an "Access Denied - Connect to our WiFi to watch" screen.

## 4. Core Features & Logic
*   **Automated Catalog:** No manual uploading. The homepage should query the metadata API to build horizontal scrolling rows for "Trending Now," "Action," "Comedy," etc.
*   **Search Functionality:** A live search bar that pings the OMDb/TMDB API so users can search the global movie database.
*   **Dynamic Movie Pages:** When a user clicks a movie poster, they go to `/movie/[id]`. This page uses the movie's ID to fetch the description/cast and loads the VidSrc video player iframe (e.g., `<iframe src="https://vidsrc.to/embed/movie/{id}"></iframe>`).

## 5. Page Structure
1.  **Auth Page (`/login`)**
    *   Sleek login/signup form (dark mode).
2.  **Home Page (`/`)**
    *   Hero section featuring a massive poster of a popular new release.
    *   Row 1: "Jump Back In" (User's recently clicked movies fetched from Supabase).
    *   Row 2+: "Trending", "Top Rated", "New Releases" (Fetched from TMDB/OMDb).
3.  **Search Page (`/search`)**
    *   Live search results returning a grid of movie posters.
4.  **Movie Detail Page (`/movie/[id]`)**
    *   Top half: The VidSrc video player iframe.
    *   Bottom half: Title, synopsis, IMDB rating, release year, and cast.

## 6. Development Instructions for Claude
1.  **Vibe-Code this:** I want a clean, premium, Netflix-style UI. heavily utilize Tailwind CSS.
2.  **Stateless First:** Rely on the OMDb/TMDB APIs for movie data as much as possible rather than saving thousands of movie details into our database. The only movie data saved to Supabase should be the minimal info required for the `watch_history` table.
3.  **Provide Supabase SQL:** Please give me the exact SQL commands to run in the Supabase SQL Editor to create the `watch_history` table and the `allowed_ips` table, including Row Level Security (RLS) policies.
4.  **Middleware Logic:** Write the Next.js middleware required to check user authentication status and (if possible) check their IP against the allow-list before rendering the main app.
5.  **Error Handling:** If VidSrc fails to load, or API limits are hit, show a clean, friendly "Stream currently unavailable" fallback state rather than a broken page or raw error codes.

Please write the foundational Next.js boilerplate, the Supabase integration logic, the API fetching functions, and the core UI components to bring this PRD to life.