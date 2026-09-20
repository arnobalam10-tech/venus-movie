import { verifyViewToken } from "@/lib/tvToken";
import VideoPlayer from "@/components/player/VideoPlayer";

export default async function TvEmbedEpisodePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; season: string; episode: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id, season, episode } = await params;
  const { token } = await searchParams;
  const tmdbId = Number(id);
  const seasonNumber = Number(season);
  const episodeNumber = Number(episode);

  const payload = token ? verifyViewToken(token) : null;
  const isValid =
    payload &&
    payload.mediaType === "tv" &&
    payload.tmdbId === tmdbId &&
    payload.season === seasonNumber &&
    payload.episode === episodeNumber;

  if (!isValid) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <p className="text-sm text-muted">This cast link has expired.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-6">
      <div className="w-full max-w-6xl">
        <VideoPlayer
          mediaType="tv"
          tmdbId={tmdbId}
          season={seasonNumber}
          episode={episodeNumber}
          showCastButton={false}
        />
      </div>
    </div>
  );
}
