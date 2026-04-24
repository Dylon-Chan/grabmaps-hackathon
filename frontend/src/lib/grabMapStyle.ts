type MapStyleLike = {
  sources?: Record<string, unknown>;
  [key: string]: unknown;
};

type TileSourceLike = {
  tiles?: unknown;
  [key: string]: unknown;
};

export function styleWithApiBaseUrl<TStyle extends MapStyleLike>(style: TStyle, apiBaseUrl: string): TStyle {
  const base = apiBaseUrl.replace(/\/$/, "");
  const sources = Object.fromEntries(
    Object.entries(style.sources ?? {}).map(([id, source]) => {
      if (!isTileSource(source)) return [id, source];
      return [
        id,
        {
          ...source,
          tiles: source.tiles.map((tile) => prefixBackendUrl(tile, base)),
        },
      ];
    })
  );

  return { ...style, sources };
}

function isTileSource(source: unknown): source is TileSourceLike & { tiles: string[] } {
  return (
    typeof source === "object" &&
    source !== null &&
    "tiles" in source &&
    Array.isArray(source.tiles)
  );
}

function prefixBackendUrl(url: string, apiBaseUrl: string): string {
  if (url.startsWith("/api/")) return `${apiBaseUrl}${url}`;
  return url;
}
