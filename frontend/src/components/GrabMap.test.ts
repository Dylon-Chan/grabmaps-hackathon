import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("GrabMap browser authentication boundary", () => {
  it("does not attach GrabMaps bearer credentials from browser map requests", () => {
    const source = readFileSync(new URL("./GrabMap.tsx", import.meta.url), "utf8");

    expect(source).not.toContain("transformRequest");
    expect(source).not.toContain("Authorization");
    expect(source).not.toContain("apiKey");
  });
});
