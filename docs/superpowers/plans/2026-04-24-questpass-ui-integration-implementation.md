# QuestPass SG UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current SEA-GO dashboard with the teammate's QuestPass SG mobile-first flow while keeping this repo's typed Next.js frontend and FastAPI backend APIs.

**Architecture:** Add small typed helper modules for flight-window math, location/distance, and QuestPass display mapping. Replace the app entry with a `QuestPassApp` state machine composed from focused `questpass/*` components, backed by existing `/api/*` calls and deterministic demo fallbacks. Move the teammate prototype's visual system from inline styles into maintainable CSS classes in `globals.css`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, FastAPI backend via `NEXT_PUBLIC_API_BASE_URL`, existing frontend global CSS.

---

## File Structure

- Modify: `frontend/src/app/page.tsx` to render `QuestPassApp`.
- Modify: `frontend/src/app/layout.tsx` to update metadata to QuestPass SG.
- Modify: `frontend/src/app/globals.css` to replace the current SEA-GO dashboard styling with QuestPass SG screen, card, button, timeline, map, and passport styling.
- Create: `frontend/src/components/QuestPassApp.tsx` for app-level data loading, screen state, flight state, badge/XP state, backend calls, and screen transitions.
- Create: `frontend/src/components/questpass/FlightSetup.tsx` for the activation screen.
- Create: `frontend/src/components/questpass/QuestHome.tsx` for the home map/time-window screen.
- Create: `frontend/src/components/questpass/QuestSelect.tsx` for route-aware quest cards and filters.
- Create: `frontend/src/components/questpass/ActiveQuest.tsx` for the clue, progress, location/demo, and stop-unlock flow.
- Create: `frontend/src/components/questpass/StopUnlocked.tsx` for stop reveal, story, local tip, score result, and next/complete CTA.
- Create: `frontend/src/components/questpass/QuestComplete.tsx` for final quest completion.
- Create: `frontend/src/components/questpass/Passport.tsx` for badge collection and city tabs.
- Create: `frontend/src/lib/flightWindow.ts` for flight math.
- Create: `frontend/src/lib/flightWindow.test.ts` for TDD coverage of flight math.
- Create: `frontend/src/lib/location.ts` for browser geolocation and Haversine helpers.
- Create: `frontend/src/lib/questPass.ts` for QuestPass display mapping and badge/XP helpers.
- Create: `frontend/src/lib/questPass.test.ts` for TDD coverage of display mapping and badge helpers.

## Task 1: Flight-Window Helpers

**Files:**
- Create: `frontend/src/lib/flightWindow.test.ts`
- Create: `frontend/src/lib/flightWindow.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/flightWindow.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calculateAirportArrivalTime,
  calculateSafeExplorationWindow,
  calculateTimeUntilFlight,
  getLayoverSafetyStatus
} from "@/lib/flightWindow";

const now = new Date("2026-04-24T08:00:00.000Z");

describe("flight window helpers", () => {
  it("calculates minutes until a future flight", () => {
    expect(calculateTimeUntilFlight("2026-04-24T13:30:00.000Z", now)).toBe(330);
  });

  it("calculates the airport arrival deadline", () => {
    expect(calculateAirportArrivalTime("2026-04-24T13:30:00.000Z", 120).toISOString()).toBe(
      "2026-04-24T11:30:00.000Z"
    );
  });

  it("subtracts airport buffer and route time from the safe exploration window", () => {
    expect(calculateSafeExplorationWindow("2026-04-24T13:30:00.000Z", 120, 45, now)).toBe(165);
  });

  it("labels very short windows as airport-first mode", () => {
    expect(getLayoverSafetyStatus(90)).toMatchObject({
      status: "airport_first",
      label: "Airport-first mode",
      color: "#f57c30"
    });
  });

  it("labels medium and long windows distinctly", () => {
    expect(getLayoverSafetyStatus(240)).toMatchObject({ status: "short", color: "#f0bc42" });
    expect(getLayoverSafetyStatus(520)).toMatchObject({ status: "plenty", color: "#2ecb82" });
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
cd frontend && npm test -- src/lib/flightWindow.test.ts
```

Expected: FAIL because `@/lib/flightWindow` does not exist.

