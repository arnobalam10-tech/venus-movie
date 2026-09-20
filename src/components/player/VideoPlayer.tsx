"use client";

import { useEffect, useRef, useState } from "react";
import { VIDSRC_SERVERS, vidsrcMovieUrl, vidsrcTvUrl } from "@/lib/vidsrc";
import type { MediaType } from "@/lib/tmdb";

interface Props {
  mediaType: MediaType;
  tmdbId: number;
  season?: number;
  episode?: number;
}

const LOAD_TIMEOUT_MS = 12000;

export default function VideoPlayer({ mediaType, tmdbId, season, episode }: Props) {
  const [serverIndex, setServerIndex] = useState(0);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const readyRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const server = VIDSRC_SERVERS[serverIndex];
  const src =
    mediaType === "movie"
      ? vidsrcMovieUrl(server.domain, tmdbId)
      : vidsrcTvUrl(server.domain, tmdbId, season ?? 1, episode ?? 1);

  const status: "loading" | "ready" | "failed" =
    readyFor === src ? "ready" : failedFor === src ? "failed" : "loading";

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (readyRef.current !== src) {
        setFailedFor(src);
      }
    }, LOAD_TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [src]);

  function handleLoad() {
    readyRef.current = src;
    setReadyFor(src);
  }

  function handleError() {
    setFailedFor(src);
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface">
        {status === "failed" ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium text-foreground">Stream currently unavailable</p>
            <p className="text-xs text-muted">
              {server.label} didn&apos;t respond. Try another server below.
            </p>
          </div>
        ) : (
          <>
            {status === "loading" && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
              </div>
            )}
            <iframe
              key={src}
              src={src}
              title="Video player"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
              className="h-full w-full"
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {VIDSRC_SERVERS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setServerIndex(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              i === serverIndex
                ? "bg-gradient-to-r from-accent to-accent-2 text-white"
                : "border border-white/10 bg-surface text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
