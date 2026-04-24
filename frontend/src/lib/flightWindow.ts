export const ESTIMATED_AIRPORT_ROUTE_MINS = 45;

export type LayoverSafetyStatus = {
  status: "past" | "airport_first" | "short" | "plenty";
  label: string;
  color: string;
  description: string;
};

export function calculateTimeUntilFlight(flightDateTime: string, now = new Date()): number {
  return Math.round((new Date(flightDateTime).getTime() - now.getTime()) / 60000);
}

export function calculateAirportArrivalTime(flightDateTime: string, airportBufferMinutes: number): Date {
  return new Date(new Date(flightDateTime).getTime() - airportBufferMinutes * 60000);
}

export function calculateSafeExplorationWindow(
  flightDateTime: string,
  airportBufferMinutes: number,
  estimatedAirportRouteMinutes = ESTIMATED_AIRPORT_ROUTE_MINS,
  now = new Date()
): number {
  return calculateTimeUntilFlight(flightDateTime, now) - airportBufferMinutes - estimatedAirportRouteMinutes;
}

export function getLayoverSafetyStatus(safeExplorationWindowMinutes: number): LayoverSafetyStatus {
  if (safeExplorationWindowMinutes < 0) {
    return {
      status: "past",
      label: "Flight has passed",
      color: "#f57c30",
      description: "Choose a future departure time."
    };
  }

  if (safeExplorationWindowMinutes < 180) {
    return {
      status: "airport_first",
      label: "Airport-first mode",
      color: "#f57c30",
      description: "Very short window. Quick quests only."
    };
  }

  if (safeExplorationWindowMinutes < 480) {
    return {
      status: "short",
      label: "Short layover",
      color: "#f0bc42",
      description: "Two to four hour quests recommended."
    };
  }

  return {
    status: "plenty",
    label: "Plenty of time",
    color: "#2ecb82",
    description: "All quests available."
  };
}

export function formatMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.round(minutes));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