- [ ] **Step 3: Implement the helper module**

Create `frontend/src/lib/flightWindow.ts`:

```ts
export const ESTIMATED_AIRPORT_ROUTE_MINS = 45;

export type LayoverSafetyStatus = {
  status: "past" | "airport_first" | "short" | "plenty";
  label: string;
  color: string;
  description: string;
};

export function calculateTimeUntilFlight(flightDateTime: string, now = new Date()): number {
  return Math.round((new Date(flightDateTime).getTime() - now.getTime()) / 60000);
}

export function calculateAirportArrivalTime(flightDateTime: string, airportBufferMinutes: number): Date {
  return new Date(new Date(flightDateTime).getTime() - airportBufferMinutes * 60000);
}

export function calculateSafeExplorationWindow(
  flightDateTime: string,
  airportBufferMinutes: number,
  estimatedAirportRouteMinutes = ESTIMATED_AIRPORT_ROUTE_MINS,
  now = new Date()
): number {
  return calculateTimeUntilFlight(flightDateTime, now) - airportBufferMinutes - estimatedAirportRouteMinutes;
}

export function getLayoverSafetyStatus(safeExplorationWindowMinutes: number): LayoverSafetyStatus {
  if (safeExplorationWindowMinutes < 0) {
    return {
      status: "past",
      label: "Flight has passed",
      color: "#f57c30",
      description: "Choose a future departure time."
    };
  }
  if (safeExplorationWindowMinutes < 180) {
    return {
      status: "airport_first",
      label: "Airport-first mode",
      color: "#f57c30",
      description: "Very short window. Quick quests only."
    };
  }
  if (safeExplorationWindowMinutes < 480) {
    return {
      status: "short",
      label: "Short layover",
      color: "#f0bc42",
      description: "Two to four hour quests recommended."
    };
  }
  return {
    status: "plenty",
    label: "Plenty of time",
    color: "#2ecb82",
    description: "All quests available."
  };
}

export function formatMinutes(minutes: number): string {
  const clamped = Math.max(0, Math.round(minutes));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
cd frontend && npm test -- src/lib/flightWindow.test.ts
```

Expected: PASS for all `flight window helpers` tests.

## Task 2: QuestPass Display Helpers

**Files:**
- Create: `frontend/src/lib/questPass.test.ts`
- Create: `frontend/src/lib/questPass.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/questPass.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { badgeForQuest, deriveQuestCard, getQuestDurationMinutes, themeLabel } from "@/lib/questPass";
import type { Quest } from "@/lib/types";

function quest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "sg-hidden-hawker-gems",
    cityId: "singapore",
    type: "hawker",
    title: "Hidden Hawker Gems",
    emoji: "🍜",
    summary: "Eat where the locals actually eat.",
    zoneLabel: "Chinatown",
    color: "#f57c30",
    stops: [
      {
        id: "sg-maxwell",
        placeId: "grab:sg:maxwell",
        name: "Maxwell Food Centre",
        coordinates: { lat: 1.28, lng: 103.84 },
        visitMinutes: 18,
        walkMinutesToNext: 6,
        lore: "A beloved hawker stop.",
        bonusLore: "Order before noon.",
        prompt: "Photograph your plate.",
        demoPhotoName: "maxwell-demo.jpg",
        mapPosition: { x: 44, y: 64 }
      },
      {
        id: "sg-tong-ah",
        placeId: "grab:sg:tong-ah",
        name: "Tong Ah Eating House",
        coordinates: { lat: 1.279, lng: 103.842 },
        visitMinutes: 16,
        lore: "Old-school kopi.",
        bonusLore: "Try kaya toast.",
        prompt: "Frame the shophouse.",
        demoPhotoName: "tong-ah-demo.jpg",
        mapPosition: { x: 48, y: 66 }
      }
    ],
    ...overrides
  };
}

describe("QuestPass display helpers", () => {
  it("derives route-card copy and fit state from a quest", () => {
    const card = deriveQuestCard(quest(), 90, 58);

    expect(card.name).toBe("Hidden Hawker Gems");
    expect(card.theme).toBe("Food");
    expect(card.durationLabel).toBe("58m");
    expect(card.fitsWindow).toBe(true);
    expect(card.stopCountLabel).toBe("2 stops");
  });

  it("uses the full quest duration when no route total is available", () => {
    expect(getQuestDurationMinutes(quest())).toBe(40);
  });

  it("maps backend quest types to teammate filter labels", () => {
    expect(themeLabel("hawker")).toBe("Food");
    expect(themeLabel("heritage")).toBe("Heritage");
    expect(themeLabel("neighbourhood")).toBe("Local Life");
    expect(themeLabel("nature")).toBe("Nature");
  });

  it("derives stable badge identity from quest type", () => {
    expect(badgeForQuest(quest()).name).toBe("Hawker Legend");
    expect(badgeForQuest(quest({ type: "heritage", color: "#f0bc42" })).rarity).toBe("rare");
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
cd frontend && npm test -- src/lib/questPass.test.ts
```

