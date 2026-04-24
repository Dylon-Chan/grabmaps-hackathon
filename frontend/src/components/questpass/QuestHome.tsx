"use client";

import { useState, type CSSProperties } from "react";
import { formatMinutes } from "@/lib/flightWindow";
import type { FlightData } from "@/components/questpass/FlightSetup";
import type { City, Quest } from "@/lib/types";

export type TimeOption = {
  label: string;
  mins: number;
  shortLabel: string;
};

const TIME_OPTIONS: TimeOption[] = [
  { label: "2 hour", mins: 120, shortLabel: "2h" },
  { label: "4 hour", mins: 240, shortLabel: "4h" },
  { label: "8 hour", mins: 480, shortLabel: "8h" },
  { label: "24 hour", mins: 1440, shortLabel: "24h" },
  { label: "48 hour", mins: 2880, shortLabel: "48h" }
];

export function QuestHome({
  city,
  cities,
  quests,
  userXp,
  userLevel,
  flightMinsRemaining,
  flightData,
  onCityChange,
  onSelectTime,
  onOpenPassport
}: {
  city: City;
  cities: City[];
  quests: Quest[];
  userXp: number;
  userLevel: number;
  flightMinsRemaining: number;
  flightData: FlightData | null;
  onCityChange: (cityId: City["id"]) => void;
  onSelectTime: (option: TimeOption) => void;
  onOpenPassport: () => void;
}) {
  const [selectedTime, setSelectedTime] = useState<TimeOption | null>(null);
  const xpProgress = (userXp % 500) / 5;

  return (
    <section className="qp-view-scroll qp-stars">
      <div className="qp-topbar">
        <div className="qp-xp-pill">
          <strong>LV {userLevel}</strong>
          <span className="qp-xp-track">
            <span style={{ width: `${xpProgress}%` }} />
          </span>
          <small>{userXp} XP</small>
        </div>
        <button className="qp-flight-pill" type="button" title={flightData ? "Flight window active" : "Demo flight window"}>
          {formatMinutes(flightMinsRemaining)}
          <span />
        </button>
      </div>

      <div className="qp-home-hero">
        <div className="qp-logo-row">
          <span className="qp-logo-mark" aria-hidden>
            ◈
          </span>
          <span className="qp-logo-text">QuestPass SG</span>
        </div>
        <h1 className="qp-hero-title">
          Turn your layover into a <span className="qp-gradient-text">quest.</span>
        </h1>
        <p className="qp-copy">Solve clues. Unlock places. Collect Singapore.</p>
      </div>

      <label className="qp-city-picker">
        <span>City pack</span>
        <select value={city.id} onChange={(event) => onCityChange(event.target.value as City["id"])}>
          {cities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <div className="qp-map-card" aria-label={`${city.name} quest zones`}>
        <SingaporeQuestMap quests={quests} />
        <div className="qp-nearby-chip">{quests.length} quests detected nearby</div>
      </div>

      <section className="qp-time-section">
        <p className="qp-label">How long do you have?</p>
        <div className="qp-time-pills">
          {TIME_OPTIONS.map((option) => (
            <button
              className={selectedTime?.mins === option.mins ? "qp-pill qp-pill-active" : "qp-pill"}
              key={option.mins}
              onClick={() => setSelectedTime(option)}
              type="button"
            >
              {option.shortLabel}
            </button>
          ))}
        </div>
      </section>

      <div className="qp-actions-column">
        <button
          className="qp-button-primary"
          disabled={!selectedTime}
          onClick={() => selectedTime && onSelectTime(selectedTime)}
          type="button"
        >
          {selectedTime ? `Begin Quest · ${selectedTime.shortLabel}` : "Select your time above"}
        </button>
        <button className="qp-button-secondary" onClick={onOpenPassport} type="button">
          My Passport
        </button>
      </div>
    </section>
  );
}

function SingaporeQuestMap({ quests }: { quests: Quest[] }) {
  const points = quests.slice(0, 5).map((quest, index) => ({
    quest,
    x: 68 + index * 46,
    y: [104, 80, 116, 92, 128][index] ?? 104
  }));

  return (
    <svg className="qp-singapore-map" viewBox="0 0 340 200" role="img" aria-label="Stylized Singapore quest map">
      <defs>
        <radialGradient id="qpIsland" cx="50%" cy="50%" r="62%">
          <stop offset="0%" stopColor="#1e2540" />
          <stop offset="100%" stopColor="#0d1020" />
        </radialGradient>
      </defs>
      <rect width="340" height="200" rx="16" fill="#080c18" />
      {Array.from({ length: 10 }).map((_, index) => (
        <line key={`h-${index}`} x1="0" x2="340" y1={index * 20} y2={index * 20} stroke="rgba(61,143,245,0.06)" />
      ))}
      {Array.from({ length: 18 }).map((_, index) => (
        <line key={`v-${index}`} x1={index * 20} x2={index * 20} y1="0" y2="200" stroke="rgba(61,143,245,0.06)" />
      ))}
      <path
        d="M 30,100 C 38,62 72,38 118,32 C 158,27 204,30 248,43 C 292,56 322,78 324,100 C 326,123 296,146 248,154 C 204,162 158,158 112,150 C 62,141 24,126 30,100 Z"
        fill="url(#qpIsland)"
        stroke="rgba(61,143,245,0.4)"
        strokeWidth="1.5"
      />
      <path
        d="M 44 92 C 96 76, 160 70, 296 96"
        fill="none"
        stroke="rgba(224,64,160,0.24)"
        strokeDasharray="4 4"
      />
      <path
        d="M 58 118 C 116 104, 188 102, 304 124"
        fill="none"
        stroke="rgba(240,188,66,0.24)"
        strokeDasharray="4 4"
      />
      {points.map(({ quest, x, y }) => (
        <g key={quest.id} style={{ "--quest-color": quest.color } as CSSProperties}>
          <circle cx={x} cy={y} r="22" fill={quest.color} opacity="0.12" />
          <circle cx={x} cy={y} r="8" fill={quest.color} />
          <circle cx={x} cy={y} r="8" fill="none" stroke="white" strokeOpacity="0.55" />
          <text x={x} y={y + 24} textAnchor="middle" fill="rgba(240,242,255,0.7)" fontSize="8">
            {quest.zoneLabel.slice(0, 13)}
          </text>
        </g>
      ))}
    </svg>
  );
}
