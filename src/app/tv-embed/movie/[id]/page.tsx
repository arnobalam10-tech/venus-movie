import { verifyViewToken } from "@/lib/tvToken";
import VideoPlayer from "@/components/player/VideoPlayer";

export default async function TvEmbedMoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const tmdbId = Number(id);

  const payload = token ? verifyViewToken(token) : null;
  const isValid = payload && payload.mediaType === "movie" && payload.tmdbId === tmdbId;

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
        <VideoPlayer mediaType="movie" tmdbId={tmdbId} showCastButton={false} />
      </div>
    </div>
  );
}
