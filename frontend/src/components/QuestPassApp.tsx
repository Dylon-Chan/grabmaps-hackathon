"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { ActiveQuest } from "@/components/questpass/teammate/ActiveQuest";
import { FlightSetup } from "@/components/questpass/teammate/FlightSetup";
import { FlightSettingsModal } from "@/components/questpass/teammate/FlightSettingsModal";
import { Passport } from "@/components/questpass/teammate/Passport";
import { QuestMap } from "@/components/questpass/teammate/QuestMap";
import { QuestSelect } from "@/components/questpass/teammate/QuestSelect";
import { StopUnlocked } from "@/components/questpass/teammate/StopUnlocked";
import { calculateDistanceMeters, requestBrowserLocation } from "@/lib/location";
import {
  badgeIdForQuest,
  toTeammateBadges,
  toTeammateNeighborhoods,
  toTeammateQuest,
  type TeammateQuest,
  type TeammateStop,
  type TeammateTimeOption
} from "@/lib/teammateQuestPass";
import type { City, PhotoScore, Quest, QuestStop, RouteLeg, TrimmedQuest, VerificationResult } from "@/lib/types";

type Screen = "setup" | "map" | "select" | "quest" | "unlocked" | "complete" | "passport";
type LocationState = "not_requested" | "loading" | "granted" | "denied";
type AirportState = "safe" | "warning" | "unsafe";
type FlightData = {
  flightDateTime: string;
  flightMinsRemaining: number;
  bufferMins: number;
  safeWindowMins: number;
  safetyStatus: unknown;
  airportArrivalTime: Date;
};
type UserLocation = { lat: number; lng: number; accuracyMeters?: number };
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
type QuestRouteState = Record<
  string,
  {
    status: "idle" | "loading" | "success" | "failed";
    estimatedRouteMins?: number | null;
    airportReturnMins?: number | null;
    safeBufferMins?: number | null;
  }
>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const DEMO_FLIGHT_MINS = 9 * 60 + 40;
const AIRPORT_TRANSIT_MINS = 45;

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getAirportState(flightMinsRemaining: number): AirportState {
  const buffer = flightMinsRemaining - AIRPORT_TRANSIT_MINS;
  if (buffer > 240) return "safe";
  if (buffer > 120) return "warning";
  return "unsafe";
}

