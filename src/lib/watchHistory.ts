import { createClient } from "@/lib/supabase/server";
import type { MediaType } from "@/lib/tmdb";

export async function recordWatch(
  mediaType: MediaType,
  tmdbId: number,
  season?: number,
  episode?: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("watch_history").upsert(
    {
      user_id: user.id,
      media_type: mediaType,
      tmdb_id: tmdbId,
      season_number: season ?? null,
      episode_number: episode ?? null,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: "user_id,media_type,tmdb_id" },
  );
}
