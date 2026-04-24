import { getQuestDurationMinutes } from "@/lib/questPass";
import type { City, Coordinates, Quest, QuestStop } from "@/lib/types";

export type TeammateTimeOption = {
  label: string;
  mins: number;
  icon?: string;
};

export type TeammateStop = {
  id: string;
  number: number;
  unlocked: boolean;
  name: string;
  neighborhood: string;
  placeQuery: string;
  grabPlaceId: string;
  lat: number;
  lng: number;
  fallbackLat: number;
  fallbackLng: number;
  unlockRadiusMeters: number;
  clue: string;
  hint: string;
  story: string;
  localTip: string;
  photoChallenge: string;
  reward: {
    name: string;
    symbol: string;
    color: string;
  };
  xp: number;
  resolvedLat: number | null;
  resolvedLng: number | null;
  placeSearchStatus: "idle" | "loading" | "success" | "failed" | "using_fallback";
  distanceMeters: number | null;
  routeToStop: unknown | null;
  coords: {
    x: number;
    y: number;
  };
  sourceStop: QuestStop;
};

export type TeammateQuest = {
  id: string;
  name: string;
  tagline: string;
  theme: "food" | "heritage" | "architecture" | "local life";
  themeIcon: string;
  duration: string;
  durationMins: number;
  stops: number;
  difficulty: number;
  xpReward: number;
  featured: boolean;
  locked: boolean;
  recommended: boolean;
  neighborhood: string;
  persona: string[];
  vibe: string;
  badgeId: string;
  color: string;
  gradient: [string, string];
  estimatedRouteMins: number | null;
  airportReturnETA: number | null;
  safeBufferMins: number | null;
  fitsTimeWindow: boolean | null;
  stops_data: TeammateStop[];
  sourceQuest: Quest;
};

export type TeammateBadge = {
  id: string;
  name: string;
  description: string;
  city: string;
  earned: boolean;
  locked?: boolean;
  color: string;
  symbol: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
};

export type TeammateNeighborhood = {
  id: string;
  name: string;
  x: number;
  y: number;
  quests: number;
  color: string;
};

const QUEST_THEME: Record<Quest["type"], TeammateQuest["theme"]> = {
  hawker: "food",
  heritage: "heritage",
  neighbourhood: "local life",
  nature: "local life"
};

const THEME_ICON: Record<Quest["type"], string> = {
  hawker: "utensils",
  heritage: "clock",
  neighbourhood: "heart",
  nature: "leaf"
};

const PERSONA: Record<Quest["type"], string[]> = {
  hawker: ["Foodie", "Budget Traveller"],
  heritage: ["History Buff", "Photographer"],
  neighbourhood: ["Slow Traveller", "Local Life"],
  nature: ["Wellness Traveller", "Nature Lover"]
};

const BADGE_META: Record<Quest["type"], Omit<TeammateBadge, "id" | "city" | "color" | "earned">> = {
  hawker: {
    name: "Hawker Legend",
    description: "Completed Hidden Hawker Gems",
    symbol: "★",
    rarity: "common"
  },
  heritage: {
    name: "Time Keeper",
    description: "Completed Old-School Singapore",
    symbol: "⬡",
    rarity: "rare"
  },
  neighbourhood: {
    name: "Tiong Bahru Local",
    description: "Completed a Singapore neighbourhood quest",
    symbol: "♪",
    rarity: "common"
  },
  nature: {
    name: "Green Wayfinder",
    description: "Completed a nature quest",
    symbol: "✦",
    rarity: "legendary"
  }
};

const QUEST_GRADIENT: Record<Quest["type"], [string, string]> = {
  hawker: ["#1a0800", "#2a1200"],
  heritage: ["#1a1200", "#2a1e00"],
  neighbourhood: ["#001a10", "#002818"],
  nature: ["#001a08", "#002010"]
};

const REWARD_SYMBOLS = ["★", "◈", "⬤", "◇", "✦"];

