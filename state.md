# State — Venus

Live progress log. Updated after every response. Newest entry on top.

---

### 2026-09-21 — Netflix-style Top 10 rows, default server swap, mobile investigation
**Context:** three requests from the user: (1) swap the default VidSrc server since "server 2 is better", (2) add curated sections like "Netflix top 10", (3) mobile UI "not fitting and not sticky".

**Done:**
1. **Default server swapped:** reordered `VIDSRC_SERVERS` in [src/lib/vidsrc.ts](../src/lib/vidsrc.ts) — `vidsrc.me` is now "Server 1" (default, auto-loaded), `vidsrc.to` is "Server 2", `vidsrc.xyz` stays "Server 3". Verified live: default iframe src is `vidsrc.me`, plays Inception cleanly with no ad overlay (unlike the old default which had one).
2. **Netflix-style "Top 10" rows added:**
   - [RankedPosterCard.tsx](../src/components/RankedPosterCard.tsx) — poster with a large translucent rank numeral overlapping its left edge.
   - [RankedRow.tsx](../src/components/RankedRow.tsx) — horizontal row wrapper for ranked items.
   - [TopTenMoviesRow.tsx](../src/components/rows/TopTenMoviesRow.tsx) / [TopTenShowsRow.tsx](../src/components/rows/TopTenShowsRow.tsx) — TMDB daily trending (`getTrending(type, "day")`) sliced to 10, one row each for movies and TV.
   - Wired into `src/app/page.tsx` right after "Trending Now", each independently Suspense-streamed like every other row.
   - Verified live: both rows render with real data and large numeral badges (1, 2, 3...) correctly overlapping poster edges.
3. **Mobile "not fitting / not sticky" — investigated thoroughly, couldn't reproduce a concrete bug:**
   - Tested emulated 320px and 375px viewports across home, movie, TV, search, and admin pages on the live production site.
   - No horizontal overflow anywhere (`scrollWidth` matched viewport width on every page checked).
   - Viewport meta tag correctly set (`width=device-width, initial-scale=1`), not the classic missing-meta-tag cause.
   - `position: sticky` on the header verified working via direct DOM inspection (stayed pinned at `top: 0` through a 9975px scroll on the home page).
   - As a safe, worthwhile improvement regardless: bumped the header's background from `bg-background/80` to `bg-background/95` and added a shadow, so the sticky effect is visually unmistakable even over busy hero imagery (the old translucency may have made it *look* like it wasn't sticking, even though technically it was).
   - Flagged to the user (not yet resolved with certainty) that if this persists, it's likely either a real device-specific quirk we can't emulate, or about the third-party VidSrc iframe's own embedded UI, which is outside our control.
4. Updated `PRD.md` (§2 scope table: server swap + new Top 10 rows entry; §7 home page row list) and `plan.md` (Phase 6 server swap note, Phase 4 Top 10 rows note, Phase 8 mobile investigation writeup).
5. `npm run lint` and `npm run build` clean throughout.

**Not started yet:**
- Awaiting user confirmation on whether the mobile issue is resolved, or a screenshot/specific repro so it can be pinpointed further.
- Phase 11 (network/IP lockdown) remains deliberately deferred.

**Next step:**
- Commit and push these three changes, then check with the user on the mobile issue once they've had a chance to look at the live site again.
