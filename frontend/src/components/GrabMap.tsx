"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { styleWithApiBaseUrl } from "@/lib/grabMapStyle";
import { syncRouteLayer, type RouteForMap } from "@/lib/mapRoute";
import type { City, QuestStop } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function GrabMap({
  city,
  stops,
  activeStopId,
  route,
  onStopSelect,
}: {
  city: City;
  stops: QuestStop[];
  activeStopId: string;
  route: RouteForMap;
  onStopSelect?: (stopId: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const latestCityRef = useRef(city);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    latestCityRef.current = city;
  }, [city]);

  // Initialise the map once; marker fit-bounds handles city and quest changes.
  useEffect(() => {
    if (!containerRef.current) return;
    let map: maplibregl.Map;
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/map/style`)
      .then((res) => (res.ok ? res.json() : { style: null }))
      .then(({ style }: { style: maplibregl.StyleSpecification | null }) => {
        if (cancelled || !containerRef.current) return;
        const currentCity = latestCityRef.current;
        map = new maplibregl.Map({
          container: containerRef.current,
          style: style ? styleWithApiBaseUrl(style, API_BASE_URL) : "https://demotiles.maplibre.org/style.json",
          center: [currentCity.center.lng, currentCity.center.lat],
          zoom: currentCity.zoom,
          attributionControl: false,
        });
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-left");
        mapRef.current = map;
        map.on("load", () => {
          if (!cancelled) setMapLoaded(true);
        });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      setMapLoaded(false);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      // map may still be initialising — capture via ref
      const existing = mapRef.current;
      if (existing) {
        existing.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Rebuild markers and fit bounds whenever the stop set changes (quest switch).
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = stops.map((stop, index) => {
      const el = document.createElement("div");
      el.className = stop.id === activeStopId ? "mapPin active" : "mapPin";
      el.innerHTML = `<span>${index + 1}</span>`;
      el.style.cursor = "pointer";
      el.addEventListener("click", (e) => { e.stopPropagation(); onStopSelect?.(stop.id); });
      return new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .addTo(map);
    });

    if (stops.length > 0) {
      const bounds = stops.reduce(
        (b, stop) => b.extend([stop.coordinates.lng, stop.coordinates.lat]),
        new maplibregl.LngLatBounds(
          [stops[0].coordinates.lng, stops[0].coordinates.lat],
          [stops[0].coordinates.lng, stops[0].coordinates.lat]
        )
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 600 });
    }
  }, [mapLoaded, stops]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update active marker highlight whenever the selected stop changes.
  useEffect(() => {
    markersRef.current.forEach((marker, index) => {
      const el = marker.getElement();
      el.className = stops[index]?.id === activeStopId ? "mapPin active" : "mapPin";
    });
  }, [activeStopId, stops]);

  // Draw (or update) the route polyline whenever the route data or map-ready state changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;
    syncRouteLayer(map, route);
  }, [mapLoaded, route]);

  // Outer div keeps position:absolute;inset:0 so it fills .mapStage.
  // MapLibre forces position:relative on whatever element it receives, so we
  // hand it the inner div — that way the outer wrapper is never overridden.
  return (
    <div ref={wrapperRef} className="grabMap">
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