Expected: FAIL because `@/lib/questPass` does not exist.

- [ ] **Step 3: Implement display helpers**

Create `frontend/src/lib/questPass.ts`:

```ts
import type { BadgeTier, Quest, QuestType } from "@/lib/types";
import { formatMinutes } from "@/lib/flightWindow";

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
      description: "Unlocked by tracing Singapore's living memory."
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
```

- [ ] **Step 4: Run the focused helper tests**

Run:

```bash
cd frontend && npm test -- src/lib/questPass.test.ts src/lib/flightWindow.test.ts
```

Expected: PASS for both helper test files.

## Task 3: Location Helpers

**Files:**
- Create: `frontend/src/lib/location.ts`

- [ ] **Step 1: Implement location helpers**

Create `frontend/src/lib/location.ts`:

```ts
import type { Coordinates } from "@/lib/types";

export type UserLocation = Coordinates & {
  accuracyMeters?: number;
};

export type LocationState = "not_requested" | "loading" | "granted" | "denied";

export function calculateDistanceMeters(source: Coordinates, target: Coordinates): number {
  const radius = 6_371_000;
  const lat1 = (source.lat * Math.PI) / 180;
  const lat2 = (target.lat * Math.PI) / 180;
  const deltaLat = ((target.lat - source.lat) * Math.PI) / 180;
  const deltaLng = ((target.lng - source.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinUnlockRadius(distanceMeters: number | null, radiusMeters: number): boolean {
  return distanceMeters !== null && distanceMeters <= radiusMeters;
}

export function requestBrowserLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}
```

- [ ] **Step 2: Run all frontend helper tests**

Run:

```bash
cd frontend && npm test -- src/lib/questPass.test.ts src/lib/flightWindow.test.ts src/lib/questState.test.ts src/lib/mapRoute.test.ts
```

Expected: PASS for all listed frontend tests.

## Task 4: QuestPass App State Machine

