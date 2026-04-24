import { describe, expect, it } from "vitest";
import { trimQuestToBudget } from "./route-trimming";

describe("trimQuestToBudget", () => {
  it("trims Singapore Hidden Hawker Gems to four stops for 90 minutes", () => {
    const result = trimQuestToBudget("singapore", "sg-hidden-hawker-gems", 90);

    expect(result.stops).toHaveLength(4);
    expect(result.skippedStops).toBe(2);
    expect(result.totalMinutes).toBeLessThanOrEqual(90);
  });

  it("keeps all Singapore Hidden Hawker Gems stops for 120 minutes", () => {
    const result = trimQuestToBudget("singapore", "sg-hidden-hawker-gems", 120);

    expect(result.stops).toHaveLength(6);
    expect(result.totalMinutes).toBe(120);
  });
});