export function formatTeammateDuration(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  if (minutes > 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function toTeammateQuest(quest: Quest, index = 0): TeammateQuest {
  const durationMins = getQuestDurationMinutes(quest);
  return {
    id: quest.id,
    name: quest.title,
    tagline: quest.summary,
    theme: QUEST_THEME[quest.type],
    themeIcon: THEME_ICON[quest.type],
    duration: formatTeammateDuration(durationMins),
    durationMins,
    stops: quest.stops.length,
    difficulty: quest.type === "heritage" ? 2 : 1,
    xpReward: Math.max(180, quest.stops.length * 70),
    featured: index === 0,
    locked: false,
    recommended: index < 2,
    neighborhood: quest.zoneLabel,
    persona: PERSONA[quest.type],
    vibe: quest.type === "hawker" ? "delicious" : quest.type === "heritage" ? "nostalgic" : "chill",
    badgeId: badgeIdForQuest(quest),
    color: quest.color,
    gradient: QUEST_GRADIENT[quest.type],
    estimatedRouteMins: null,
    airportReturnETA: null,
    safeBufferMins: null,
    fitsTimeWindow: null,
    stops_data: quest.stops.map((stop, stopIndex) => toTeammateStop(stop, quest, stopIndex)),
    sourceQuest: quest
  };
}

export function toTeammateStop(stop: QuestStop, quest: Quest, index: number): TeammateStop {
  const symbol = REWARD_SYMBOLS[index % REWARD_SYMBOLS.length];
  return {
    id: stop.id,
    number: index + 1,
    unlocked: false,
    name: stop.name,
    neighborhood: quest.zoneLabel,
    placeQuery: `${stop.name} ${quest.zoneLabel} Singapore`,
    grabPlaceId: stop.placeId,
    lat: stop.coordinates.lat,
    lng: stop.coordinates.lng,
    fallbackLat: stop.coordinates.lat,
    fallbackLng: stop.coordinates.lng,
    unlockRadiusMeters: 120,
    clue: stop.prompt,
    hint: stop.bonusLore,
    story: stop.lore,
    localTip: stop.bonusLore,
    photoChallenge: stop.prompt,
    reward: {
      name: `${stop.name} Token`,
      symbol,
      color: quest.color
    },
    xp: Math.max(60, stop.visitMinutes * 3),
    resolvedLat: null,
    resolvedLng: null,
    placeSearchStatus: "idle",
    distanceMeters: null,
    routeToStop: null,
    coords: stop.mapPosition,
    sourceStop: stop
  };
}

export function badgeIdForQuest(quest: Pick<Quest, "id">): string {
  return `${quest.id}-badge`;
}

export function toTeammateBadges(quests: Quest[], cities: City[]): TeammateBadge[] {
  const cityNameById = new Map(cities.map((city) => [city.id, city.name]));
  const questBadges = quests.map((quest) => ({
    id: badgeIdForQuest(quest),
    city: cityNameById.get(quest.cityId) ?? "Singapore",
    color: quest.color,
    earned: false,
    ...BADGE_META[quest.type]
  }));

  return [
    ...questBadges,
    {
      id: "sg-master",
      name: "Singapore Master",
      description: "Complete all Singapore quests",
      city: "Singapore",
      earned: false,
      color: "#e040a0",
      symbol: "✦",
      rarity: "legendary"
    },
    {
      id: "bkk-street",
      name: "Bangkok Street Ghost",
      description: "Complete a Bangkok quest",
      city: "Bangkok",
      earned: false,
      locked: true,
      color: "#f57c30",
      symbol: "◎",
      rarity: "rare"
    }
  ];
}

export function toTeammateNeighborhoods(quests: Quest[]): TeammateNeighborhood[] {
  const byZone = new Map<string, { quest: Quest; count: number; center: Coordinates }>();
  quests.forEach((quest) => {
    const firstStop = quest.stops[0];
    const current = byZone.get(quest.zoneLabel);
    byZone.set(quest.zoneLabel, {
      quest,
      count: (current?.count ?? 0) + 1,
      center: firstStop?.mapPosition
        ? { lat: firstStop.mapPosition.y, lng: firstStop.mapPosition.x }
        : (current?.center ?? { lat: 50, lng: 50 })
    });
  });

  return Array.from(byZone.entries()).map(([name, entry]) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name,
    x: entry.center.lng,
    y: entry.center.lat,
    quests: entry.count,
    color: entry.quest.color
  }));
}
