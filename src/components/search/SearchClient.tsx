"use client";

import { useEffect, useState } from "react";
import PosterCard from "@/components/PosterCard";
import { normalize, type MediaItem } from "@/lib/media";
import type { TmdbListResponse } from "@/lib/tmdb";

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState(false);
  const [resultsFor, setResultsFor] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;

    let cancelled = false;

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json() as Promise<TmdbListResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        const results = data.results
          .filter((r) => r.media_type === "movie" || r.media_type === "tv")
          .map((r) => normalize(r));
        setItems(results);
        setError(false);
        setResultsFor(debouncedQuery);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setError(true);
          setResultsFor(debouncedQuery);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const isSearching = debouncedQuery !== "";
  const isLoading = isSearching && resultsFor !== debouncedQuery;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies & TV shows..."
        autoFocus
        className="w-full rounded-full border border-white/10 bg-surface px-5 py-3 text-sm text-foreground outline-none focus:border-accent sm:text-base"
      />

      <div className="mt-8">
        {!isSearching && (
          <p className="text-sm text-muted">Start typing to search movies and TV shows.</p>
        )}

        {isSearching && isLoading && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-2/3 animate-pulse rounded-lg bg-surface" />
            ))}
          </div>
        )}

        {isSearching && !isLoading && error && (
          <p className="text-sm text-muted">Search failed. Try again in a moment.</p>
        )}

        {isSearching && !isLoading && !error && items.length === 0 && (
          <p className="text-sm text-muted">No results for &quot;{debouncedQuery}&quot;.</p>
        )}

        {isSearching && !isLoading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 md:grid-cols-6">
            {items.map((item) => (
              <PosterCard key={`${item.mediaType}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
