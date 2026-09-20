"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { posterUrl } from "@/lib/media";
import type { TmdbEpisode } from "@/lib/tmdb";

interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
}

interface FetchedSeason {
  season: number;
  episodes: TmdbEpisode[];
}

export default function SeasonBrowser({
  tvId,
  seasons,
  initialSeason,
  initialEpisodes,
}: {
  tvId: number;
  seasons: Season[];
  initialSeason: number;
  initialEpisodes: TmdbEpisode[];
}) {
  const [selected, setSelected] = useState(initialSeason);
  const [fetched, setFetched] = useState<FetchedSeason | null>(null);

  useEffect(() => {
    if (selected === initialSeason) return;

    let cancelled = false;

    fetch(`/api/tv/${tvId}/season/${selected}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setFetched({ season: selected, episodes: data.episodes ?? [] });
      })
      .catch(() => {
        if (!cancelled) setFetched({ season: selected, episodes: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [selected, tvId, initialSeason]);

  if (seasons.length === 0) {
    return <p className="text-sm text-muted">No season data available.</p>;
  }

  const episodes =
    selected === initialSeason
      ? initialEpisodes
      : fetched?.season === selected
        ? fetched.episodes
        : null;
  const loading = episodes === null;

  return (
    <div>
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
        {seasons.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s.season_number)}
            className={`flex-none rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selected === s.season_number
                ? "bg-gradient-to-r from-accent to-accent-2 text-white"
                : "border border-white/10 bg-surface text-muted hover:text-foreground"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />
          ))}

        {!loading &&
          episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/tv/${tvId}/${selected}/${ep.episode_number}`}
              className="flex gap-3 rounded-lg border border-white/5 bg-surface p-2 transition-colors hover:border-white/20"
            >
              <div className="relative aspect-video w-32 flex-none overflow-hidden rounded bg-background sm:w-40">
                {ep.still_path && (
                  <Image
                    src={posterUrl(ep.still_path, "w342") ?? ""}
                    alt={ep.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {ep.episode_number}. {ep.name}
                </p>
                {ep.air_date && <p className="text-xs text-muted">{ep.air_date}</p>}
                {ep.overview && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{ep.overview}</p>
                )}
              </div>
            </Link>
          ))}

        {!loading && episodes.length === 0 && (
          <p className="text-sm text-muted">No episodes found for this season.</p>
        )}
      </div>
    </div>
  );
}
