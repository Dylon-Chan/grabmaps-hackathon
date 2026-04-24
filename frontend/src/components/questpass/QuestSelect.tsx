"use client";

import { useState, type CSSProperties } from "react";
import { formatMinutes } from "@/lib/flightWindow";
import { deriveQuestCard, themeLabel } from "@/lib/questPass";
import type { TimeOption } from "@/components/questpass/QuestHome";
import type { City, Quest } from "@/lib/types";

const FILTERS = ["All Quests", "Food", "Heritage", "Local Life", "Nature"] as const;

export function QuestSelect({
  city,
  quests,
  timeOption,
  flightMinsRemaining,
  onBack,
  onSelectQuest
}: {
  city: City;
  quests: Quest[];
  timeOption: TimeOption;
  flightMinsRemaining: number;
  onBack: () => void;
  onSelectQuest: (quest: Quest) => Promise<void>;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All Quests");
  const [pendingQuestId, setPendingQuestId] = useState<string | null>(null);
  const visibleQuests = quests.filter((quest) => filter === "All Quests" || themeLabel(quest.type) === filter);

  async function chooseQuest(quest: Quest) {
    setPendingQuestId(quest.id);
    try {
      await onSelectQuest(quest);
    } finally {
      setPendingQuestId(null);
    }
  }

  return (
    <section className="qp-view-scroll">
      <div className="qp-nav-row">
        <button className="qp-text-button" onClick={onBack} type="button">
          Back
        </button>
        <span className="qp-pill qp-pill-active">{timeOption.shortLabel} window</span>
        <span className="qp-flight-mini">{formatMinutes(flightMinsRemaining)}</span>
      </div>

      <header className="qp-section-head">
        <p className="qp-kicker">{city.name}</p>
        <h1>
          Choose your <span className="qp-gradient-text">mission.</span>
        </h1>
        <p className="qp-copy">Each quest is a different slice of the city. Pick your vibe.</p>
      </header>

      <div className="qp-safety-strip">
        <span>Flight in {formatMinutes(flightMinsRemaining)}</span>
        <strong>{timeOption.label} quest window selected</strong>
      </div>

      <div className="qp-filter-scroll">
        {FILTERS.map((item) => (
          <button
            className={filter === item ? "qp-pill qp-pill-active" : "qp-pill"}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="qp-card-list">
        {visibleQuests.map((quest, index) => {
          const card = deriveQuestCard(quest, timeOption.mins);
          const isPending = pendingQuestId === quest.id;
          return (
            <button
              className={card.fitsWindow ? "qp-card qp-quest-card" : "qp-card qp-quest-card qp-quest-card-muted"}
              disabled={Boolean(pendingQuestId)}
              key={quest.id}
              onClick={() => chooseQuest(quest)}
              style={{ "--quest-color": quest.color } as CSSProperties}
              type="button"
            >
              <span className="qp-card-glow" />
              <span className="qp-card-topline">
                <span>{index === 0 ? "Featured" : card.theme}</span>
                <span className="qp-badge-preview">{card.badge.rarity}</span>
              </span>
              <span className="qp-quest-identity">
                <span className="qp-theme-token">{card.icon}</span>
                <span>
                  <strong>{card.name}</strong>
                  <small>{card.tagline}</small>
                </span>
              </span>
              <span className="qp-quest-stats">
                <span>{card.durationLabel}</span>
                <span>{card.stopCountLabel}</span>
                <span>{card.fitsWindow ? "Fits window" : "Tight window"}</span>
              </span>
              <span className="qp-persona-row">
                <span>{card.neighborhood}</span>
                <span>{card.theme}</span>
                <span style={{ color: quest.color }}>{card.badge.name}</span>
              </span>
              <span className="qp-card-cta">{isPending ? "Preparing route..." : `Start ${card.name}`}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
