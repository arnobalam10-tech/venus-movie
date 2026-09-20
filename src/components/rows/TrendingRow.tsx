import { getTrendingAll } from "@/lib/tmdb";
import { normalize, type MediaItem } from "@/lib/media";
import Row from "@/components/Row";
import RowMessage from "@/components/RowMessage";

export default async function TrendingRow() {
  let items: MediaItem[] | null = null;

  try {
    const data = await getTrendingAll();
    items = data.results
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .map((r) => normalize(r));
  } catch {
    items = null;
  }

  if (items === null) {
    return <RowMessage title="Trending Now" message="Couldn't load right now." />;
  }
  if (items.length === 0) {
    return <RowMessage title="Trending Now" message="Nothing trending right now." />;
  }
  return <Row title="Trending Now" items={items} />;
}
