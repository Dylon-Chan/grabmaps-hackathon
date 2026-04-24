import { describe, expect, it } from "vitest";
import { badgeForQuest, deriveQuestCard, getQuestDurationMinutes, themeLabel } from "@/lib/questPass";
import type { Quest } from "@/lib/types";

function quest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "sg-hidden-hawker-gems",
    cityId: "singapore",
    type: "hawker",
    title: "Hidden Hawker Gems",
    emoji: "H",
    summary: "Eat where the locals actually eat.",
    zoneLabel: "Chinatown",
    color: "#f57c30",
    stops: [
      {
        id: "sg-maxwell",
        placeId: "grab:sg:maxwell",
        name: "Maxwell Food Centre",
        coordinates: { lat: 1.28, lng: 103.84 },
        visitMinutes: 18,
        walkMinutesToNext: 6,
        lore: "A beloved hawker stop.",
        bonusLore: "Order before noon.",
        prompt: "Photograph your plate.",
        demoPhotoName: "maxwell-demo.jpg",
        mapPosition: { x: 44, y: 64 }
      },
      {
        id: "sg-tong-ah",
        placeId: "grab:sg:tong-ah",
        name: "Tong Ah Eating House",
        coordinates: { lat: 1.279, lng: 103.842 },
        visitMinutes: 16,
        lore: "Old-school kopi.",
        bonusLore: "Try kaya toast.",
        prompt: "Frame the shophouse.",
        demoPhotoName: "tong-ah-demo.jpg",
        mapPosition: { x: 48, y: 66 }
      }
    ],
    ...overrides
  };
}

describe("QuestPass display helpers", () => {
  it("derives route-card copy and fit state from a quest", () => {
    const card = deriveQuestCard(quest(), 90, 58);

    expect(card.name).toBe("Hidden Hawker Gems");
    expect(card.theme).toBe("Food");
    expect(card.durationLabel).toBe("58m");
    expect(card.fitsWindow).toBe(true);
    expect(card.stopCountLabel).toBe("2 stops");
  });

  it("uses the full quest duration when no route total is available", () => {
    expect(getQuestDurationMinutes(quest())).toBe(40);
  });

  it("maps backend quest types to teammate filter labels", () => {
    expect(themeLabel("hawker")).toBe("Food");
    expect(themeLabel("heritage")).toBe("Heritage");
    expect(themeLabel("neighbourhood")).toBe("Local Life");
    expect(themeLabel("nature")).toBe("Nature");
  });

  it("derives stable badge identity from quest type", () => {
    expect(badgeForQuest(quest()).name).toBe("Hawker Legend");
    expect(badgeForQuest(quest({ type: "heritage", color: "#f0bc42" })).rarity).toBe("rare");
  });
});
