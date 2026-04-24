import { getStop } from "./quests";
import type { BadgeTier, PhotoScore, VerificationResult } from "./types";
import { fetchLivePhotoScore, fetchLivePhotoVerification } from "./integrations/grabmaps";

export async function verifyPhoto(stopId: string, imageName: string): Promise<VerificationResult> {
  const live = await fetchLivePhotoVerification(stopId, imageName);
  if (live) return live;

  const stop = getStop(stopId);
  const normalizedName = imageName.toLowerCase();
  const expectedName = stop.demoPhotoName.toLowerCase();
  const passed =
    normalizedName === "demo-upload.jpg" ||
    normalizedName === expectedName ||
    normalizedName.includes(stop.id.replace(/^sg-|^bkk-/, "").slice(0, 6));

  return {
    passed,
    confidence: passed ? 0.92 : 0.31,
    reason: passed
      ? `Photo cues match ${stop.name}: signage, queue flow, and food-centre context are present.`
      : `The uploaded image does not contain enough visual evidence for ${stop.name}.`,
    source: "fallback"
  };
}

export async function scorePhoto(stopId: string, verification: VerificationResult): Promise<PhotoScore> {
  if (!verification.passed) {
    throw new Error("Photo must pass location verification before scoring.");
  }

  const live = await fetchLivePhotoScore(stopId, verification);
  if (live) return live;

  const stop = getStop(stopId);
  const score = stop.id === "sg-maxwell" ? 85 : 78;
  const tier = getTier(score);
  return {
    score,
    tier,
    categories: {
      locationMatch: 92,
      authenticity: 88,
      composition: score === 85 ? 82 : 74,
      culturalContext: 84,
      lighting: 79
    },
    feedback:
      score === 85
        ? "The queue in the foreground adds life; next time try catching a handwritten menu board to anchor the story even more."
        : "Strong place context. Step a little closer to include one local texture, like signage, a counter detail, or someone ordering.",
    unlockedLore: tier === "Gold" ? stop.bonusLore : "Score Gold to unlock the deeper local note for this stop.",
    source: "fallback"
  };
}

function getTier(score: number): Exclude<BadgeTier, "Locked"> {
  if (score >= 82) return "Gold";
  if (score >= 65) return "Silver";
  return "Bronze";
}

