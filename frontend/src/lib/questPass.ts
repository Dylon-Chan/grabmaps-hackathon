import { formatMinutes } from "@/lib/flightWindow";
import type { BadgeTier, Quest, QuestType } from "@/lib/types";

export type QuestBadge = {
  id: string;
  name: string;
  symbol: string;
  color: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  description: string;
};

export type QuestCardView = {
  id: string;
  name: string;
  tagline: string;
  theme: string;
  icon: string;
  color: string;
  neighborhood: string;
  durationLabel: string;
  stopCountLabel: string;
  fitsWindow: boolean;
  badge: QuestBadge;
};

export type StopBadgeRecord = {
  tier: BadgeTier;
  score: number;
};

export function themeLabel(type: QuestType): string {
  const labels: Record<QuestType, string> = {
    hawker: "Food",
    heritage: "Heritage",
    neighbourhood: "Local Life",
    nature: "Nature"
  };
  return labels[type];
}

export function getQuestDurationMinutes(quest: Quest): number {
  const stopMinutes = quest.stops.reduce((sum, stop) => sum + stop.visitMinutes, 0);
  const walkMinutes = quest.stops.reduce((sum, stop) => sum + (stop.walkMinutesToNext ?? 0), 0);
  return stopMinutes + walkMinutes;
}

export function badgeForQuest(quest: Pick<Quest, "id" | "type" | "color">): QuestBadge {
  const badges: Record<QuestType, Omit<QuestBadge, "id" | "color">> = {
    hawker: {
      name: "Hawker Legend",
      symbol: "★",
      rarity: "uncommon",
      description: "Unlocked by tasting the city's local food trail."
    },
    heritage: {
      name: "Time Keeper",
      symbol: "◆",
      rarity: "rare",
      description: "Unlocked by tracing the city's living memory."
    },
    neighbourhood: {
      name: "Street Insider",
      symbol: "◈",
      rarity: "common",
      description: "Unlocked by reading the rhythm of local streets."
    },
    nature: {
      name: "Green Wayfinder",
      symbol: "✦",
      rarity: "legendary",
      description: "Unlocked by finding calm in the city."
    }
  };
  const badge = badges[quest.type];
  return { id: `${quest.id}-badge`, color: quest.color, ...badge };
}

export function deriveQuestCard(quest: Quest, timeWindowMinutes: number, routeTotalMinutes?: number): QuestCardView {
  const duration = routeTotalMinutes ?? getQuestDurationMinutes(quest);
  return {
    id: quest.id,
    name: quest.title,
    tagline: quest.summary,
    theme: themeLabel(quest.type),
    icon: quest.emoji,
    color: quest.color,
    neighborhood: quest.zoneLabel,
    durationLabel: formatMinutes(duration),
    stopCountLabel: `${quest.stops.length} ${quest.stops.length === 1 ? "stop" : "stops"}`,
    fitsWindow: duration <= timeWindowMinutes,
    badge: badgeForQuest(quest)
  };
}

export function completedStopCount(records: Record<string, StopBadgeRecord>): number {
  return Object.keys(records).length;
}

export function userLevelFromXp(xp: number): number {
  return Math.floor(xp / 500) + 1;
}
