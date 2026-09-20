import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDetails, getSeason } from "@/lib/tmdb";
import SeasonBrowser from "@/components/tv/SeasonBrowser";

async function loadShow(id: string) {
  const tvId = Number(id);
  if (!Number.isFinite(tvId)) return null;
  try {
    return { tvId, details: await getDetails("tv", tvId) };
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
  const show = await loadShow(id);
  return { title: show ? `${show.details.name} — Venus` : "Venus" };
}

export default async function TvPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await loadShow(id);
  if (!show) notFound();
  const { tvId, details } = show;

  const seasons = (details.seasons ?? []).filter((s) => s.episode_count > 0);
  const initialSeason =
    seasons.find((s) => s.season_number > 0)?.season_number ?? seasons[0]?.season_number ?? 1;

  let initialEpisodes: Awaited<ReturnType<typeof getSeason>>["episodes"] = [];
  try {
    const seasonData = await getSeason(tvId, initialSeason);
    initialEpisodes = seasonData.episodes;
  } catch {
    initialEpisodes = [];
  }

  const year = details.first_air_date ? details.first_air_date.slice(0, 4) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{details.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
        {year && <span>{year}</span>}
        {typeof details.vote_average === "number" && details.vote_average > 0 && (
          <span className="flex items-center gap-1">★ {details.vote_average.toFixed(1)}</span>
        )}
        {details.number_of_seasons ? <span>{details.number_of_seasons} seasons</span> : null}
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

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Episodes</h2>
        <SeasonBrowser
          tvId={tvId}
          seasons={seasons}
          initialSeason={initialSeason}
          initialEpisodes={initialEpisodes}
        />
      </div>
    </div>
  );
}
