import type { MediaType, TmdbListItem } from "@/lib/tmdb";

export interface MediaItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  year: string;
  voteAverage: number;
  href?: string;
}

const IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function backdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

export function normalize(raw: TmdbListItem, fallbackType?: MediaType): MediaItem {
  const mediaType = (raw.media_type === "movie" || raw.media_type === "tv"
    ? raw.media_type
    : fallbackType) as MediaType;
  const date = raw.release_date || raw.first_air_date || "";

  return {
    id: raw.id,
    mediaType,
    title: raw.title || raw.name || "Untitled",
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    overview: raw.overview ?? "",
    year: date ? date.slice(0, 4) : "",
    voteAverage: raw.vote_average ?? 0,
  };
}

export function interleave(a: MediaItem[], b: MediaItem[]): MediaItem[] {
  const result: MediaItem[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i]) result.push(a[i]);
    if (b[i]) result.push(b[i]);
  }
  return result;
}

export function detailHref(mediaType: MediaType, id: number) {
  return mediaType === "movie" ? `/movie/${id}` : `/tv/${id}`;
}