export function QuestPassApp() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [cities, setCities] = useState<City[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeOption, setTimeOption] = useState<TeammateTimeOption | null>(null);
  const [activeQuest, setActiveQuest] = useState<TeammateQuest | null>(null);
  const [unlockedStop, setUnlockedStop] = useState<TeammateStop | null>(null);
  const [stopIdx, setStopIdx] = useState(0);
  const [totalStops, setTotalStops] = useState(0);
  const [activeStopIdx, setActiveStopIdx] = useState(0);
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);
  const [continueCallback, setContinueCallback] = useState<(() => void) | null>(null);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [userXP, setUserXP] = useState(120);
  const [transitioning, setTransitioning] = useState(false);
  const [transDir, setTransDir] = useState<"forward" | "back">("forward");
  const [locationState, setLocationState] = useState<LocationState>("not_requested");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [flightMinsRemaining, setFlightMinsRemaining] = useState(DEMO_FLIGHT_MINS);
  const [flightSettingsOpen, setFlightSettingsOpen] = useState(false);
  const [questRouteState, setQuestRouteState] = useState<QuestRouteState>({});

  const teammateQuests = useMemo(() => quests.map((quest, index) => toTeammateQuest(quest, index)), [quests]);
  const teammateBadges = useMemo(() => toTeammateBadges(quests, cities), [cities, quests]);
  const teammateNeighborhoods = useMemo(() => toTeammateNeighborhoods(quests), [quests]);
  const airportState = getAirportState(flightMinsRemaining);
  const userLevel = Math.floor(userXP / 500) + 1;

  useEffect(() => {
    async function loadData() {
      const [citiesResponse, questsResponse] = await Promise.all([
        fetch(apiUrl("/api/cities")),
        fetch(apiUrl("/api/quests?city=singapore"))
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
    if (teammateQuests.length > 0 && !activeQuest) {
      setActiveQuest(teammateQuests[0]);
    }
  }, [activeQuest, teammateQuests]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    Object.assign(window, {
      QUESTS: teammateQuests,
      BADGES: teammateBadges,
      NEIGHBORHOODS: teammateNeighborhoods,
      GrabMaps: createGrabMapsBridge(teammateQuests)
    });
  }, [teammateBadges, teammateNeighborhoods, teammateQuests]);

  const navigate = (newScreen: Screen, dir: "forward" | "back" = "forward") => {
    setTransDir(dir);
    setTransitioning(true);
    window.setTimeout(() => {
      setScreen(newScreen);
      setTransitioning(false);
    }, 220);
  };

  const requestLocation = useCallback(async () => {
    setLocationState("loading");
    const location = await requestBrowserLocation();
    if (location) {
      setUserLocation(location);
      setLocationState("granted");
      setDemoMode(false);
    } else {
      setLocationState("denied");
      setDemoMode(true);
    }
  }, []);

  const fetchQuestRoute = useCallback(
    async (quest: TeammateQuest) => {
      if (questRouteState[quest.id]?.status === "success") return;
      setQuestRouteState((current) => ({ ...current, [quest.id]: { status: "loading" } }));
      try {
        const route = await fetchRouteForStops(quest.sourceQuest.stops);
        setQuestRouteState((current) => ({
          ...current,
          [quest.id]: {
            status: "success",
            estimatedRouteMins: route.totalMinutes,
            airportReturnMins: AIRPORT_TRANSIT_MINS,
            safeBufferMins: flightMinsRemaining - quest.durationMins - AIRPORT_TRANSIT_MINS
          }
        }));
      } catch {
        setQuestRouteState((current) => ({ ...current, [quest.id]: { status: "failed" } }));
      }
    },
    [flightMinsRemaining, questRouteState]
  );

  async function prepareQuest(quest: TeammateQuest, option: TeammateTimeOption) {
    setActiveQuest(quest);
    setActiveStopIdx(0);
    setCompletedStopIds([]);
    const trimResponse = await fetch(apiUrl("/api/quests/trim"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cityId: quest.sourceQuest.cityId, questId: quest.sourceQuest.id, minutes: option.mins })
    });
    if (!trimResponse.ok) {
      navigate("quest");
      return;
    }

    const trimResult = (await trimResponse.json()) as TrimmedQuest;
    const trimmedQuest = toTeammateQuest({ ...trimResult.quest, stops: trimResult.stops }, 0);
    setActiveQuest(trimmedQuest);
  }

  function handleStopUnlocked(stop: TeammateStop, idx: number, total: number, cb: () => void) {
    setUnlockedStop(stop);
    setStopIdx(idx);
    setTotalStops(total);
    setContinueCallback(() => cb);
    verifyAndScoreStop(stop.sourceStop).catch(console.error);
    navigate("unlocked");
  }

  function handleContinue() {
    continueCallback?.();
    if (unlockedStop) {
      setCompletedStopIds((ids) => (ids.includes(unlockedStop.id) ? ids : [...ids, unlockedStop.id]));
      setActiveStopIdx((index) => Math.min(index + 1, Math.max(0, totalStops - 1)));
    }
    navigate("quest", "back");
  }

  function handleQuestComplete(quest: TeammateQuest | null) {
    if (!quest) return;
    continueCallback?.();
    if (unlockedStop) {
      setCompletedStopIds((ids) => (ids.includes(unlockedStop.id) ? ids : [...ids, unlockedStop.id]));
    }
    const badgeId = badgeIdForQuest(quest.sourceQuest);
    setEarnedBadgeIds((ids) => (ids.includes(badgeId) ? ids : [...ids, badgeId]));
    setUserXP((xp) => xp + quest.xpReward);
    navigate("complete");
  }

  async function verifyAndScoreStop(stop: QuestStop, imageName = stop.demoPhotoName) {
    const verifyResponse = await fetch(apiUrl("/api/photo/verify"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stopId: stop.id, imageName })
    });
    if (!verifyResponse.ok) return;
    const verification = (await verifyResponse.json()) as VerificationResult;
    if (!verification.passed) return;

    const scoreResponse = await fetch(apiUrl("/api/photo/score"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stopId: stop.id, verification })
    });
    if (scoreResponse.ok) {
      const score = (await scoreResponse.json()) as PhotoScore;
      setUserXP((xp) => xp + Math.max(0, Math.round(score.score / 2)));
    }
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

  if (!activeQuest || teammateQuests.length === 0) {
    return (
      <main className="qp-shell">
        <section className="qp-status-panel">
          <p className="qp-kicker">QuestPass SG</p>
          <h1>Loading quest data...</h1>
        </section>
      </main>
    );
  }

  const slideStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    overflowY: "auto",
    transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease",
    transform: transitioning ? (transDir === "forward" ? "translateX(-24px)" : "translateX(24px)") : "translateX(0)",
    opacity: transitioning ? 0 : 1
  };

  return (
    <main className="qp-shell">
      <div className="qp-phone">
        <div style={{ position: "relative", flex: 1, minHeight: "100vh", overflow: "hidden" }}>
          <div style={slideStyle}>
            {screen === "setup" && (
              <FlightSetup
                onActivate={(data: FlightData) => {
                  setFlightData(data);
                  setFlightMinsRemaining(data.flightMinsRemaining);
                  navigate("map");
                }}
                onDemoMode={() => {
                  setFlightData(null);
                  setFlightMinsRemaining(DEMO_FLIGHT_MINS);
                  navigate("map");
                }}
              />
            )}

            {screen === "map" && (
              <QuestMap
                onSelectTime={(option: TeammateTimeOption) => {
                  setTimeOption(option);
                  navigate("select");
                }}
                onOpenPassport={() => navigate("passport")}
                userXP={userXP}
                userLevel={userLevel}
                airportState={airportState}
                flightMinsRemaining={flightMinsRemaining}
                onEditFlight={() => setFlightSettingsOpen(true)}
              />
            )}

            {screen === "select" && timeOption && (
              <QuestSelect
                timeOption={timeOption}
                onSelectQuest={async (quest: TeammateQuest) => {
                  await prepareQuest(quest, timeOption);
                  navigate("quest");
                }}
                onBack={() => navigate("map", "back")}
                questRouteState={questRouteState}
                onFetchRoute={fetchQuestRoute}
                flightMinsRemaining={flightMinsRemaining}
                airportState={airportState}
              />
            )}

            {screen === "quest" && (
              <ActiveQuest
                quest={activeQuest}
                onStopUnlocked={handleStopUnlocked}
                onBack={() => navigate("select", "back")}
                onComplete={() => handleQuestComplete(activeQuest)}
                locationState={locationState}
                userLocation={userLocation}
                onRequestLocation={requestLocation}
                demoMode={demoMode}
                airportState={airportState}
                flightMinsRemaining={flightMinsRemaining}
                initialStopIdx={activeStopIdx}
                unlockedStopIds={completedStopIds}
              />
            )}

            {screen === "unlocked" && unlockedStop && (
              <StopUnlocked
                stop={unlockedStop}
                stopIdx={stopIdx}
                totalStops={totalStops}
                quest={activeQuest}
                onContinue={handleContinue}
                onComplete={() => handleQuestComplete(activeQuest)}
                userLocation={userLocation}
              />
            )}

            {screen === "complete" && (
              <QuestComplete
                quest={activeQuest}
                xpEarned={activeQuest.xpReward}
                onPassport={() => navigate("passport")}
                onMap={() => navigate("map")}
              />
            )}

            {screen === "passport" && (
              <Passport
                onBack={() => navigate("map", "back")}
                earnedBadgeIds={earnedBadgeIds}
                userXP={userXP}
                userLevel={userLevel}
              />
            )}
          </div>
        </div>
        {flightSettingsOpen && (
          <FlightSettingsModal
            flightData={flightData}
            onSave={(data: FlightData) => {
              setFlightData(data);
              setFlightMinsRemaining(data.flightMinsRemaining);
              setFlightSettingsOpen(false);
            }}
            onCancel={() => setFlightSettingsOpen(false)}
          />
        )}
      </div>
    </main>
  );
}

