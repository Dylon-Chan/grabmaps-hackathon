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
import type {
  City,
  PhotoScore,
  Quest,
  QuestStop,
  RouteLeg,
  TrimmedQuest,
  VerificationResult
} from "@/lib/types";

type Screen = "setup" | "home" | "select" | "quest" | "unlocked" | "complete" | "passport";

type RouteResponse = {
  legs: RouteLeg[];
  totalMinutes: number;
  walkMinutes: number;
  stopMinutes: number;
  source: "live" | "fallback";
};

export type UnlockedStopState = {
  stop: QuestStop;
  index: number;
  verification: VerificationResult | null;
  score: PhotoScore | null;
};

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
  const hasActiveTrimmedQuest = Boolean(
    trimmed && activeQuest && trimmed.quest.id === activeQuest.id && trimmed.city.id === cityId
  );
  const routeStops = hasActiveTrimmedQuest ? trimmed!.stops : activeQuest?.stops.slice(0, 4) ?? [];
  const activeStop = routeStops[Math.min(activeStopIndex, Math.max(0, routeStops.length - 1))];
  const userLevel = userLevelFromXp(userXp);

  useEffect(() => {
    async function loadData() {
      const [citiesResponse, questsResponse] = await Promise.all([
        fetch(apiUrl("/api/cities")),
        fetch(apiUrl("/api/quests"))
      ]);
      if (!citiesResponse.ok || !questsResponse.ok) {
        throw new Error("FastAPI backend is not reachable.");
      }
      setCities(((await citiesResponse.json()) as { cities: City[] }).cities);
      setQuests(((await questsResponse.json()) as { quests: Quest[] }).quests);
    }

    loadData().catch((error) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load backend data.");
    });
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFlightMinsRemaining((minutes) => Math.max(0, minutes - 1));
    }, 60000);
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
    setUnlockedStop(null);

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
    setRoute(routeResponse.ok ? ((await routeResponse.json()) as RouteResponse) : null);
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
      const scored = (await scoreResponse.json()) as PhotoScore;
      score = scored;
      setBadges((current) => ({
        ...current,
        [stop.id]: { tier: scored.tier, score: scored.score }
      }));
    }

    setUnlockedStop({ stop, index: activeStopIndex, verification, score });
    setScreen("unlocked");
  }

  function completeQuest() {
    if (!activeQuest) return;
    setEarnedQuestBadgeIds((ids) => (ids.includes(activeQuest.id) ? ids : [...ids, activeQuest.id]));
    setUserXp((xp) => xp + 280);
    setScreen("passport");
  }

  if (loadError) {
    return (
      <main className="qp-shell">
        <section className="qp-status-panel">
          <p className="qp-kicker">QuestPass backend</p>
          <h1>{loadError}</h1>
          <span>Start FastAPI or set NEXT_PUBLIC_API_BASE_URL.</span>
        </section>
      </main>
    );
  }

  if (!city || !activeQuest || !activeStop) {
    return (
      <main className="qp-shell">
        <section className="qp-status-panel">
          <p className="qp-kicker">QuestPass SG</p>
          <h1>Loading quest data...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="qp-shell">
      <div className="qp-phone">
        <div className="qp-screen" data-screen={screen}>
          {screen === "setup" && (
            <FlightSetup
              onActivate={(data) => {
                setFlightData(data);
                setFlightMinsRemaining(data.flightMinsRemaining);
                setScreen("home");
              }}
              onDemoMode={() => {
                setFlightData(null);
                setFlightMinsRemaining(DEMO_FLIGHT_MINS);
                setScreen("home");
              }}
            />
          )}

          {screen === "home" && (
            <QuestHome
              city={city}
              quests={cityQuests}
              userXp={userXp}
              userLevel={userLevel}
              flightMinsRemaining={flightMinsRemaining}
              flightData={flightData}
              onCityChange={(nextCityId) => {
                setCityId(nextCityId);
                setTrimmed(null);
                setRoute(null);
              }}
              cities={cities}
              onSelectTime={(option) => {
                setTimeOption(option);
                setScreen("select");
              }}
              onOpenPassport={() => setScreen("passport")}
            />
          )}

          {screen === "select" && timeOption && (
            <QuestSelect
              city={city}
              quests={cityQuests}
              timeOption={timeOption}
              flightMinsRemaining={flightMinsRemaining}
              onBack={() => setScreen("home")}
              onSelectQuest={async (quest) => {
                await prepareQuest(quest, timeOption);
                setScreen("quest");
              }}
            />
          )}

          {screen === "quest" && (
            <ActiveQuest
              quest={activeQuest}
              stops={routeStops}
              activeStopIndex={activeStopIndex}
              badges={badges}
              flightMinsRemaining={flightMinsRemaining}
              route={route}
              onBack={() => setScreen("select")}
              onUnlockStop={verifyAndScoreStop}
            />
          )}

          {screen === "unlocked" && unlockedStop && (
            <StopUnlocked
              quest={activeQuest}
              unlocked={unlockedStop}
              totalStops={routeStops.length}
              onContinue={() => {
                setActiveStopIndex((current) => Math.min(current + 1, routeStops.length - 1));
                setScreen("quest");
              }}
              onComplete={() => setScreen("complete")}
            />
          )}

          {screen === "complete" && (
            <QuestComplete quest={activeQuest} onClaimBadge={completeQuest} onMap={() => setScreen("home")} />
          )}

          {screen === "passport" && (
            <Passport
              city={city}
              quests={cityQuests}
              earnedQuestBadgeIds={earnedQuestBadgeIds}
              stopBadges={badges}
              userXp={userXp}
              userLevel={userLevel}
              onBack={() => setScreen("home")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
