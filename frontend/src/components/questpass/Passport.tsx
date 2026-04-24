"use client";

import { useState } from "react";
import { badgeForQuest, type StopBadgeRecord } from "@/lib/questPass";
import type { City, Quest } from "@/lib/types";

const FUTURE_CITIES = ["Bangkok", "Bali", "Ho Chi Minh City", "Kuala Lumpur"];

export function Passport({
  city,
  quests,
  earnedQuestBadgeIds,
  stopBadges,
  userXp,
  userLevel,
  onBack
}: {
  city: City;
  quests: Quest[];
  earnedQuestBadgeIds: string[];
  stopBadges: Record<string, StopBadgeRecord>;
  userXp: number;
  userLevel: number;
  onBack: () => void;
}) {
  const [activeCity, setActiveCity] = useState(city.name);
  const earnedStopCount = Object.keys(stopBadges).length;
  const xpProgress = ((userXp % 500) / 500) * 100;

  return (
    <section className="qp-view-scroll qp-passport-view">
      <header className="qp-passport-cover">
        <button className="qp-text-button" onClick={onBack} type="button">
          Back
        </button>
        <p className="qp-kicker">Quest passport</p>
        <h1>Your discoveries</h1>
        <div className="qp-stat-row">
          <div>
            <strong>{earnedQuestBadgeIds.length}</strong>
            <span>Badges</span>
          </div>
          <div>
            <strong>{userXp}</strong>
            <span>XP</span>
          </div>
          <div>
            <strong>LV {userLevel}</strong>
            <span>Rank</span>
          </div>
        </div>
        <div className="qp-progress">
          <span style={{ width: `${xpProgress}%` }} />
        </div>
      </header>

      <div className="qp-filter-scroll">
        <button
          className={activeCity === city.name ? "qp-pill qp-pill-active" : "qp-pill"}
          onClick={() => setActiveCity(city.name)}
          type="button"
        >
          {city.name}
        </button>
        {FUTURE_CITIES.map((item) => (
          <button className="qp-pill qp-pill-locked" disabled key={item} type="button">
            {item}
          </button>
        ))}
      </div>

      {activeCity === city.name ? (
        <>
          <section className="qp-city-progress">
            <div className="qp-row qp-between">
              <strong>{city.name} Collection</strong>
              <span>
                {earnedQuestBadgeIds.length}/{quests.length} quest badges · {earnedStopCount} stop badges
              </span>
            </div>
            <div className="qp-progress">
              <span style={{ width: `${quests.length ? (earnedQuestBadgeIds.length / quests.length) * 100 : 0}%` }} />
            </div>
          </section>

          <div className="qp-badge-grid">
            {quests.map((quest) => {
              const badge = badgeForQuest(quest);
              const earned = earnedQuestBadgeIds.includes(quest.id);
              return (
                <article className={earned ? "qp-card qp-badge-card qp-badge-earned" : "qp-card qp-badge-card"} key={quest.id}>
                  <strong style={{ color: earned ? badge.color : undefined }}>{earned ? badge.symbol : "?"}</strong>
                  <span>{badge.rarity}</span>
                  <h2>{earned ? badge.name : "Locked badge"}</h2>
                  <p>{earned ? badge.description : `Complete ${quest.title} to reveal this badge.`}</p>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <section className="qp-card qp-locked-city">
          <h2>{activeCity} Pack</h2>
          <p>Complete Singapore quests to unlock the next city pack.</p>
        </section>
      )}
    </section>
  );
}
