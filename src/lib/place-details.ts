import { quests } from "./quests";
import type { PlaceDetails } from "./types";
import { fetchLivePlaceDetails } from "./integrations/grabmaps";

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const live = await fetchLivePlaceDetails(placeId);
  if (live) return live;

  const stop = quests.flatMap((quest) => quest.stops).find((item) => item.placeId === placeId);
  return {
    placeId,
    name: stop?.name ?? "Local stop",
    openNow: true,
    rating: placeId.includes("maxwell") ? 4.7 : 4.4,
    priceLevel: placeId.includes("hawker") || placeId.includes("maxwell") ? "$" : "$$",
    photoLabel: stop ? `${stop.name} street view` : "Neighbourhood photo",
    source: "fallback"
  };
}

