import type { CityId, Quest, QuestStop, TrimmedQuest } from "@/lib/types";

export function getActiveTrimmedQuest(
  trimmed: TrimmedQuest | null,
  cityId: CityId,
  questId?: string
): TrimmedQuest | null {
  if (!trimmed || !questId) return null;
  if (trimmed.city.id !== cityId) return null;
  if (trimmed.quest.id !== questId) return null;
  return trimmed;
}

export function getRenderableStops(
  activeQuest: Quest | undefined,
  trimmed: TrimmedQuest | null,
  cityId: CityId
): QuestStop[] {
  const activeTrimmed = getActiveTrimmedQuest(trimmed, cityId, activeQuest?.id);
  return activeTrimmed?.stops ?? activeQuest?.stops.slice(0, 4) ?? [];
}

export function routeStopsKey(stops: QuestStop[]): string {
  return stops.map((stop) => stop.id).join("|");
}
