"use client";

import { useEffect, useState } from "react";
import type { MediaType } from "@/lib/tmdb";

interface Props {
  mediaType: MediaType;
  tmdbId: number;
  season?: number;
  episode?: number;
}

export default function CastToTvButton({ mediaType, tmdbId, season, episode }: Props) {
  const [paired, setPaired] = useState(false);
  const [status, setStatus] = useState<"idle" | "casting" | "sent" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tv/status")
      .then((res) => (res.ok ? res.json() : { paired: false }))
      .then((data) => {
        if (!cancelled) setPaired(!!data.paired);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!paired) return null;

  async function handleCast() {
    setStatus("casting");
    try {
      const res = await fetch("/api/tv/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, tmdbId, season, episode }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCast}
      disabled={status === "casting"}
      title={status === "error" ? "Couldn't cast — try again" : "Cast to TV"}
      aria-label="Cast to TV"
      className="absolute right-3 top-3 z-20 rounded-md bg-black/70 p-2 text-white opacity-80 transition-opacity hover:opacity-100 disabled:opacity-50"
    >
      {status === "sent" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M2 9a9 9 0 0 1 9 9" />
          <path d="M2 4a14 14 0 0 1 14 14" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )}
    </button>
  );
}
