import Image from "next/image";
import Link from "next/link";
import { getTrendingAll } from "@/lib/tmdb";
import { normalize, backdropUrl, detailHref, type MediaItem } from "@/lib/media";

export default async function Hero() {
  let item: MediaItem | null = null;

  try {
    const data = await getTrendingAll();
    const raw = data.results.find(
      (r) => (r.media_type === "movie" || r.media_type === "tv") && r.backdrop_path,
    );
    item = raw ? normalize(raw) : null;
  } catch {
    item = null;
  }

  if (!item) return null;

  const backdrop = backdropUrl(item.backdropPath, "original");
  const href = detailHref(item.mediaType, item.id);

  return (
    <section className="relative h-[55vh] min-h-[360px] w-full overflow-hidden sm:h-[65vh]">
      {backdrop && (
        <Image src={backdrop} alt="" fill priority sizes="100vw" className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/10 to-transparent" />

      <div className="relative flex h-full flex-col justify-end gap-4 px-4 pb-10 sm:px-6 sm:pb-14">
        <span className="w-fit rounded bg-black/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          {item.mediaType === "movie" ? "Movie" : "TV Show"}
        </span>
        <h1 className="max-w-xl text-3xl font-bold text-foreground drop-shadow sm:text-5xl">
          {item.title}
        </h1>
        {item.overview && (
          <p className="line-clamp-3 max-w-lg text-sm text-muted sm:text-base">
            {item.overview}
          </p>
        )}
        <div className="flex gap-3 pt-2">
          <Link
            href={href}
            className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            ▶ Play
          </Link>
          <Link
            href={href}
            className="rounded-lg border border-white/20 bg-black/40 px-6 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-black/60"
          >
            More Info
          </Link>
        </div>
      </div>
    </section>
  );
}
