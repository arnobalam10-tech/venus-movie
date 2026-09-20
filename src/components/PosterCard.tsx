import Image from "next/image";
import Link from "next/link";
import { type MediaItem, posterUrl, detailHref } from "@/lib/media";

export default function PosterCard({
  item,
  sizes = "(min-width: 768px) 160px, 45vw",
}: {
  item: MediaItem;
  sizes?: string;
}) {
  const href = item.href ?? detailHref(item.mediaType, item.id);
  const src = posterUrl(item.posterPath);

  return (
    <Link href={href} className="group block w-full">
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg bg-surface transition-transform duration-200 group-hover:scale-105">
        {src ? (
          <Image src={src} alt={item.title} fill sizes={sizes} className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted">
            {item.title}
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
          {item.mediaType === "movie" ? "Movie" : "TV"}
        </span>
      </div>
      <p className="mt-1.5 truncate text-xs text-foreground">{item.title}</p>
    </Link>
  );
}