**Files:**
- Create: `frontend/src/components/QuestPassApp.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create the client app state shell**

Create `frontend/src/components/QuestPassApp.tsx` with these responsibilities:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ActiveQuest } from "@/components/questpass/ActiveQuest";
import { FlightSetup, type FlightData } from "@/components/questpass/FlightSetup";
import { Passport } from "@/components/questpass/Passport";
import { QuestComplete } from "@/components/questpass/QuestComplete";
import { QuestHome, type TimeOption } from "@/components/questpass/QuestHome";
import { QuestSelect } from "@/components/questpass/QuestSelect";
import { StopUnlocked } from "@/components/questpass/StopUnlocked";
import { userLevelFromXp, type StopBadgeRecord } from "@/lib/questPass";
import type { City, PhotoScore, Quest, QuestStop, RouteLeg, TrimmedQuest, VerificationResult } from "@/lib/types";

type Screen = "setup" | "home" | "select" | "quest" | "unlocked" | "complete" | "passport";
type RouteResponse = { legs: RouteLeg[]; totalMinutes: number; walkMinutes: number; stopMinutes: number; source: "live" | "fallback" };
type UnlockedStopState = { stop: QuestStop; index: number; verification: VerificationResult | null; score: PhotoScore | null };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const DEMO_FLIGHT_MINS = 9 * 60 + 40;

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function QuestPassApp() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [cities, setCities] = useState<City[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cityId, setCityId] = useState<City["id"]>("singapore");
  const [timeOption, setTimeOption] = useState<TimeOption | null>(null);
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [trimmed, setTrimmed] = useState<TrimmedQuest | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [unlockedStop, setUnlockedStop] = useState<UnlockedStopState | null>(null);
  const [badges, setBadges] = useState<Record<string, StopBadgeRecord>>({});
  const [earnedQuestBadgeIds, setEarnedQuestBadgeIds] = useState<string[]>([]);
  const [userXp, setUserXp] = useState(120);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [flightMinsRemaining, setFlightMinsRemaining] = useState(DEMO_FLIGHT_MINS);

  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const cityQuests = useMemo(() => quests.filter((quest) => quest.cityId === cityId), [quests, cityId]);
  const activeQuest = cityQuests.find((quest) => quest.id === activeQuestId) ?? cityQuests[0];
  const routeStops = trimmed?.quest.id === activeQuest?.id && trimmed.city.id === cityId ? trimmed.stops : activeQuest?.stops.slice(0, 4) ?? [];
  const activeStop = routeStops[Math.min(activeStopIndex, Math.max(0, routeStops.length - 1))];
  const userLevel = userLevelFromXp(userXp);

  useEffect(() => {
    async function loadData() {
      const [citiesResponse, questsResponse] = await Promise.all([fetch(apiUrl("/api/cities")), fetch(apiUrl("/api/quests"))]);
      if (!citiesResponse.ok || !questsResponse.ok) throw new Error("FastAPI backend is not reachable.");
      setCities((await citiesResponse.json()).cities);
      setQuests((await questsResponse.json()).quests);
    }
    loadData().catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load backend data."));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setFlightMinsRemaining((minutes) => Math.max(0, minutes - 1)), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const firstQuest = cityQuests[0];
    if (firstQuest && (!activeQuestId || !cityQuests.some((quest) => quest.id === activeQuestId))) {
      setActiveQuestId(firstQuest.id);
      setActiveStopIndex(0);
      setTrimmed(null);
      setRoute(null);
      setBadges({});
    }
  }, [activeQuestId, cityQuests]);

  async function prepareQuest(quest: Quest, option: TimeOption) {
    setActiveQuestId(quest.id);
    setActiveStopIndex(0);
    setBadges({});
    const trimResponse = await fetch(apiUrl("/api/quests/trim"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cityId, questId: quest.id, minutes: option.mins })
    });
    if (!trimResponse.ok) throw new Error(`Trim failed: ${trimResponse.status}`);
    const trimResult = (await trimResponse.json()) as TrimmedQuest;
    setTrimmed(trimResult);
    const routeResponse = await fetch(apiUrl("/api/routes"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stops: trimResult.stops })
    });
    if (routeResponse.ok) setRoute((await routeResponse.json()) as RouteResponse);
  }

  async function verifyAndScoreStop(stop: QuestStop, imageName = stop.demoPhotoName) {
    const verifyResponse = await fetch(apiUrl("/api/photo/verify"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stopId: stop.id, imageName })
    });
    if (!verifyResponse.ok) throw new Error(`Verify failed: ${verifyResponse.status}`);
    const verification = (await verifyResponse.json()) as VerificationResult;
    let score: PhotoScore | null = null;
    if (verification.passed) {
      const scoreResponse = await fetch(apiUrl("/api/photo/score"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stopId: stop.id, verification })
      });
      if (!scoreResponse.ok) throw new Error(`Score failed: ${scoreResponse.status}`);
      score = (await scoreResponse.json()) as PhotoScore;
      setBadges((current) => ({ ...current, [stop.id]: { tier: score!.tier, score: score!.score } }));
    }
    setUnlockedStop({ stop, index: activeStopIndex, verification, score });
    setScreen("unlocked");
  }

  if (loadError) {
    return <main className="qp-shell"><section className="qp-status-panel"><p>QuestPass backend</p><h1>{loadError}</h1><span>Start FastAPI or set NEXT_PUBLIC_API_BASE_URL.</span></section></main>;
  }

  if (!city || !activeQuest || !activeStop) {
    return <main className="qp-shell"><section className="qp-status-panel"><p>QuestPass SG</p><h1>Loading quest data...</h1></section></main>;
  }

  return (
    <main className="qp-shell">
      <div className="qp-phone">
        <div className="qp-screen">
          {screen === "setup" && <FlightSetup onActivate={(data) => { setFlightData(data); setFlightMinsRemaining(data.flightMinsRemaining); setScreen("home"); }} onDemoMode={() => setScreen("home")} />}
          {screen === "home" && <QuestHome city={city} quests={cityQuests} userXp={userXp} userLevel={userLevel} flightMinsRemaining={flightMinsRemaining} onSelectTime={(option) => { setTimeOption(option); setScreen("select"); }} onOpenPassport={() => setScreen("passport")} />}
          {screen === "select" && timeOption && <QuestSelect city={city} quests={cityQuests} timeOption={timeOption} routeTotalMinutes={route?.totalMinutes ?? null} flightMinsRemaining={flightMinsRemaining} onBack={() => setScreen("home")} onSelectQuest={async (quest) => { await prepareQuest(quest, timeOption); setScreen("quest"); }} />}
          {screen === "quest" && <ActiveQuest quest={activeQuest} stops={routeStops} activeStopIndex={activeStopIndex} badges={badges} flightMinsRemaining={flightMinsRemaining} onBack={() => setScreen("select")} onUnlockStop={verifyAndScoreStop} />}
          {screen === "unlocked" && unlockedStop && <StopUnlocked quest={activeQuest} unlocked={unlockedStop} totalStops={routeStops.length} onContinue={() => { const next = Math.min(activeStopIndex + 1, routeStops.length - 1); setActiveStopIndex(next); setScreen(next === activeStopIndex ? "complete" : "quest"); }} onComplete={() => setScreen("complete")} />}
          {screen === "complete" && <QuestComplete quest={activeQuest} earnedBadgeIds={earnedQuestBadgeIds} onClaimBadge={() => { setEarnedQuestBadgeIds((ids) => ids.includes(activeQuest.id) ? ids : [...ids, activeQuest.id]); setUserXp((xp) => xp + 280); setScreen("passport"); }} onMap={() => setScreen("home")} />}
          {screen === "passport" && <Passport city={city} quests={cityQuests} earnedQuestBadgeIds={earnedQuestBadgeIds} stopBadges={badges} userXp={userXp} userLevel={userLevel} onBack={() => setScreen("home")} />}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Wire the page entry**

Replace `frontend/src/app/page.tsx` with:

```tsx
import { QuestPassApp } from "@/components/QuestPassApp";

