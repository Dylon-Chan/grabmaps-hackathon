import type { GeoJSONSourceSpecification, LayerSpecification } from "maplibre-gl";
import type { RouteLeg } from "@/lib/types";

export const ROUTE_LAYER_ID = "grab-route";

export type RouteForMap = { legs: RouteLeg[] } | null;

type RouteSource = {
  setData: (data: RouteGeoJson) => void;
};

type RouteMap = {
  getLayer: (id: string) => unknown;
  getSource: (id: string) => unknown;
  removeLayer: (id: string) => void;
  removeSource: (id: string) => void;
  addSource: (id: string, source: GeoJSONSourceSpecification) => void;
  addLayer: (layer: LayerSpecification) => void;
};

type RouteGeoJson = {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  properties: Record<string, never>;
};

export function routeToCoordinates(route: RouteForMap): [number, number][] {
  return (
    route?.legs.flatMap((leg) =>
      leg.polyline.map((point) => [point.lng, point.lat] as [number, number])
    ) ?? []
  );
}

function routeToGeoJson(coordinates: [number, number][]): RouteGeoJson {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates },
    properties: {}
  };
}

function isRouteSource(source: unknown): source is RouteSource {
  return (
    typeof source === "object" &&
    source !== null &&
    "setData" in source &&
    typeof source.setData === "function"
  );
}

export function syncRouteLayer(map: RouteMap, route: RouteForMap) {
  const coordinates = routeToCoordinates(route);
  const source = map.getSource(ROUTE_LAYER_ID);
  const routeSource = isRouteSource(source) ? source : undefined;
  const hasLayer = Boolean(map.getLayer(ROUTE_LAYER_ID));

  if (coordinates.length <= 1) {
    if (hasLayer) map.removeLayer(ROUTE_LAYER_ID);
    if (source) map.removeSource(ROUTE_LAYER_ID);
    return;
  }

  const geojson = routeToGeoJson(coordinates);

  if (routeSource) {
    routeSource.setData(geojson);
    return;
  }

  map.addSource(ROUTE_LAYER_ID, { type: "geojson", data: geojson });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_LAYER_ID,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#087f73", "line-width": 3, "line-opacity": 0.9 }
  });
}
