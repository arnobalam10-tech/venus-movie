import type { MediaType } from "@/lib/tmdb";

export function validateMediaType(value: string): value is MediaType {
  return value === "movie" || value === "tv";
}
