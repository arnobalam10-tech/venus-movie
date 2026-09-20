export const VIDSRC_SERVERS = [
  { id: 1, label: "Server 1", domain: "vidsrc.to" },
  { id: 2, label: "Server 2", domain: "vidsrc.me" },
  { id: 3, label: "Server 3", domain: "vidsrc.xyz" },
] as const;

export function vidsrcMovieUrl(domain: string, tmdbId: number | string) {
  return `https://${domain}/embed/movie/${tmdbId}`;
}

export function vidsrcTvUrl(
  domain: string,
  tmdbId: number | string,
  season: number,
  episode: number,
) {
  return `https://${domain}/embed/tv/${tmdbId}/${season}/${episode}`;
}