export default function Home() {
  return <QuestPassApp />;
}
```

- [ ] **Step 3: Update metadata**

Modify `frontend/src/app/layout.tsx` metadata:

```ts
export const metadata: Metadata = {
  title: "QuestPass SG",
  description: "Turn a Singapore layover into a time-safe city quest."
};
```

## Task 5: QuestPass Screens

**Files:**
- Create: `frontend/src/components/questpass/FlightSetup.tsx`
- Create: `frontend/src/components/questpass/QuestHome.tsx`
- Create: `frontend/src/components/questpass/QuestSelect.tsx`
- Create: `frontend/src/components/questpass/ActiveQuest.tsx`
- Create: `frontend/src/components/questpass/StopUnlocked.tsx`
- Create: `frontend/src/components/questpass/QuestComplete.tsx`
- Create: `frontend/src/components/questpass/Passport.tsx`

- [ ] **Step 1: Create `FlightSetup`**

Implement `FlightSetup` with date/time inputs, airport buffer segmented buttons, safety summary, primary CTA, and demo CTA. Use `calculateAirportArrivalTime`, `calculateSafeExplorationWindow`, `calculateTimeUntilFlight`, `formatMinutes`, and `getLayoverSafetyStatus` from `@/lib/flightWindow`.

- [ ] **Step 2: Create `QuestHome`**

Implement the QuestPass home screen with top XP pill, flight countdown pill, logo/title/subtitle, stylized Singapore map using quest `color` and `zoneLabel`, time-window buttons for `2h`, `4h`, `8h`, `24h`, `48h`, begin CTA, and passport CTA.

- [ ] **Step 3: Create `QuestSelect`**

Implement filters for `All Quests`, `Food`, `Heritage`, `Local Life`, and `Nature`. Render each backend quest through `deriveQuestCard(quest, timeOption.mins, undefined)`, show badge, duration, stop count, fit chip, and start CTA. Disable visual emphasis for quests that do not fit the time window, but still allow selection for demo flexibility.

- [ ] **Step 4: Create `ActiveQuest`**

Implement airport buffer bar, back button, quest title, progress bar, stop timeline, current clue card, hint reveal, location status chips, `Enable Location`, `Simulate Arrival`, and `Upload prepared photo` actions. The `Simulate Arrival` and prepared photo actions should call `onUnlockStop(currentStop)`.

- [ ] **Step 5: Create `StopUnlocked`**

Implement stop reveal with stop breadcrumb, "Unlocked!" title, place card, story from `stop.lore`, local tip from `stop.bonusLore`, photo challenge from `stop.prompt`, verification/score result, and next/complete CTA.

- [ ] **Step 6: Create `QuestComplete`**

Implement completion screen with trophy, quest title, earned badge from `badgeForQuest(quest)`, XP summary, `View My Passport` CTA, and `Back to Quest Map` CTA.

- [ ] **Step 7: Create `Passport`**

Implement passport cover, back button, XP stats, level progress, Singapore city tab, locked future city tabs, badge cards derived from current quests, and earned state from `earnedQuestBadgeIds`.

## Task 6: QuestPass CSS

**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Replace dashboard-specific CSS with QuestPass styles**

Keep global reset and add CSS classes used by the new components:

```css
:root {
  --qp-bg: #060810;
  --qp-surface: #0b0d1a;
  --qp-card: #141626;
  --qp-ink: #f0f2ff;
  --qp-muted: rgba(240, 242, 255, 0.52);
  --qp-soft: rgba(255, 255, 255, 0.08);
  --qp-pink: #e040a0;
  --qp-gold: #f0bc42;
  --qp-green: #2ecb82;
  --qp-blue: #3d8ff5;
  --qp-purple: #7c4dcc;
  --qp-orange: #f57c30;
}

