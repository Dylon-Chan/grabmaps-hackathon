"use client";

import { badgeForQuest } from "@/lib/questPass";
import type { UnlockedStopState } from "@/components/QuestPassApp";
import type { Quest } from "@/lib/types";

export function StopUnlocked({
  quest,
  unlocked,
  totalStops,
  onContinue,
  onComplete
}: {
  quest: Quest;
  unlocked: UnlockedStopState;
  totalStops: number;
  onContinue: () => void;
  onComplete: () => void;
}) {
  const isLast = unlocked.index === totalStops - 1;
  const questBadge = badgeForQuest(quest);

  return (
    <section className="qp-view-scroll qp-unlocked-view">
      <header className="qp-unlock-banner">
        <p className="qp-kicker">
          Stop {unlocked.index + 1} of {totalStops} · {quest.title}
        </p>
        <div className="qp-unlock-mark" aria-hidden>
          ✦
        </div>
        <h1>Unlocked!</h1>
        <span style={{ color: quest.color }}>{quest.zoneLabel}</span>
      </header>

      <article className="qp-card qp-unlock-card">
        <span className="qp-card-stripe" style={{ background: quest.color }} />
        <div className="qp-card-header">
          <div>
            <h2>{unlocked.stop.name}</h2>
            <div className="qp-chip-row">
              <span className="qp-status-chip">Verified place</span>
              <span className="qp-status-chip">{unlocked.verification?.source ?? "fallback"}</span>
            </div>
          </div>
          <div className="qp-collectible" style={{ borderColor: quest.color, color: quest.color }}>
            <strong>{questBadge.symbol}</strong>
            <small>{questBadge.name}</small>
          </div>
        </div>

        <section className="qp-story-section">
          <p className="qp-label">The story</p>
          <p>{unlocked.stop.lore}</p>
        </section>

        <section className="qp-tip-box">
          <p className="qp-label">Local tip</p>
          <p>{unlocked.stop.bonusLore}</p>
        </section>

        <section className="qp-photo-challenge">
          <p className="qp-label">Photo challenge</p>
          <p>{unlocked.stop.prompt}</p>
          {unlocked.score ? (
            <div className="qp-score-result">
              <strong>{unlocked.score.score}/100</strong>
              <span>{unlocked.score.tier} badge</span>
              <small>{unlocked.score.feedback}</small>
            </div>
          ) : (
            <div className="qp-score-result qp-score-result-fail">
              <strong>Not scored</strong>
              <span>{unlocked.verification?.reason ?? "Verification did not pass."}</span>
            </div>
          )}
        </section>
      </article>

      <div className="qp-actions-column">
        {isLast ? (
          <button className="qp-button-primary" onClick={onComplete} type="button">
            Complete quest and earn badge
          </button>
        ) : (
          <button className="qp-button-primary" onClick={onContinue} type="button">
            Next stop
          </button>
        )}
      </div>
    </section>
  );
}
