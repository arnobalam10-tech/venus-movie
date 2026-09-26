import { createClient } from "@/lib/supabase/server";
import { getDetails, type MediaType } from "@/lib/tmdb";
import { normalize, type MediaItem } from "@/lib/media";
import JumpBackInList from "@/components/rows/JumpBackInList";

interface WatchHistoryRow {
  media_type: MediaType;
  tmdb_id: number;
  season_number: number | null;
  episode_number: number | null;
}

export default async function JumpBackInRow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: history } = await supabase
    .from("watch_history")
    .select("media_type, tmdb_id, season_number, episode_number")
    .eq("user_id", user.id)
    .order("last_watched_at", { ascending: false })
    .limit(10)
    .returns<WatchHistoryRow[]>();

  if (!history || history.length === 0) return null;

  const items = (
    await Promise.all(
      history.map(async (entry): Promise<MediaItem | null> => {
        try {
          const details = await getDetails(entry.media_type, entry.tmdb_id);
          const item = normalize(details, entry.media_type);
          if (
            entry.media_type === "tv" &&
            entry.season_number != null &&
            entry.episode_number != null
          ) {
            item.href = `/tv/${entry.tmdb_id}/${entry.season_number}/${entry.episode_number}`;
          }
          return item;
        } catch {
          return null;
        }
      }),
    )
  ).filter((item): item is MediaItem => item !== null);

  if (items.length === 0) return null;

  return <JumpBackInList initialItems={items} />;
}
