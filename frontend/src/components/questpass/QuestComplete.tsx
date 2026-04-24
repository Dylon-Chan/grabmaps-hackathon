"use client";

import { badgeForQuest } from "@/lib/questPass";
import type { Quest } from "@/lib/types";

export function QuestComplete({
  quest,
  onClaimBadge,
  onMap
}: {
  quest: Quest;
  onClaimBadge: () => void;
  onMap: () => void;
}) {
  const badge = badgeForQuest(quest);

  return (
    <section className="qp-view-scroll qp-complete-view">
      <div className="qp-complete-mark" aria-hidden>
        ◈
      </div>
      <p className="qp-kicker">Quest complete</p>
      <h1>{quest.title}</h1>
      <p className="qp-copy">You explored the city like a local and kept your airport buffer intact.</p>

      <article className="qp-card qp-earned-badge" style={{ borderColor: quest.color }}>
        <strong style={{ color: quest.color }}>{badge.symbol}</strong>
        <h2>{badge.name}</h2>
        <p>{badge.description}</p>
        <span>{badge.rarity}</span>
      </article>

      <div className="qp-stat-row qp-complete-stats">
        <div>
          <strong>+280</strong>
          <span>XP earned</span>
        </div>
        <div>
          <strong>{quest.stops.length}</strong>
          <span>stops cleared</span>
        </div>
      </div>

      <div className="qp-actions-column">
        <button className="qp-button-primary" onClick={onClaimBadge} type="button">
          View my passport
        </button>
        <button className="qp-button-secondary" onClick={onMap} type="button">
          Back to quest map
        </button>
      </div>
    </section>
  );
}