async function fetchRouteForStops(stops: QuestStop[]): Promise<RouteResponse> {
  const response = await fetch(apiUrl("/api/routes"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stops })
  });
  if (!response.ok) throw new Error(`Route failed: ${response.status}`);
  return (await response.json()) as RouteResponse;
}

function createGrabMapsBridge(quests: TeammateQuest[]) {
  const stops = quests.flatMap((quest) => quest.stops_data);
  const closestStop = (point: { lat: number; lng: number }) =>
    stops.reduce<TeammateStop | null>((closest, stop) => {
      if (!closest) return stop;
      const currentDistance = calculateDistanceMeters(point, { lat: stop.lat, lng: stop.lng });
      const closestDistance = calculateDistanceMeters(point, { lat: closest.lat, lng: closest.lng });
      return currentDistance < closestDistance ? stop : closest;
    }, null);

  return {
    config: {
      apiKey: null,
      countryCode: "SG",
      airportLat: 1.3644,
      airportLng: 103.9915,
      unlockRadiusDefault: 80
    },
    async searchPlace(placeQuery: string) {
      const stop = stops.find((item) => placeQuery.includes(item.name)) ?? stops[0];
      if (!stop) return null;
      const response = await fetch(apiUrl(`/api/place/${encodeURIComponent(stop.grabPlaceId)}`));
      const details = response.ok ? await response.json() : null;
      return {
        placeId: stop.grabPlaceId,
        name: details?.name ?? stop.name,
        lat: stop.lat,
        lng: stop.lng,
        address: details?.address ?? null,
        confidence: details?.source === "live" ? 0.95 : 0.72
      };
    },
    async getRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
      const source = closestStop(origin)?.sourceStop;
      const target = closestStop(destination)?.sourceStop;
      if (!source || !target) return null;
      const route = await fetchRouteForStops([source, target]);
      const distanceMeters = route.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
      return {
        durationSeconds: route.totalMinutes * 60,
        distanceMeters,
        polyline: route.legs.flatMap((leg) => leg.polyline)
      };
    },
    async getRouteToAirport(origin: { lat: number; lng: number }) {
      return {
        durationSeconds: AIRPORT_TRANSIT_MINS * 60,
        distanceMeters: Math.round(calculateDistanceMeters(origin, { lat: 1.3644, lng: 103.9915 })),
        polyline: [origin, { lat: 1.3644, lng: 103.9915 }],
        arrivalEpoch: Date.now() + AIRPORT_TRANSIT_MINS * 60 * 1000
      };
    },
    getCurrentLocation: requestBrowserLocation,
    calculateDistance: calculateDistanceMeters,
    isWithinUnlockRadius(distanceMeters: number | null, radiusMeters: number) {
      return distanceMeters !== null && distanceMeters <= radiusMeters;
    }
  };
}

