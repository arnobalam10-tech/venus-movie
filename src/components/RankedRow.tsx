import RankedPosterCard from "@/components/RankedPosterCard";
import type { MediaItem } from "@/lib/media";

export default function RankedRow({ title, items }: { title: string; items: MediaItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-2">
      <h2 className="mb-3 px-4 text-lg font-semibold text-foreground sm:px-6">{title}</h2>
      <div className="scrollbar-none flex gap-4 overflow-x-auto px-6 pb-2 sm:px-8">
        {items.map((item, i) => (
          <RankedPosterCard key={`${item.mediaType}-${item.id}`} rank={i + 1} item={item} />
        ))}
      </div>
    </section>
  );
}
