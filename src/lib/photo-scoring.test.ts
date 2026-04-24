import { describe, expect, it } from "vitest";
import { scorePhoto, verifyPhoto } from "./photo-scoring";

describe("photo scoring", () => {
  it("fails wrong-location images before scoring", async () => {
    const verification = await verifyPhoto("sg-maxwell", "tokyo-crossing.jpg");

    expect(verification.passed).toBe(false);
  });

  it("awards Gold 85 for the prepared Maxwell demo photo", async () => {
    const verification = await verifyPhoto("sg-maxwell", "maxwell-demo.jpg");
    const score = await scorePhoto("sg-maxwell", verification);

    expect(verification.passed).toBe(true);
    expect(score.score).toBe(85);
    expect(score.tier).toBe("Gold");
  });
});

