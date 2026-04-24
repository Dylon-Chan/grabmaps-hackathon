import type { PhotoScore, PlaceDetails, VerificationResult } from "../types";

const baseUrl = process.env.GRABMAPS_API_BASE_URL;
const apiKey = process.env.GRABMAPS_API_KEY;
const aiBaseUrl = process.env.SEA_GO_AI_BASE_URL;

export async function fetchLivePlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!baseUrl || !apiKey) return null;

  try {
    const response = await fetch(`${baseUrl}/places/${encodeURIComponent(placeId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 60 }
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<PlaceDetails>;
    return {
      placeId,
      name: data.name ?? "GrabMaps place",
      openNow: data.openNow ?? true,
      rating: data.rating ?? 4.3,
      priceLevel: data.priceLevel ?? "$",
      photoLabel: data.photoLabel ?? "Live place photo",
      source: "live"
    };
  } catch (error) {
    console.warn("GrabMaps place fallback", error);
    return null;
  }
}

export async function fetchLivePhotoVerification(
  stopId: string,
  imageName: string
): Promise<VerificationResult | null> {
  if (!aiBaseUrl) return null;

  try {
    const response = await fetch(`${aiBaseUrl}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stopId, imageName })
    });
    if (!response.ok) return null;
    const data = (await response.json()) as VerificationResult;
    return { ...data, source: "live" };
  } catch (error) {
    console.warn("AI verification fallback", error);
    return null;
  }
}

export async function fetchLivePhotoScore(
  stopId: string,
  verification: VerificationResult
): Promise<PhotoScore | null> {
  if (!aiBaseUrl) return null;

  try {
    const response = await fetch(`${aiBaseUrl}/score`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stopId, verification })
    });
    if (!response.ok) return null;
    const data = (await response.json()) as PhotoScore;
    return { ...data, source: "live" };
  } catch (error) {
    console.warn("AI scoring fallback", error);
    return null;
  }
}

