import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDetails, getSeason } from "@/lib/tmdb";
import { recordWatch } from "@/lib/watchHistory";
import VideoPlayer from "@/components/player/VideoPlayer";

async function loadEpisode(id: string, season: string, episode: string) {
  const tvId = Number(id);
  const seasonNumber = Number(season);
  const episodeNumber = Number(episode);

  if (![tvId, seasonNumber, episodeNumber].every(Number.isFinite)) return null;

  try {
    const [details, seasonData] = await Promise.all([
      getDetails("tv", tvId),
      getSeason(tvId, seasonNumber),
    ]);
    return { tvId, seasonNumber, episodeNumber, details, episodes: seasonData.episodes };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; season: string; episode: string }>;
}): Promise<Metadata> {
  const { id, season, episode } = await params;
  const data = await loadEpisode(id, season, episode);
  return { title: data ? `${data.details.name} — Venus` : "Venus" };
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ id: string; season: string; episode: string }>;
}) {
  const { id, season, episode } = await params;
  const data = await loadEpisode(id, season, episode);
  if (!data) notFound();
  const { tvId, seasonNumber, episodeNumber, details, episodes } = data;

  await recordWatch("tv", tvId, seasonNumber, episodeNumber);

  const currentIndex = episodes.findIndex((ep) => ep.episode_number === episodeNumber);
  const currentEpisode = currentIndex >= 0 ? episodes[currentIndex] : null;
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex >= 0 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <VideoPlayer mediaType="tv" tmdbId={tvId} season={seasonNumber} episode={episodeNumber} />

      <div className="mt-6 flex items-center justify-between gap-3">
        {prevEpisode ? (
          <Link
            href={`/tv/${tvId}/${seasonNumber}/${prevEpisode.episode_number}`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-foreground hover:border-white/30"
          >
            ← Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-white/5 px-4 py-2 text-sm font-medium text-muted/40">
            ← Previous
          </span>
        )}

        <Link href={`/tv/${tvId}`} className="text-sm text-muted hover:text-foreground">
          {details.name}
        </Link>

        {nextEpisode ? (
          <Link
            href={`/tv/${tvId}/${seasonNumber}/${nextEpisode.episode_number}`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-foreground hover:border-white/30"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded-lg border border-white/5 px-4 py-2 text-sm font-medium text-muted/40">
            Next →
          </span>
        )}
      </div>

      <div className="mt-6">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {seasonNumber}x{episodeNumber}
          {currentEpisode ? ` · ${currentEpisode.name}` : ""}
        </h1>
        {currentEpisode?.air_date && (
          <p className="mt-1 text-sm text-muted">{currentEpisode.air_date}</p>
        )}
        {currentEpisode?.overview && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/90 sm:text-base">
            {currentEpisode.overview}
          </p>
        )}
      </div>
    </div>
  );
}
