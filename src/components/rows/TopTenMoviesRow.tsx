import { getTrending } from "@/lib/tmdb";
import { normalize, type MediaItem } from "@/lib/media";
import RankedRow from "@/components/RankedRow";
import RowMessage from "@/components/RowMessage";

export default async function TopTenMoviesRow() {
  let items: MediaItem[] | null = null;

  try {
    const data = await getTrending("movie", "day");
    items = data.results.slice(0, 10).map((r) => normalize(r, "movie"));
  } catch {
    items = null;
  }

  if (items === null) {
    return <RowMessage title="Top 10 Movies Today" message="Couldn't load right now." />;
  }
  if (items.length === 0) return null;
  return <RankedRow title="Top 10 Movies Today" items={items} />;
}
