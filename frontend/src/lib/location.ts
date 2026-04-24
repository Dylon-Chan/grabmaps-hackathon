import type { Coordinates } from "@/lib/types";

export type UserLocation = Coordinates & {
  accuracyMeters?: number;
};

export type LocationState = "not_requested" | "loading" | "granted" | "denied";

export function calculateDistanceMeters(source: Coordinates, target: Coordinates): number {
  const radius = 6_371_000;
  const lat1 = (source.lat * Math.PI) / 180;
  const lat2 = (target.lat * Math.PI) / 180;
  const deltaLat = ((target.lat - source.lat) * Math.PI) / 180;
  const deltaLng = ((target.lng - source.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinUnlockRadius(distanceMeters: number | null, radiusMeters: number): boolean {
  return distanceMeters !== null && distanceMeters <= radiusMeters;
}

export function requestBrowserLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
