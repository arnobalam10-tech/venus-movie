import { discoverByGenre } from "@/lib/tmdb";
import { normalize, interleave, type MediaItem } from "@/lib/media";
import Row from "@/components/Row";
import RowMessage from "@/components/RowMessage";
import type { MergedGenre } from "@/components/rows/GenreRows";

export default async function GenreRow({ genre }: { genre: MergedGenre }) {
  let items: MediaItem[] | null = null;

  try {
    const [movies, tv] = await Promise.all([
      genre.movieId ? discoverByGenre("movie", genre.movieId) : null,
      genre.tvId ? discoverByGenre("tv", genre.tvId) : null,
    ]);
    items = interleave(
      movies ? movies.results.map((r) => normalize(r, "movie")) : [],
      tv ? tv.results.map((r) => normalize(r, "tv")) : [],
    );
  } catch {
    items = null;
  }

  if (items === null) {
    return <RowMessage title={genre.name} message="Couldn't load right now." />;
  }
  if (items.length === 0) return null;
  return <Row title={genre.name} items={items} />;
}
