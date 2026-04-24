import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("QuestPass visible map integration", () => {
  it("passes route-capable map data into the landing and active quest screens", () => {
    const appSource = readFileSync(new URL("./QuestPassApp.tsx", import.meta.url), "utf8");
    const questMapSource = readFileSync(
      new URL("./questpass/teammate/QuestMap.tsx", import.meta.url),
      "utf8"
    );
    const activeQuestSource = readFileSync(
      new URL("./questpass/teammate/ActiveQuest.tsx", import.meta.url),
      "utf8"
    );

    expect(appSource).toContain("activeRoute");
    expect(appSource).toContain("city={activeCity}");
    expect(appSource).toContain("route={activeRoute}");
    expect(questMapSource).toContain("import { GrabMap }");
    expect(questMapSource).toContain("<GrabMap");
    expect(activeQuestSource).toContain("import { GrabMap }");
    expect(activeQuestSource).toContain("<GrabMap");
  });
});
