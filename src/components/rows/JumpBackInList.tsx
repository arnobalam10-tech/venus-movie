"use client";

import { useState } from "react";
import PosterCard from "@/components/PosterCard";
import type { MediaItem } from "@/lib/media";

export default function JumpBackInList({ initialItems }: { initialItems: MediaItem[] }) {
  const [items, setItems] = useState(initialItems);

  if (items.length === 0) return null;

  function handleRemove(item: MediaItem) {
    setItems((prev) => prev.filter((i) => !(i.id === item.id && i.mediaType === item.mediaType)));
    fetch("/api/watch-history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaType: item.mediaType, tmdbId: item.id }),
    }).catch(() => {});
  }

  return (
    <section className="py-2">
      <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-6">Jump Back In</h2>
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {items.map((item) => (
          <div key={`${item.mediaType}-${item.id}`} className="relative w-[140px] flex-none sm:w-[160px]">
            <button
              type="button"
              onClick={() => handleRemove(item)}
              aria-label={`Remove ${item.title} from Continue Watching`}
              className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <PosterCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
