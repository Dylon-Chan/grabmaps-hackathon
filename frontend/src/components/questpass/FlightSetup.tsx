"use client";

import { useMemo, useState } from "react";
import {
  ESTIMATED_AIRPORT_ROUTE_MINS,
  calculateAirportArrivalTime,
  calculateSafeExplorationWindow,
  calculateTimeUntilFlight,
  formatMinutes,
  getLayoverSafetyStatus,
  type LayoverSafetyStatus
} from "@/lib/flightWindow";

export type FlightData = {
  flightDateTime: string;
  flightMinsRemaining: number;
  bufferMins: number;
  safeWindowMins: number;
  safetyStatus: LayoverSafetyStatus;
  airportArrivalTime: Date;
};

function defaultFlightInput() {
  const date = new Date(Date.now() + 10 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`
  };
}

export function FlightSetup({
  onActivate,
  onDemoMode
}: {
  onActivate: (data: FlightData) => void;
  onDemoMode: () => void;
}) {
  const defaults = useMemo(defaultFlightInput, []);
  const [flightDate, setFlightDate] = useState(defaults.date);
  const [flightTime, setFlightTime] = useState(defaults.time);
  const [bufferHours, setBufferHours] = useState(2);
  const [activating, setActivating] = useState(false);

  const flightDateTime = flightDate && flightTime ? `${flightDate}T${flightTime}` : "";
  const bufferMins = bufferHours * 60;
  const flightMinsRemaining = flightDateTime ? calculateTimeUntilFlight(flightDateTime) : 0;
  const safeWindowMins = flightDateTime
    ? calculateSafeExplorationWindow(flightDateTime, bufferMins, ESTIMATED_AIRPORT_ROUTE_MINS)
    : 0;
  const airportArrivalTime = flightDateTime
    ? calculateAirportArrivalTime(flightDateTime, bufferMins)
    : new Date();
  const safetyStatus = getLayoverSafetyStatus(safeWindowMins);
  const isPast = flightMinsRemaining < 0;
  const isValid = Boolean(flightDateTime) && !isPast;

  function activate() {
    if (!isValid) return;
    setActivating(true);
    window.setTimeout(() => {
      onActivate({
        flightDateTime,
        flightMinsRemaining,
        bufferMins,
        safeWindowMins,
        safetyStatus,
        airportArrivalTime
      });
    }, 500);
  }

  return (
    <section className="qp-view-scroll qp-stars">
      <div className="qp-logo-row">
        <span className="qp-logo-mark" aria-hidden>
          ◈
        </span>
        <span className="qp-logo-text">QuestPass SG</span>
      </div>

      <header className="qp-hero">
        <h1 className="qp-hero-title">
          Turn your Singapore layover into a <span className="qp-gradient-text">quest.</span>
        </h1>
        <p className="qp-copy">
          Solve clues, unlock local places, collect Singapore memories, and get back to Changi on time.
        </p>
      </header>

      <div className="qp-card qp-activation-card">
        <div className="qp-card-header">
          <div>
            <p className="qp-kicker">Activate your QuestPass</p>
            <h2>Changi Airport · Singapore</h2>
          </div>
          <span className="qp-scan-line" aria-hidden />
        </div>

        <div className="qp-form-block">
          <p className="qp-label">When is your flight?</p>
          <div className="qp-grid-two">
            <label>
              <span>Date</span>
              <input
                className="qp-input"
                type="date"
                value={flightDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setFlightDate(event.target.value)}
              />
            </label>
            <label>
              <span>Time</span>
              <input
                className="qp-input"
                type="time"
                value={flightTime}
                onChange={(event) => setFlightTime(event.target.value)}
              />
            </label>
          </div>
          {isPast && <p className="qp-error">That flight time is in the past. Please check again.</p>}
        </div>

        <div className="qp-form-block">
          <p className="qp-label">How early to be back at Changi?</p>
          <div className="qp-chip-row">
            {[1.5, 2, 2.5, 3].map((hours) => (
              <button
                className={bufferHours === hours ? "qp-pill qp-pill-active" : "qp-pill"}
                key={hours}
                onClick={() => setBufferHours(hours)}
                type="button"
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>

        {isValid && (
          <div className="qp-safety-card" style={{ "--status-color": safetyStatus.color } as React.CSSProperties}>
            <div className="qp-safety-badge">
              <span>{safetyStatus.label}</span>
              <small>{safetyStatus.description}</small>
            </div>
            <div className="qp-stat-row">
              <div>
                <strong>{formatMinutes(flightMinsRemaining)}</strong>
                <span>until flight</span>
              </div>
              <div>
                <strong>{formatMinutes(safeWindowMins)}</strong>
                <span>safe window</span>
              </div>
              <div>
                <strong>
                  {airportArrivalTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </strong>
                <span>at Changi</span>
              </div>
            </div>
            <div className="qp-progress">
              <span style={{ width: `${Math.max(8, Math.min(100, (safeWindowMins / flightMinsRemaining) * 100))}%` }} />
            </div>
          </div>
        )}
      </div>

      <p className="qp-reassurance">We only use this to filter quests and protect your airport buffer.</p>

      <div className="qp-actions-column">
        <button className="qp-button-primary" disabled={!isValid || activating} onClick={activate} type="button">
          {activating ? "Activating QuestPass..." : "Start exploring safely"}
        </button>
        <button className="qp-button-secondary" onClick={onDemoMode} type="button">
          Try demo mode
        </button>
      </div>
    </section>
  );
}
