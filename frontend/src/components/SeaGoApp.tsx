"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { GrabMap } from "@/components/GrabMap";
import { getActiveTrimmedQuest, getRenderableStops, routeStopsKey } from "@/lib/questState";
import type {
  BadgeTier,
  City,
  CityId,
  PhotoScore,
  PlaceDetails,
  Quest,
  QuestStop,
  RouteLeg,
  TrimmedQuest,
  VerificationResult
} from "@/lib/types";

type RouteResponse = {
  legs: RouteLeg[];
  totalMinutes: number;
  walkMinutes: number;
  stopMinutes: number;
  source: "live" | "fallback";
};

type BadgeRecord = {
  tier: BadgeTier;
  score: number;
};

const categoryLabels: Record<keyof PhotoScore["categories"], string> = {
  locationMatch: "Location",
  authenticity: "Authenticity",
  composition: "Composition",
  culturalContext: "Culture",
  lighting: "Lighting"
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export function SeaGoApp() {
  const [cities, setCities] = useState<City[]>([]);
  const [allQuests, setAllQuests] = useState<Quest[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cityId, setCityId] = useState<CityId>("singapore");
  const [budget, setBudget] = useState(90);
  const [activeQuestId, setActiveQuestId] = useState("sg-hidden-hawker-gems");
  const [trimmed, setTrimmed] = useState<TrimmedQuest | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [score, setScore] = useState<PhotoScore | null>(null);
  const [lastScoredStopName, setLastScoredStopName] = useState<string | null>(null);
  const [badges, setBadges] = useState<Record<string, BadgeRecord>>({});
  const [isCollecting, setIsCollecting] = useState(false);

  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const cityQuests = useMemo(
    () => allQuests.filter((quest) => quest.cityId === cityId),
    [allQuests, cityId]
  );
  const activeQuest = cityQuests.find((quest) => quest.id === activeQuestId) ?? cityQuests[0];
  const activeTrimmed = useMemo(
    () => getActiveTrimmedQuest(trimmed, cityId, activeQuest?.id),
    [trimmed, cityId, activeQuest?.id]
  );
  const routeStops = useMemo(
    () => getRenderableStops(activeQuest, trimmed, cityId),
    [activeQuest, trimmed, cityId]
  );
  const currentRouteStopsKey = useMemo(() => routeStopsKey(routeStops), [routeStops]);
  const activeStop = routeStops[Math.min(activeStopIndex, routeStops.length - 1)];
  const completedStops = routeStops.filter((stop) => badges[stop.id]).length;
  const questComplete = routeStops.length > 0 && completedStops === routeStops.length;

  useEffect(() => {
    async function loadBackendData() {
      const [citiesResponse, questsResponse] = await Promise.all([
        fetch(apiUrl("/api/cities")),
        fetch(apiUrl("/api/quests"))
      ]);
      if (!citiesResponse.ok || !questsResponse.ok) {
        throw new Error("FastAPI backend is not reachable.");
      }
      const citiesData = (await citiesResponse.json()) as { cities: City[] };
      const questsData = (await questsResponse.json()) as { quests: Quest[] };
      setCities(citiesData.cities);
      setAllQuests(questsData.quests);
    }

    loadBackendData().catch((error) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load backend data.");
    });
  }, []);

  useEffect(() => {
    const firstQuest = allQuests.find((quest) => quest.cityId === cityId);
    if (firstQuest) {
      setActiveQuestId(firstQuest.id);
      setActiveStopIndex(0);
      setTrimmed(null);
      setRoute(null);
      setPlace(null);
      setScore(null);
      setVerification(null);
      setLastScoredStopName(null);
      setBadges({});
    }
  }, [allQuests, cityId]);

  useEffect(() => {
    if (!activeQuest) return;
    let cancelled = false;

    setTrimmed(null);
    setRoute(null);
    setPlace(null);
    setActiveStopIndex(0);
    setScore(null);
    setVerification(null);
    setLastScoredStopName(null);
    setBadges({});

    async function trimQuest() {
      const response = await fetch(apiUrl("/api/quests/trim"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cityId, questId: activeQuest.id, minutes: budget })
      });
      if (!response.ok) throw new Error(`Trim failed: ${response.status}`);
      const data = (await response.json()) as TrimmedQuest;
      if (cancelled) return;
      setTrimmed(data);
      setActiveStopIndex(0);
    }

    trimQuest().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [activeQuest, budget, cityId]);

  useEffect(() => {
    let cancelled = false;
    setRoute(null);

    async function fetchRoute() {
      const response = await fetch(apiUrl("/api/routes"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stops: routeStops })
      });
      if (!response.ok) throw new Error(`Route failed: ${response.status}`);
      const nextRoute = (await response.json()) as RouteResponse;
      if (!cancelled) setRoute(nextRoute);
    }

    if (routeStops.length > 1) fetchRoute().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [currentRouteStopsKey, routeStops]);

  useEffect(() => {
    if (!activeStop) return;
    let cancelled = false;
    setPlace(null);

    async function fetchPlace() {
      const response = await fetch(apiUrl(`/api/place/${encodeURIComponent(activeStop.placeId)}`));
      if (!response.ok) throw new Error(`Place fetch failed: ${response.status}`);
      const nextPlace = (await response.json()) as PlaceDetails;
      if (!cancelled) setPlace(nextPlace);
    }

    fetchPlace().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [activeStop]);

  async function collectPhoto(imageName = activeStop.demoPhotoName) {
    setIsCollecting(true);
    setVerification(null);
    setScore(null);
    try {
      const verifyResponse = await fetch(apiUrl("/api/photo/verify"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stopId: activeStop.id, imageName })
      });
      if (!verifyResponse.ok) throw new Error(`Verify failed: ${verifyResponse.status}`);
      const verifyResult = (await verifyResponse.json()) as VerificationResult;
      setVerification(verifyResult);
      if (!verifyResult.passed) return;

      const scoreResponse = await fetch(apiUrl("/api/photo/score"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stopId: activeStop.id, verification: verifyResult })
      });
      if (!scoreResponse.ok) throw new Error(`Score failed: ${scoreResponse.status}`);
      const scoreResult = (await scoreResponse.json()) as PhotoScore;
      setScore(scoreResult);
      setLastScoredStopName(activeStop.name);
      setBadges((current) => ({
        ...current,
        [activeStop.id]: { tier: scoreResult.tier, score: scoreResult.score }
      }));
      window.setTimeout(() => {
        setActiveStopIndex((current) => Math.min(current + 1, routeStops.length - 1));
      }, 900);
    } finally {
      setIsCollecting(false);
    }
  }

  function selectQuest(quest: Quest) {
    setActiveQuestId(quest.id);
    setActiveStopIndex(0);
    setTrimmed(null);
    setRoute(null);
    setPlace(null);
    setScore(null);
    setVerification(null);
    setLastScoredStopName(null);
    setBadges({});
  }

  if (loadError) {
    return (
      <main className="appShell">
        <section className="loadingPanel">
          <p className="eyebrow">SEA-GO backend</p>
          <h1>{loadError}</h1>
          <p>Start FastAPI on port 8000 or set NEXT_PUBLIC_API_BASE_URL.</p>
        </section>
      </main>
    );
  }

  if (!city || !activeQuest || !activeStop) {
    return (
      <main className="appShell">
        <section className="loadingPanel">
          <p className="eyebrow">SEA-GO</p>
          <h1>Loading quest data...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="appShell">
      <section className="mapStage" aria-label="SEA-GO quest map">
        <GrabMap
          city={city}
          stops={routeStops}
          activeStopId={activeStop.id}
          route={route}
          onStopSelect={(stopId) => {
            const idx = routeStops.findIndex((s) => s.id === stopId);
            if (idx !== -1) setActiveStopIndex(idx);
          }}
        />

        <header className="topHud">
          <div className="brandBlock">
            <div className="brandMark">SG</div>
            <div>
              <p className="eyebrow">SEA-GO</p>
              <h1>Guided city quests that fit your afternoon.</h1>
            </div>
          </div>
          <div className="hudControls">
            <label>
              <span>City</span>
              <select value={cityId} onChange={(event) => setCityId(event.target.value as CityId)}>
                {cities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Time</span>
              <input
                type="number"
                min={30}
                max={240}
                step={15}
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </label>
            <div className="hudMetric">
              <span>Badges</span>
              <strong>{completedStops}</strong>
            </div>
          </div>
        </header>

        <aside className="questRail" aria-label="Quest list">
          <div className="panelHeader">
            <p className="eyebrow">{city.neighbourhood}</p>
            <h2>Quest zones</h2>
          </div>
          <div className="questList">
            {cityQuests.map((quest) => (
              <button
                className={quest.id === activeQuest.id ? "questButton active" : "questButton"}
                key={quest.id}
                onClick={() => selectQuest(quest)}
                style={{ "--quest-color": quest.color } as CSSProperties}
              >
                <span className="questEmoji" aria-hidden>
                  {quest.emoji}
                </span>
                <span>
                  <strong>{quest.title}</strong>
                  <small>{quest.summary}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="trimBox">
            <p>
              {budget} minutes trims {activeQuest.stops.length} stops to{" "}
              <strong>{routeStops.length}</strong>.
            </p>
            <span>
              {route?.totalMinutes ?? activeTrimmed?.totalMinutes ?? 0} min route ·{" "}
              {activeTrimmed?.skippedStops ?? 0} held back
            </span>
          </div>
        </aside>

        <aside className="stopDrawer" aria-label="Active stop details">
          <div className="panelHeader">
            <p className="eyebrow">
              Stop {activeStopIndex + 1} of {routeStops.length}
            </p>
            <h2>{activeStop.name}</h2>
          </div>
          <div className="placeStrip">
            <span>{place ? (place.openNow ? "Open now" : "Closed") : "Checking"}</span>
            <span>{place ? `${place.rating.toFixed(1)} rating` : "Rating pending"}</span>
            <span>{place?.source === "live" ? "Live" : "Demo estimate"}</span>
          </div>
          <p className="lore">{activeStop.lore}</p>
          <div className="promptBox">
            <span>Photo prompt</span>
            <strong>{activeStop.prompt}</strong>
          </div>
          <div className="drawerActions">
            <button className="secondaryButton" onClick={() => setActiveStopIndex(Math.max(0, activeStopIndex - 1))}>
              Prev
            </button>
            <button className="secondaryButton" onClick={() => setActiveStopIndex(Math.min(routeStops.length - 1, activeStopIndex + 1))}>
              Walk here
            </button>
            <button className="primaryButton" onClick={() => collectPhoto()} disabled={isCollecting}>
              {isCollecting ? "Scoring..." : "Collect"}
            </button>
          </div>
          <label className="uploadLine">
            <span>Upload prepared photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) collectPhoto(file.name).catch(console.error);
              }}
            />
          </label>

          {verification && (
            <div className={verification.passed ? "verifyBox pass" : "verifyBox fail"}>
              <strong>{verification.passed ? "Location verified" : "Verification failed"}</strong>
              <span>{verification.reason}</span>
            </div>
          )}

          {score && <ScoreCard score={score} stopName={lastScoredStopName ?? activeStop.name} />}

          {questComplete && <MemoryCard quest={activeQuest} stops={routeStops} badges={badges} />}
        </aside>

        <nav className="routeChips" aria-label="Route stops">
          {routeStops.map((stop, index) => (
            <button
              key={stop.id}
              className={index === activeStopIndex ? "routeChip active" : "routeChip"}
              onClick={() => setActiveStopIndex(index)}
            >
              <span>{badges[stop.id]?.tier ?? index + 1}</span>
              {stop.name}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}


function ScoreCard({ score, stopName }: { score: PhotoScore; stopName: string }) {
  return (
    <section className="scoreCard" aria-live="polite">
      <div>
        <p className="eyebrow">
          {score.tier} badge · {stopName}
        </p>
        <strong>{score.score}/100</strong>
      </div>
      <div className="categoryGrid">
        {Object.entries(score.categories).map(([key, value]) => (
          <span key={key}>
            {categoryLabels[key as keyof PhotoScore["categories"]]}
            <b>{value}</b>
          </span>
        ))}
      </div>
      <p>{score.feedback}</p>
      <small>{score.unlockedLore}</small>
    </section>
  );
}

function MemoryCard({
  quest,
  stops,
  badges
}: {
  quest: Quest;
  stops: QuestStop[];
  badges: Record<string, BadgeRecord>;
}) {
  return (
    <section className="memoryCard">
      <p className="eyebrow">Quest badge unlocked</p>
      <h3>{quest.title}</h3>
      <div>
        {stops.map((stop) => (
          <span key={stop.id}>{badges[stop.id]?.tier ?? "Locked"}</span>
        ))}
      </div>
    </section>
  );
}
