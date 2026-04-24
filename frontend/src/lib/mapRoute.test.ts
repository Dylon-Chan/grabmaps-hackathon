import { describe, expect, it, vi } from "vitest";
import { routeToCoordinates, syncRouteLayer } from "@/lib/mapRoute";
import type { RouteLeg } from "@/lib/types";

function leg(polyline: RouteLeg["polyline"]): RouteLeg {
  return {
    fromStopId: "a",
    toStopId: "b",
    minutes: 5,
    distanceMeters: 100,
    polyline
  };
}

describe("map route helpers", () => {
  it("converts route points to MapLibre lng/lat coordinates", () => {
    expect(
      routeToCoordinates({
        legs: [
          leg([
            { lat: 1.28, lng: 103.84 },
            { lat: 1.29, lng: 103.85 }
          ])
        ]
      })
    ).toEqual([
      [103.84, 1.28],
      [103.85, 1.29]
    ]);
  });

  it("removes the existing route layer when there is no current route", () => {
    const source = { setData: vi.fn() };
    const map = {
      getLayer: vi.fn(() => ({ id: "grab-route" })),
      getSource: vi.fn(() => source),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn()
    };

    syncRouteLayer(map, null);

    expect(map.removeLayer).toHaveBeenCalledWith("grab-route");
    expect(map.removeSource).toHaveBeenCalledWith("grab-route");
    expect(source.setData).not.toHaveBeenCalled();
    expect(map.addSource).not.toHaveBeenCalled();
  });

  it("updates an existing route source instead of adding duplicate layers", () => {
    const source = { setData: vi.fn() };
    const map = {
      getLayer: vi.fn(() => ({ id: "grab-route" })),
      getSource: vi.fn(() => source),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn()
    };

    syncRouteLayer(
      map,
      {
        legs: [
          leg([
            { lat: 1.28, lng: 103.84 },
            { lat: 1.29, lng: 103.85 }
          ])
        ]
      }
    );

    expect(source.setData).toHaveBeenCalledWith({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [103.84, 1.28],
          [103.85, 1.29]
        ]
      },
      properties: {}
    });
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
});
