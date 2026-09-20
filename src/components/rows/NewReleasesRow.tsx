import { getNewReleases } from "@/lib/tmdb";
import { normalize, interleave, type MediaItem } from "@/lib/media";
import Row from "@/components/Row";
import RowMessage from "@/components/RowMessage";

export default async function NewReleasesRow() {
  let items: MediaItem[] | null = null;

  try {
    const [movies, tv] = await Promise.all([getNewReleases("movie"), getNewReleases("tv")]);
    items = interleave(
      movies.results.map((r) => normalize(r, "movie")),
      tv.results.map((r) => normalize(r, "tv")),
    );
  } catch {
    items = null;
  }

  if (items === null) {
    return <RowMessage title="New Releases" message="Couldn't load right now." />;
  }
  if (items.length === 0) {
    return <RowMessage title="New Releases" message="Nothing new right now." />;
  }
  return <Row title="New Releases" items={items} />;
}
