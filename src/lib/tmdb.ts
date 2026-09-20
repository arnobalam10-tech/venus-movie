const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type MediaType = "movie" | "tv";

export interface TmdbListItem {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export interface TmdbListResponse {
  page: number;
  results: TmdbListItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbDetails extends TmdbListItem {
  genres?: TmdbGenre[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
  }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
}

async function tmdbFetch<T>(path: string, revalidate = 3600): Promise<T> {
  const res = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}`,
      accept: "application/json",
    },
    next: revalidate > 0 ? { revalidate } : undefined,
    cache: revalidate > 0 ? undefined : "no-store",
  });

  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

export function getGenres(mediaType: MediaType) {
  return tmdbFetch<{ genres: TmdbGenre[] }>(`/genre/${mediaType}/list`, 86400);
}

export function getTrending(mediaType: MediaType, window: "day" | "week" = "week") {
  return tmdbFetch<TmdbListResponse>(`/trending/${mediaType}/${window}`, 3600);
}

export function getTrendingAll(window: "day" | "week" = "week") {
  return tmdbFetch<TmdbListResponse>(`/trending/all/${window}`, 3600);
}

export function getTopRated(mediaType: MediaType, page = 1) {
  return tmdbFetch<TmdbListResponse>(`/${mediaType}/top_rated?page=${page}`, 3600);
}

export function getNewReleases(mediaType: MediaType, page = 1) {
  const path = mediaType === "movie" ? "/movie/now_playing" : "/tv/on_the_air";
  return tmdbFetch<TmdbListResponse>(`${path}?page=${page}`, 3600);
}

export function discoverByGenre(mediaType: MediaType, genreId: number, page = 1) {
  return tmdbFetch<TmdbListResponse>(
    `/discover/${mediaType}?with_genres=${genreId}&page=${page}&sort_by=popularity.desc`,
    3600,
  );
}

export function searchMulti(query: string, page = 1) {
  return tmdbFetch<TmdbListResponse>(
    `/search/multi?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    0,
  );
}

export function getDetails(mediaType: MediaType, id: string | number) {
  return tmdbFetch<TmdbDetails>(`/${mediaType}/${id}?append_to_response=credits`, 3600);
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average?: number;
}

export function getSeason(tvId: string | number, seasonNumber: number) {
  return tmdbFetch<{ episodes: TmdbEpisode[] }>(`/tv/${tvId}/season/${seasonNumber}`, 3600);
}
