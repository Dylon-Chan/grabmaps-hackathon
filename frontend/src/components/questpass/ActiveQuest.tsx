"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { formatMinutes } from "@/lib/flightWindow";
import {
  calculateDistanceMeters,
  isWithinUnlockRadius,
  requestBrowserLocation,
  type LocationState,
  type UserLocation
} from "@/lib/location";
import type { StopBadgeRecord } from "@/lib/questPass";
import type { Quest, QuestStop, RouteLeg } from "@/lib/types";

type RouteResponse = {
  legs: RouteLeg[];
  totalMinutes: number;
  walkMinutes: number;
  stopMinutes: number;
  source: "live" | "fallback";
};

const UNLOCK_RADIUS_METERS = 120;

export function ActiveQuest({
  quest,
  stops,
  activeStopIndex,
  badges,
  flightMinsRemaining,
  route,
  onBack,
  onUnlockStop
}: {
  quest: Quest;
  stops: QuestStop[];
  activeStopIndex: number;
  badges: Record<string, StopBadgeRecord>;
  flightMinsRemaining: number;
  route: RouteResponse | null;
  onBack: () => void;
  onUnlockStop: (stop: QuestStop, imageName?: string) => Promise<void>;
}) {
  const [hintVisible, setHintVisible] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("not_requested");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const currentStop = stops[Math.min(activeStopIndex, stops.length - 1)];
  const completedCount = Object.keys(badges).length;
  const progress = stops.length ? (completedCount / stops.length) * 100 : 0;

  const distanceMeters = useMemo(() => {
    if (!userLocation || !currentStop) return null;
    return calculateDistanceMeters(userLocation, currentStop.coordinates);
  }, [currentStop, userLocation]);
  const withinRadius = isWithinUnlockRadius(distanceMeters, UNLOCK_RADIUS_METERS);

  async function enableLocation() {
    setLocationState("loading");
    const location = await requestBrowserLocation();
    if (!location) {
      setLocationState("denied");
      return;
    }
    setUserLocation(location);
    setLocationState("granted");
  }

  async function unlock(imageName?: string) {
    setIsUnlocking(true);
    try {
      await onUnlockStop(currentStop, imageName);
    } finally {
      setIsUnlocking(false);
    }
  }

  return (
    <section className="qp-view-scroll">
      <div className="qp-buffer-bar" style={{ "--quest-color": quest.color } as CSSProperties}>
        <span>Airport buffer</span>
        <strong>{formatMinutes(flightMinsRemaining)} to flight</strong>
      </div>

      <div className="qp-nav-row">
        <button className="qp-text-button" onClick={onBack} type="button">
          Quests
        </button>
        <span className="qp-quest-title">{quest.title}</span>
        <span className="qp-xp-chip">{route ? `${route.totalMinutes}m` : "Route"}</span>
      </div>

      <section className="qp-progress-block">
        <div className="qp-row qp-between">
          <span className="qp-label">Quest progress</span>
          <span>
            {completedCount}/{stops.length} stops
          </span>
        </div>
        <div className="qp-progress">
          <span style={{ width: `${progress}%`, background: quest.color }} />
        </div>
      </section>

      <div className="qp-timeline">
        {stops.map((stop, index) => {
          const isDone = Boolean(badges[stop.id]);
          const isCurrent = index === activeStopIndex;
          return (
            <div className="qp-timeline-item" key={stop.id}>
              <span
                className={isCurrent ? "qp-dot qp-dot-current" : isDone ? "qp-dot qp-dot-done" : "qp-dot"}
                style={{ "--quest-color": quest.color } as CSSProperties}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <small>{isCurrent ? "Now" : isDone ? stop.name : "Locked"}</small>
            </div>
          );
        })}
      </div>

      <div className="qp-chip-row qp-location-row">
        <span className="qp-status-chip">{route?.source === "live" ? "Live route" : "Demo route"}</span>
        <span className="qp-status-chip">
          {locationState === "granted" && distanceMeters !== null
            ? `${Math.round(distanceMeters)}m away`
            : locationState === "loading"
              ? "Locating"
              : locationState === "denied"
                ? "Demo mode"
                : "Location off"}
        </span>
        <span className="qp-status-chip">{UNLOCK_RADIUS_METERS}m radius</span>
      </div>

      <article className="qp-card qp-stop-card" style={{ "--quest-color": quest.color } as CSSProperties}>
        <div className="qp-card-header">
          <div>
            <p className="qp-kicker">
              Stop {activeStopIndex + 1} of {stops.length}
            </p>
            <h1>{currentStop.name}</h1>
          </div>
          <span className="qp-theme-token">{quest.emoji}</span>
        </div>
        <div className="qp-clue-body">
          <p className="qp-label">Clue</p>
          <p className="qp-clue-text">"{currentStop.prompt}"</p>
          {hintVisible && <p className="qp-hint-box">{currentStop.lore}</p>}
        </div>
        <div className="qp-actions-column">
          {locationState === "not_requested" && (
            <button className="qp-button-secondary" onClick={enableLocation} type="button">
              Enable location
            </button>
          )}
          {locationState === "granted" && withinRadius && (
            <button className="qp-button-primary" disabled={isUnlocking} onClick={() => unlock()} type="button">
              Unlock stop
            </button>
          )}
          {locationState === "granted" && !withinRadius && (
            <button className="qp-button-secondary" type="button">
              Get directions
            </button>
          )}
          <button className="qp-button-primary" disabled={isUnlocking} onClick={() => unlock()} type="button">
            {isUnlocking ? "Verifying..." : "Simulate arrival"}
          </button>
          <button className="qp-button-secondary" onClick={() => setHintVisible((visible) => !visible)} type="button">
            {hintVisible ? "Hide hint" : "Show hint"}
          </button>
          <label className="qp-upload-button">
            Upload prepared photo
            <input
              accept="image/*"
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) unlock(file.name).catch(console.error);
              }}
            />
          </label>
        </div>
      </article>
    </section>
  );
}
