import type { Coordinates, QuestStop, RouteLeg } from "./types";

const WALK_METERS_PER_MINUTE = 78;

export function getWalkingMinutes(from: QuestStop, to: QuestStop) {
  if (from.walkMinutesToNext) return from.walkMinutesToNext;
  return Math.max(4, Math.round(distanceMeters(from.coordinates, to.coordinates) / WALK_METERS_PER_MINUTE));
}

export function buildRouteLegs(stops: QuestStop[]): RouteLeg[] {
  return stops.slice(0, -1).map((from, index) => {
    const to = stops[index + 1];
    const minutes = getWalkingMinutes(from, to);
    return {
      fromStopId: from.id,
      toStopId: to.id,
      minutes,
      distanceMeters: Math.round(minutes * WALK_METERS_PER_MINUTE),
      polyline: interpolatePolyline(from.coordinates, to.coordinates)
    };
  });
}

export function routeTotals(stops: QuestStop[]) {
  const stopMinutes = stops.reduce((total, stop) => total + stop.visitMinutes, 0);
  const walkMinutes = buildRouteLegs(stops).reduce((total, leg) => total + leg.minutes, 0);
  return {
    stopMinutes,
    walkMinutes,
    totalMinutes: stopMinutes + walkMinutes
  };
}

export function distanceMeters(from: Coordinates, to: Coordinates) {
  const radius = 6371000;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function interpolatePolyline(from: Coordinates, to: Coordinates): Coordinates[] {
  const midpoint = {
    lat: (from.lat + to.lat) / 2 + 0.0005,
    lng: (from.lng + to.lng) / 2 - 0.0004
  };
  return [from, midpoint, to];
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

