import PosterCard from "@/components/PosterCard";
import type { MediaItem } from "@/lib/media";

export default function Row({ title, items }: { title: string; items: MediaItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-2">
      <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-6">{title}</h2>
      <div className="scrollbar-none flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
        {items.map((item) => (
          <div key={`${item.mediaType}-${item.id}`} className="w-[140px] flex-none sm:w-[160px]">
            <PosterCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
