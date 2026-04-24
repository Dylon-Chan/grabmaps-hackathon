"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type SeaGoAppProps = {
  initialCities: City[];
  initialQuests: Quest[];
};

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

export function SeaGoApp({ initialCities, initialQuests }: SeaGoAppProps) {
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

  const city = initialCities.find((item) => item.id === cityId) ?? initialCities[0];
  const cityQuests = useMemo(
    () => initialQuests.filter((quest) => quest.cityId === cityId),
    [cityId, initialQuests]
  );
  const activeQuest = cityQuests.find((quest) => quest.id === activeQuestId) ?? cityQuests[0];
  const routeStops = useMemo(
    () => trimmed?.stops ?? activeQuest.stops.slice(0, 4),
    [activeQuest.stops, trimmed]
  );
  const activeStop = routeStops[Math.min(activeStopIndex, routeStops.length - 1)];
  const completedStops = routeStops.filter((stop) => badges[stop.id]).length;
  const questComplete = routeStops.length > 0 && completedStops === routeStops.length;

  useEffect(() => {
    const firstQuest = initialQuests.find((quest) => quest.cityId === cityId);
    if (firstQuest) {
      setActiveQuestId(firstQuest.id);
      setActiveStopIndex(0);
      setScore(null);
      setVerification(null);
      setLastScoredStopName(null);
      setBadges({});
    }
  }, [cityId, initialQuests]);

  useEffect(() => {
    async function trimQuest() {
      const response = await fetch("/api/quests/trim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cityId, questId: activeQuest.id, minutes: budget })
      });
      const data = (await response.json()) as TrimmedQuest;
      setTrimmed(data);
      setActiveStopIndex(0);
    }

    trimQuest().catch(console.error);
  }, [activeQuest.id, budget, cityId]);

  useEffect(() => {
    async function fetchRoute() {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stops: routeStops })
      });
      setRoute((await response.json()) as RouteResponse);
    }

    if (routeStops.length > 1) fetchRoute().catch(console.error);
  }, [routeStops]);

  useEffect(() => {
    async function fetchPlace() {
      const response = await fetch(`/api/place/${encodeURIComponent(activeStop.placeId)}`);
      setPlace((await response.json()) as PlaceDetails);
    }

    if (activeStop) fetchPlace().catch(console.error);
  }, [activeStop]);

  async function collectPhoto(imageName = activeStop.demoPhotoName) {
    setIsCollecting(true);
    setVerification(null);
    setScore(null);
    try {
      const verifyResponse = await fetch("/api/photo/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stopId: activeStop.id, imageName })
      });
      const verifyResult = (await verifyResponse.json()) as VerificationResult;
      setVerification(verifyResult);
      if (!verifyResult.passed) return;

      const scoreResponse = await fetch("/api/photo/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stopId: activeStop.id, verification: verifyResult })
      });
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
    setScore(null);
    setVerification(null);
    setLastScoredStopName(null);
    setBadges({});
  }

  return (
    <main className="appShell">
      <section className="mapStage" aria-label="SEA-GO quest map">
        <MapGrid city={city} quest={activeQuest} stops={routeStops} activeStopId={activeStop.id} />
        <RouteOverlay stops={routeStops} />

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
                {initialCities.map((item) => (
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
              {route?.totalMinutes ?? trimmed?.totalMinutes ?? 0} min route ·{" "}
              {trimmed?.skippedStops ?? 0} held back
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

function MapGrid({
  city,
  quest,
  stops,
  activeStopId
}: {
  city: City;
  quest: Quest;
  stops: QuestStop[];
  activeStopId: string;
}) {
  return (
    <div className={`mapGrid ${city.id}`} aria-hidden>
      <div className="mapWater" />
      <div className="questZone" style={{ "--quest-color": quest.color } as CSSProperties}>
        {quest.zoneLabel}
      </div>
      {stops.map((stop, index) => (
        <div
          key={stop.id}
          className={stop.id === activeStopId ? "mapPin active" : "mapPin"}
          style={{ left: `${stop.mapPosition.x}%`, top: `${stop.mapPosition.y}%` }}
        >
          <span>{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function RouteOverlay({ stops }: { stops: QuestStop[] }) {
  const points = stops.map((stop) => `${stop.mapPosition.x},${stop.mapPosition.y}`).join(" ");
  return (
    <svg className="routeOverlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polyline points={points} fill="none" stroke="#087f73" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
