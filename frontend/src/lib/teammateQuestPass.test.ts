import { describe, expect, it } from "vitest";
import {
  badgeIdForQuest,
  formatTeammateDuration,
  toTeammateBadges,
  toTeammateNeighborhoods,
  toTeammateQuest
} from "@/lib/teammateQuestPass";
import type { City, Quest } from "@/lib/types";

const city: City = {
  id: "singapore",
  name: "Singapore",
  country: "SG",
  neighbourhood: "Chinatown",
  center: { lat: 1.28, lng: 103.84 },
  zoom: 12
};

function quest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "sg-hidden-hawker-gems",
    cityId: "singapore",
    type: "hawker",
    title: "Hidden Hawker Gems",
    emoji: "🍜",
    summary: "Eat where the locals actually eat.",
    zoneLabel: "Chinatown",
    color: "#f57c30",
    stops: [
      {
        id: "sg-maxwell",
        placeId: "grab:sg:maxwell",
        name: "Maxwell Food Centre",
        coordinates: { lat: 1.2803, lng: 103.8441 },
        visitMinutes: 18,
        walkMinutesToNext: 6,
        lore: "A beloved hawker stop.",
        bonusLore: "Arrive before lunch.",
        prompt: "Photograph your plate.",
        demoPhotoName: "maxwell-demo.jpg",
        mapPosition: { x: 44, y: 64 }
      },
      {
        id: "sg-tekka",
        placeId: "grab:sg:tekka",
        name: "Tekka Centre",
        coordinates: { lat: 1.3062, lng: 103.8497 },
        visitMinutes: 16,
        lore: "A Little India classic.",
        bonusLore: "Try teh tarik.",
        prompt: "Find the banana leaf plates.",
        demoPhotoName: "tekka-demo.jpg",
        mapPosition: { x: 38, y: 44 }
      }
    ],
    ...overrides
  };
}

describe("teammate UI data adapter", () => {
  it("maps backend quests into the teammate component contract", () => {
    const adapted = toTeammateQuest(quest());

    expect(adapted.name).toBe("Hidden Hawker Gems");
    expect(adapted.theme).toBe("food");
    expect(adapted.durationMins).toBe(40);
    expect(adapted.stops_data[0]).toMatchObject({
      id: "sg-maxwell",
      number: 1,
      placeQuery: "Maxwell Food Centre Chinatown Singapore",
      grabPlaceId: "grab:sg:maxwell",
      lat: 1.2803,
      lng: 103.8441,
      coords: { x: 44, y: 64 }
    });
  });

  it("creates badge ids that the passport can earn from completed quests", () => {
    const source = quest();
    const badges = toTeammateBadges([source], [city]);

    expect(badgeIdForQuest(source)).toBe("sg-hidden-hawker-gems-badge");
    expect(badges[0]).toMatchObject({
      id: "sg-hidden-hawker-gems-badge",
      city: "Singapore",
      name: "Hawker Legend"
    });
  });

  it("derives map neighborhoods from live quest zones", () => {
    expect(toTeammateNeighborhoods([quest()])).toEqual([
      {
        id: "chinatown",
        name: "Chinatown",
        x: 44,
        y: 64,
        quests: 1,
        color: "#f57c30"
      }
    ]);
  });

  it("formats teammate-style duration labels", () => {
    expect(formatTeammateDuration(120)).toBe("2h");
    expect(formatTeammateDuration(135)).toBe("2h 15m");
    expect(formatTeammateDuration(45)).toBe("45m");
  });
});
