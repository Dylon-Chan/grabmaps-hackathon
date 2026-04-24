import { getCity, getQuest } from "./quests";
import { routeTotals } from "./routing";
import type { CityId, TrimmedQuest } from "./types";

export function trimQuestToBudget(cityId: CityId, questId: string, minutes: number): TrimmedQuest {
  const city = getCity(cityId);
  const quest = getQuest(cityId, questId);
  const budget = Math.max(30, Math.min(300, Math.round(minutes)));
  let selected = quest.stops.slice(0, 2);

  for (let count = 2; count <= quest.stops.length; count += 1) {
    const candidate = quest.stops.slice(0, count);
    if (routeTotals(candidate).totalMinutes <= budget) {
      selected = candidate;
    }
  }

  const totals = routeTotals(selected);
  return {
    city,
    quest,
    stops: selected,
    ...totals,
    skippedStops: quest.stops.length - selected.length,
    source: "fallback"
  };
}