* { box-sizing: border-box; }
html, body { min-height: 100%; margin: 0; background: var(--qp-bg); color: var(--qp-ink); font-family: "DM Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0; }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.62; }

.qp-shell { min-height: 100vh; display: flex; justify-content: center; background: radial-gradient(circle at 50% -10%, rgba(224, 64, 160, 0.16), transparent 34%), #060810; }
.qp-phone { width: min(100%, 430px); min-height: 100vh; background: var(--qp-surface); box-shadow: 0 0 80px rgba(0, 0, 0, 0.58); overflow: hidden; }
.qp-screen { min-height: 100vh; position: relative; overflow-x: hidden; }
.qp-view { min-height: 100vh; padding: 20px; background: linear-gradient(180deg, #060810 0%, #0b0d1a 48%, #0d1020 100%); }
.qp-view-scroll { min-height: 100vh; padding: 20px 20px 40px; background: linear-gradient(180deg, #060810 0%, #0b0d1a 48%, #0d1020 100%); }
.qp-logo-row, .qp-row, .qp-topbar, .qp-actions, .qp-chip-row, .qp-stat-row { display: flex; align-items: center; }
.qp-topbar { justify-content: space-between; gap: 12px; }
.qp-logo-row { gap: 8px; margin-bottom: 24px; }
.qp-logo-mark { color: var(--qp-pink); filter: drop-shadow(0 0 8px var(--qp-pink)); font-size: 20px; }
.qp-logo-text, .qp-kicker, .qp-label { color: rgba(240, 242, 255, 0.42); font-family: "Space Grotesk", Inter, sans-serif; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
.qp-hero-title { margin: 0 0 10px; font-family: "Space Grotesk", Inter, sans-serif; font-size: 2rem; line-height: 1.12; letter-spacing: 0; }
.qp-gradient-text { color: var(--qp-pink); }
.qp-copy { margin: 0; color: var(--qp-muted); line-height: 1.58; }
.qp-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; background: var(--qp-card); overflow: hidden; }
.qp-panel { border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(255,255,255,0.05); padding: 14px; }
.qp-button-primary, .qp-button-secondary, .qp-pill, .qp-icon-button { border: 1px solid transparent; border-radius: 14px; min-height: 44px; font-weight: 800; font-family: "Space Grotesk", Inter, sans-serif; }
.qp-button-primary { width: 100%; color: #0b0d1a; background: linear-gradient(135deg, var(--qp-gold), var(--qp-orange)); }
.qp-button-secondary { color: var(--qp-ink); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
.qp-pill { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; color: rgba(240,242,255,0.72); background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
.qp-pill-active { color: var(--qp-pink); background: rgba(224,64,160,0.15); border-color: rgba(224,64,160,0.4); }
.qp-input { width: 100%; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(255,255,255,0.06); color: var(--qp-ink); color-scheme: dark; padding: 10px 12px; outline: none; }
.qp-grid-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.qp-card-list { display: grid; gap: 14px; }
.qp-quest-card { position: relative; display: grid; gap: 12px; padding: 14px; text-align: left; color: var(--qp-ink); }
.qp-progress { height: 5px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,0.08); }
.qp-progress > span { display: block; height: 100%; border-radius: inherit; background: var(--qp-pink); }
.qp-map-card { margin: 18px 0; padding: 10px; border-radius: 18px; background: #080c18; border: 1px solid rgba(61,143,245,0.18); }
.qp-timeline { display: flex; align-items: flex-start; gap: 0; padding: 18px 0; }
.qp-timeline-item { position: relative; flex: 1; display: grid; justify-items: center; gap: 7px; min-width: 0; }
.qp-dot { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 999px; background: rgba(255,255,255,0.1); color: white; font-size: 0.7rem; font-weight: 900; }
.qp-stop-card { margin-top: 16px; }
.qp-status-panel { width: min(620px, calc(100vw - 32px)); margin: 15vh auto 0; padding: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; background: var(--qp-card); }

@media (min-width: 760px) {
  .qp-shell { padding: 24px 0; align-items: center; }
  .qp-phone { min-height: min(900px, calc(100vh - 48px)); border-radius: 28px; }
  .qp-screen, .qp-view, .qp-view-scroll { min-height: min(900px, calc(100vh - 48px)); }
}

@media (prefers-reduced-motion: no-preference) {
  .qp-button-primary, .qp-button-secondary, .qp-pill, .qp-quest-card { transition: transform 160ms ease, border-color 160ms ease, background 160ms ease; }
  .qp-button-primary:hover, .qp-button-secondary:hover, .qp-pill:hover, .qp-quest-card:hover { transform: translateY(-1px); }
}
```

- [ ] **Step 2: Run a build to catch class/import mistakes**

Run:

```bash
cd frontend && npm run build
```

Expected: build completes with exit code 0. If Next lint setup reports that `next lint` is removed or unavailable, record that separately and rely on `npm run build` plus `npm test`.

## Task 7: Verification And Cleanup

**Files:**
- Modify only files changed in Tasks 1-6 if verification exposes issues.

- [ ] **Step 1: Run frontend tests**

Run:

```bash
cd frontend && npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run frontend build**

Run:

```bash
cd frontend && npm run build
```

Expected: Next build exits 0.

- [ ] **Step 3: Run backend tests if frontend integration changed API assumptions**

Run:

```bash
cd backend && make test
```

Expected: pytest exits 0.

- [ ] **Step 4: Manual browser verification**

Start the app with the existing project workflow:

```bash
make dev
```

Verify in browser:

- Setup screen appears with QuestPass SG branding.
- Demo mode enters the home screen.
- Time window selection opens quest selection.
- Selecting a quest opens active clue screen.
- Simulate arrival opens stop-unlocked screen.
- Stop-unlocked shows verification/scoring result after the backend calls complete.
- Completing a quest opens completion/passport flow.
- Mobile viewport does not overlap text.
- Desktop viewport shows a centered phone shell.

Stop the dev server before final response.

## Plan Self-Review

- Spec coverage: the plan covers replacement app entry, typed helpers, backend API usage, flight setup, home, select, active quest, unlock, complete, passport, CSS, tests, and browser verification.
- Gap scan: the plan contains no open markers and no deferred implementation instructions.
- Type consistency: helper names used in component tasks match the modules defined in Tasks 1-3. Component names used by `QuestPassApp` match the files defined in Task 5. Backend data fields match `frontend/src/lib/types.ts`.
