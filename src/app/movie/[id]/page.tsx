import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getDetails } from "@/lib/tmdb";
import { posterUrl } from "@/lib/media";
import { recordWatch } from "@/lib/watchHistory";
import VideoPlayer from "@/components/player/VideoPlayer";

async function loadMovie(id: string) {
  const tmdbId = Number(id);
  if (!Number.isFinite(tmdbId)) return null;
  try {
    return { tmdbId, details: await getDetails("movie", tmdbId) };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const movie = await loadMovie(id);
  return { title: movie ? `${movie.details.title} — Venus` : "Venus" };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await loadMovie(id);
  if (!movie) notFound();
  const { tmdbId, details } = movie;

  await recordWatch("movie", tmdbId);

  const year = details.release_date ? details.release_date.slice(0, 4) : null;
  const cast = details.credits?.cast?.slice(0, 12) ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <VideoPlayer mediaType="movie" tmdbId={tmdbId} />

      <div className="mt-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{details.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          {year && <span>{year}</span>}
          {typeof details.vote_average === "number" && details.vote_average > 0 && (
            <span className="flex items-center gap-1">★ {details.vote_average.toFixed(1)}</span>
          )}
          {details.runtime ? <span>{details.runtime} min</span> : null}
        </div>

        {details.genres && details.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {details.genres.map((g) => (
              <span
                key={g.id}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}

        {details.overview && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base">
            {details.overview}
          </p>
        )}
      </div>

      {cast.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Cast</h2>
          <div className="scrollbar-none flex gap-4 overflow-x-auto pb-2">
            {cast.map((member) => (
              <div key={member.id} className="w-20 flex-none text-center">
                <div className="relative aspect-square w-20 overflow-hidden rounded-full bg-surface">
                  {member.profile_path && (
                    <Image
                      src={posterUrl(member.profile_path, "w185") ?? ""}
                      alt={member.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="mt-1.5 truncate text-xs text-foreground">{member.name}</p>
                <p className="truncate text-[11px] text-muted">{member.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
