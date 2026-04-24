import { describe, expect, it } from "vitest";
import { cities, quests } from "./quests";

describe("quest data", () => {
  it("contains two demo cities with four six-stop quests each", () => {
    expect(cities).toHaveLength(2);

    for (const city of cities) {
      const cityQuests = quests.filter((quest) => quest.cityId === city.id);
      expect(cityQuests).toHaveLength(4);
      for (const quest of cityQuests) {
        expect(quest.stops).toHaveLength(6);
      }
    }
  });
});

