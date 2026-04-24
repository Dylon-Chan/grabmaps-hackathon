import { describe, expect, it } from "vitest";
import {
  calculateAirportArrivalTime,
  calculateSafeExplorationWindow,
  calculateTimeUntilFlight,
  getLayoverSafetyStatus
} from "@/lib/flightWindow";

const now = new Date("2026-04-24T08:00:00.000Z");

describe("flight window helpers", () => {
  it("calculates minutes until a future flight", () => {
    expect(calculateTimeUntilFlight("2026-04-24T13:30:00.000Z", now)).toBe(330);
  });

  it("calculates the airport arrival deadline", () => {
    expect(calculateAirportArrivalTime("2026-04-24T13:30:00.000Z", 120).toISOString()).toBe(
      "2026-04-24T11:30:00.000Z"
    );
  });

  it("subtracts airport buffer and route time from the safe exploration window", () => {
    expect(calculateSafeExplorationWindow("2026-04-24T13:30:00.000Z", 120, 45, now)).toBe(165);
  });

  it("labels very short windows as airport-first mode", () => {
    expect(getLayoverSafetyStatus(90)).toMatchObject({
      status: "airport_first",
      label: "Airport-first mode",
      color: "#f57c30"
    });
  });

  it("labels medium and long windows distinctly", () => {
    expect(getLayoverSafetyStatus(240)).toMatchObject({ status: "short", color: "#f0bc42" });
    expect(getLayoverSafetyStatus(520)).toMatchObject({ status: "plenty", color: "#2ecb82" });
  });
});
