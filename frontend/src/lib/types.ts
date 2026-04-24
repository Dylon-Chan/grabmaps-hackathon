export type CityId = "singapore" | "bangkok";

export type QuestType =
  | "hawker"
  | "heritage"
  | "neighbourhood"
  | "nature";

export type BadgeTier = "Gold" | "Silver" | "Bronze" | "Locked";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type City = {
  id: CityId;
  name: string;
  country: string;
  neighbourhood: string;
  center: Coordinates;
  zoom: number;
};

export type QuestStop = {
  id: string;
  placeId: string;
  name: string;
  coordinates: Coordinates;
  visitMinutes: number;
  walkMinutesToNext?: number;
  lore: string;
  bonusLore: string;
  prompt: string;
  demoPhotoName: string;
  mapPosition: {
    x: number;
    y: number;
  };
};

export type Quest = {
  id: string;
  cityId: CityId;
  type: QuestType;
  title: string;
  emoji: string;
  summary: string;
  zoneLabel: string;
  color: string;
  stops: QuestStop[];
};

export type RouteLeg = {
  fromStopId: string;
  toStopId: string;
  minutes: number;
  distanceMeters: number;
  polyline: Coordinates[];
};

export type TrimmedQuest = {
  city: City;
  quest: Quest;
  stops: QuestStop[];
  totalMinutes: number;
  stopMinutes: number;
  walkMinutes: number;
  skippedStops: number;
  source: "live" | "fallback";
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  openNow: boolean;
  rating: number;
  priceLevel: string;
  photoLabel: string;
  source: "live" | "fallback";
};

export type VerificationResult = {
  passed: boolean;
  confidence: number;
  reason: string;
  source: "live" | "fallback";
};

export type PhotoScore = {
  score: number;
  tier: Exclude<BadgeTier, "Locked">;
  categories: {
    locationMatch: number;
    authenticity: number;
    composition: number;
    culturalContext: number;
    lighting: number;
  };
  feedback: string;
  unlockedLore: string;
  source: "live" | "fallback";
};

