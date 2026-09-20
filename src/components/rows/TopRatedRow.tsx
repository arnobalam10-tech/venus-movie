import { getTopRated } from "@/lib/tmdb";
import { normalize, interleave, type MediaItem } from "@/lib/media";
import Row from "@/components/Row";
import RowMessage from "@/components/RowMessage";

export default async function TopRatedRow() {
  let items: MediaItem[] | null = null;

  try {
    const [movies, tv] = await Promise.all([getTopRated("movie"), getTopRated("tv")]);
    items = interleave(
      movies.results.map((r) => normalize(r, "movie")),
      tv.results.map((r) => normalize(r, "tv")),
    );
  } catch {
    items = null;
  }

  if (items === null) {
    return <RowMessage title="Top Rated" message="Couldn't load right now." />;
  }
  if (items.length === 0) {
    return <RowMessage title="Top Rated" message="Nothing to show right now." />;
  }
  return <Row title="Top Rated" items={items} />;
}
