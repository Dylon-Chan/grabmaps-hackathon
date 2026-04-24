import { describe, expect, it } from "vitest";
import { getActiveTrimmedQuest, getRenderableStops } from "@/lib/questState";
import type { City, Quest, QuestStop, TrimmedQuest } from "@/lib/types";

const singapore: City = {
  id: "singapore",
  name: "Singapore",
  country: "Singapore",
  neighbourhood: "Chinatown",
  center: { lat: 1.28, lng: 103.84 },
  zoom: 15
};

const bangkok: City = {
  id: "bangkok",
  name: "Bangkok",
  country: "Thailand",
  neighbourhood: "Bang Rak",
  center: { lat: 13.72, lng: 100.51 },
  zoom: 14
};

function stop(id: string): QuestStop {
  return {
    id,
    placeId: `grab:${id}`,
    name: id,
    coordinates: { lat: 1, lng: 103 },
    visitMinutes: 10,
    lore: id,
    bonusLore: id,
    prompt: id,
    demoPhotoName: `${id}.jpg`,
    mapPosition: { x: 0, y: 0 }
  };
}

function quest(id: string, cityId: City["id"], stops: QuestStop[]): Quest {
  return {
    id,
    cityId,
    type: "hawker",
    title: id,
    emoji: "Q",
    summary: id,
    zoneLabel: id,
    color: "#087f73",
    stops
  };
}

function trimmed(city: City, questValue: Quest, stops: QuestStop[]): TrimmedQuest {
  return {
    city,
    quest: questValue,
    stops,
    totalMinutes: 40,
    stopMinutes: 30,
    walkMinutes: 10,
    skippedStops: 1,
    source: "fallback"
  };
}

describe("quest state helpers", () => {
  it("ignores a trimmed quest from a previous city", () => {
    const staleStops = [stop("old-city-stop")];
    const activeQuest = quest("bkk-hawker", "bangkok", [
      stop("bkk-1"),
      stop("bkk-2"),
      stop("bkk-3"),
      stop("bkk-4"),
      stop("bkk-5")
    ]);
    const staleTrimmed = trimmed(singapore, quest("sg-hawker", "singapore", staleStops), staleStops);

    expect(getActiveTrimmedQuest(staleTrimmed, "bangkok", activeQuest.id)).toBeNull();
    expect(getRenderableStops(activeQuest, staleTrimmed, "bangkok").map((item) => item.id)).toEqual([
      "bkk-1",
      "bkk-2",
      "bkk-3",
      "bkk-4"
    ]);
  });

  it("ignores a trimmed quest from a previous quest in the same city", () => {
    const staleStops = [stop("old-quest-stop")];
    const activeQuest = quest("sg-heritage", "singapore", [
      stop("heritage-1"),
      stop("heritage-2"),
      stop("heritage-3"),
      stop("heritage-4"),
      stop("heritage-5")
    ]);
    const staleTrimmed = trimmed(singapore, quest("sg-hawker", "singapore", staleStops), staleStops);

    expect(getActiveTrimmedQuest(staleTrimmed, "singapore", activeQuest.id)).toBeNull();
    expect(getRenderableStops(activeQuest, staleTrimmed, "singapore").map((item) => item.id)).toEqual([
      "heritage-1",
      "heritage-2",
      "heritage-3",
      "heritage-4"
    ]);
  });

  it("uses trimmed stops only when they match the active city and quest", () => {
    const activeQuest = quest("sg-hawker", "singapore", [stop("raw-1"), stop("raw-2"), stop("raw-3"), stop("raw-4")]);
    const trimmedStops = [stop("trimmed-1"), stop("trimmed-2")];
    const activeTrimmed = trimmed(singapore, activeQuest, trimmedStops);

    expect(getActiveTrimmedQuest(activeTrimmed, "singapore", activeQuest.id)).toBe(activeTrimmed);
    expect(getRenderableStops(activeQuest, activeTrimmed, "singapore")).toBe(trimmedStops);
  });
});
