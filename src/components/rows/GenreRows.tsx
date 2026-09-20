import { Suspense } from "react";
import { getGenres } from "@/lib/tmdb";
import RowSkeleton from "@/components/RowSkeleton";
import GenreRow from "@/components/rows/GenreRow";

export interface MergedGenre {
  name: string;
  movieId?: number;
  tvId?: number;
}

export default async function GenreRows() {
  let merged: MergedGenre[] = [];

  try {
    const [movieGenres, tvGenres] = await Promise.all([getGenres("movie"), getGenres("tv")]);

    const byName = new Map<string, MergedGenre>();
    for (const g of movieGenres.genres) {
      byName.set(g.name, { name: g.name, movieId: g.id });
    }
    for (const g of tvGenres.genres) {
      const existing = byName.get(g.name);
      if (existing) {
        existing.tvId = g.id;
      } else {
        byName.set(g.name, { name: g.name, tvId: g.id });
      }
    }
    merged = Array.from(byName.values());
  } catch {
    return null;
  }

  return (
    <>
      {merged.map((genre) => (
        <Suspense key={genre.name} fallback={<RowSkeleton title={genre.name} />}>
          <GenreRow genre={genre} />
        </Suspense>
      ))}
    </>
  );
}