function QuestComplete({
  quest,
  xpEarned,
  onPassport,
  onMap
}: {
  quest: TeammateQuest;
  xpEarned: number;
  onPassport: () => void;
  onMap: () => void;
}) {
  const badge =
    typeof window !== "undefined"
      ? (window as unknown as { BADGES?: Array<{ id: string; color: string; symbol: string; name: string }> }).BADGES?.find(
          (item) => item.id === quest.badgeId
        )
      : null;
  return (
    <div style={{ minHeight: "100vh", background: "#0b0d1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", fontFamily: "'DM Sans', sans-serif", color: "#f0f2ff" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 40%, ${quest.color}28, transparent 70%)` }} />
      <div style={{ fontSize: 64, marginBottom: 8, animation: "float 3s ease-in-out infinite", filter: `drop-shadow(0 0 24px ${quest.color})` }}>🏆</div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "rgba(240,242,255,0.35)", textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>Quest Complete</div>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 8px", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}>{quest.name}</h1>
      <p style={{ fontSize: 15, color: "rgba(240,242,255,0.5)", margin: "0 0 32px" }}>You explored Singapore like a local.</p>
      {badge && (
        <div style={{ background: badge.color + "14", border: `2px solid ${badge.color}55`, borderRadius: 20, padding: "24px 32px", marginBottom: 24, boxShadow: `0 0 40px ${badge.color}20` }}>
          <div style={{ fontSize: 48, color: badge.color, textShadow: `0 0 20px ${badge.color}`, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>{badge.symbol}</div>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>{badge.name}</div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: badge.color, textTransform: "uppercase", fontFamily: "'Space Grotesk', sans-serif" }}>Badge Earned</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "rgba(240,188,66,0.1)", border: "1px solid rgba(240,188,66,0.25)", borderRadius: 12, padding: "12px 20px" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f0bc42", fontFamily: "'Space Grotesk', sans-serif" }}>+{xpEarned}</div>
          <div style={{ fontSize: 11, color: "rgba(240,242,255,0.4)", fontWeight: 600 }}>XP EARNED</div>
        </div>
        <div style={{ background: "rgba(46,203,130,0.1)", border: "1px solid rgba(46,203,130,0.25)", borderRadius: 12, padding: "12px 20px" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#2ecb82", fontFamily: "'Space Grotesk', sans-serif" }}>{quest.stops}/{quest.stops}</div>
          <div style={{ fontSize: 11, color: "rgba(240,242,255,0.4)", fontWeight: 600 }}>STOPS DONE</div>
        </div>
      </div>
      <button onClick={onPassport} style={{ width: "100%", padding: "15px", borderRadius: 14, marginBottom: 12, background: `linear-gradient(135deg, ${quest.color}, #7c4dcc)`, border: "none", color: "white", fontWeight: 800, fontSize: 16, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>View My Passport ◈</button>
      <button onClick={onMap} style={{ width: "100%", padding: "13px", borderRadius: 14, background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,242,255,0.5)", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Back to Quest Map</button>
    </div>
  );
}
