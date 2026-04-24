// @ts-nocheck
"use client";
import * as React from "react";

// Screen 5: Passport & Badge Collection
export const Passport = ({ onBack, earnedBadgeIds, userXP, userLevel }) => {
  const [activeCity, setActiveCity] = React.useState('Singapore');
  const cities = ['Singapore', 'Bangkok', 'Bali', 'Ho Chi Minh City', 'Kuala Lumpur'];
  const cityIcons = { 'Singapore': '🦁', 'Bangkok': '🏯', 'Bali': '🌺', 'Ho Chi Minh City': '🛵', 'Kuala Lumpur': '🏙' };
  const cityLocked = { 'Singapore': false, 'Bangkok': true, 'Bali': true, 'Ho Chi Minh City': true, 'Kuala Lumpur': true };
  const rarityLabel = { common: 'COMMON', uncommon: 'RARE', rare: 'EPIC', legendary: 'LEGENDARY' };
  const rarityColor = { common: '#2ecb82', uncommon: '#7c4dcc', rare: '#f0bc42', legendary: '#e040a0' };

  const filteredBadges = window.BADGES.filter(b => {
    if (activeCity === 'Singapore') return b.city === 'Singapore';
    return b.city === activeCity;
  });

  const sgEarned = window.BADGES.filter(b => b.city === 'Singapore' && earnedBadgeIds.includes(b.id)).length;
  const sgTotal = window.BADGES.filter(b => b.city === 'Singapore').length;

  return (
    <div style={ppStyles.root}>
      {/* Passport cover area */}
      <div style={ppStyles.coverArea}>
        <div style={ppStyles.coverPattern} />
        <div style={ppStyles.coverContent}>
          <button onClick={onBack} style={ppStyles.backBtn}>← Back</button>
          <div style={ppStyles.passportLabel}>QUEST PASSPORT</div>
          <h2 style={ppStyles.passportTitle}>Your Discoveries</h2>
          <div style={ppStyles.passportStats}>
            <div style={ppStyles.stat}>
              <span style={ppStyles.statNum}>{earnedBadgeIds.length}</span>
              <span style={ppStyles.statLbl}>Badges</span>
            </div>
            <div style={ppStyles.statDivider} />
            <div style={ppStyles.stat}>
              <span style={ppStyles.statNum}>{userXP}</span>
              <span style={ppStyles.statLbl}>XP</span>
            </div>
            <div style={ppStyles.statDivider} />
            <div style={ppStyles.stat}>
              <span style={ppStyles.statNum}>LV {userLevel}</span>
              <span style={ppStyles.statLbl}>Rank</span>
            </div>
          </div>
          {/* XP progress */}
          <div style={ppStyles.xpSection}>
            <div style={ppStyles.xpRow}>
              <span style={ppStyles.xpLabel}>Progress to Level {userLevel + 1}</span>
              <span style={ppStyles.xpVal}>{userXP % 500}/500 XP</span>
            </div>
            <div style={ppStyles.xpBar}>
              <div style={{ ...ppStyles.xpFill, width: `${((userXP % 500) / 500) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* City selector */}
      <div style={ppStyles.cityScroll}>
        {cities.map(city => (
          <button
            key={city}
            onClick={() => !cityLocked[city] && setActiveCity(city)}
            style={{
              ...ppStyles.cityTab,
              ...(activeCity === city ? ppStyles.cityTabActive : {}),
              ...(cityLocked[city] ? ppStyles.cityTabLocked : {}),
            }}
          >
            <span style={{ fontSize: 16 }}>{cityIcons[city]}</span>
            <span style={{ fontSize: 11 }}>{city === 'Ho Chi Minh City' ? 'HCMC' : city}</span>
            {cityLocked[city] && <span style={ppStyles.lockOverlay}>🔒</span>}
          </button>
        ))}
      </div>

      {/* Singapore progress bar */}
      {activeCity === 'Singapore' && (
        <div style={ppStyles.cityProgress}>
          <div style={ppStyles.cityProgressRow}>
            <span style={ppStyles.cityProgressLabel}>🦁 Singapore Collection</span>
            <span style={ppStyles.cityProgressFrac}>{sgEarned}/{sgTotal} badges</span>
          </div>
          <div style={ppStyles.cityProgressBar}>
            <div style={{ ...ppStyles.cityProgressFill, width: `${(sgEarned / sgTotal) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Locked city teaser */}
      {cityLocked[activeCity] && (
        <div style={ppStyles.lockedCity}>
          <div style={{ fontSize: 48 }}>{cityIcons[activeCity]}</div>
          <h3 style={ppStyles.lockedCityTitle}>{activeCity} Pack</h3>
          <p style={ppStyles.lockedCityText}>Complete Singapore quests to unlock the {activeCity} city pack and earn new badges.</p>
          <div style={ppStyles.lockedCityProgress}>
            <div style={ppStyles.lockedReq}>
              <span style={{ color: '#f0bc42' }}>★</span> Complete 3 Singapore quests
            </div>
          </div>
        </div>
      )}

      {/* Badge grid */}
      {!cityLocked[activeCity] && (
        <div style={ppStyles.badgeGrid}>
          {filteredBadges.map(badge => {
            const earned = earnedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                style={{
                  ...ppStyles.badgeCard,
                  ...(earned ? { borderColor: badge.color + '55', boxShadow: `0 0 20px ${badge.color}18` } : ppStyles.badgeCardLocked),
                }}
              >
                {/* Badge symbol */}
                <div style={{
                  ...ppStyles.badgeSymbol,
                  color: earned ? badge.color : 'rgba(255,255,255,0.15)',
                  textShadow: earned ? `0 0 16px ${badge.color}` : 'none',
                  filter: earned ? `drop-shadow(0 0 8px ${badge.color}88)` : 'none',
                }}>
                  {earned ? badge.symbol : '?'}
                </div>

                {/* Rarity ribbon */}
                <div style={{
                  ...ppStyles.rarityRibbon,
                  color: earned ? rarityColor[badge.rarity] : 'rgba(255,255,255,0.2)',
                }}>
                  {rarityLabel[badge.rarity]}
                </div>

                {/* Badge name */}
                <div style={{
                  ...ppStyles.badgeName,
                  color: earned ? '#f0f2ff' : 'rgba(255,255,255,0.25)',
                }}>
                  {earned ? badge.name : '???'}
                </div>

                <div style={{
                  ...ppStyles.badgeDesc,
                  color: earned ? 'rgba(240,242,255,0.4)' : 'rgba(255,255,255,0.15)',
                }}>
                  {earned ? badge.description : 'Complete quest to reveal'}
                </div>

                {/* Earned stamp */}
                {earned && (
                  <div style={{ ...ppStyles.earnedStamp, borderColor: badge.color + '66', color: badge.color }}>
                    ✓ EARNED
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SEA expansion CTA */}
      {!cityLocked[activeCity] && (
        <div style={ppStyles.seaCta}>
          <div style={ppStyles.seaCtaIcon}>🌏</div>
          <div>
            <div style={ppStyles.seaCtaTitle}>Keep collecting across SEA</div>
            <div style={ppStyles.seaCtaSub}>Bangkok · Bali · Ho Chi Minh City · Kuala Lumpur</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ppStyles = {
  root: {
    minHeight: '100vh', background: '#0b0d1a', color: '#f0f2ff',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex', flexDirection: 'column', paddingBottom: 40,
  },
  coverArea: {
    background: 'linear-gradient(135deg, #1a0f2e, #0f1a2e)',
    position: 'relative', overflow: 'hidden',
  },
  coverPattern: {
    position: 'absolute', inset: 0, opacity: 0.07,
    backgroundImage: `repeating-linear-gradient(45deg, #e040a0 0px, #e040a0 1px, transparent 0px, transparent 50%)`,
    backgroundSize: '20px 20px',
  },
  coverContent: { padding: '20px 20px 24px', position: 'relative', zIndex: 2 },
  backBtn: {
    background: 'none', border: 'none', color: 'rgba(240,242,255,0.5)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0,
    marginBottom: 16, display: 'block',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  passportLabel: {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
    color: 'rgba(240,242,255,0.35)', textTransform: 'uppercase',
    marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif",
  },
  passportTitle: {
    fontSize: 28, fontWeight: 900, margin: '0 0 20px',
    fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em',
    background: 'linear-gradient(90deg, white, rgba(240,242,255,0.7))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  passportStats: {
    display: 'flex', gap: 0, marginBottom: 20,
    background: 'rgba(255,255,255,0.05)', borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  stat: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '14px 0',
  },
  statNum: {
    fontSize: 20, fontWeight: 900,
    fontFamily: "'Space Grotesk', sans-serif",
    background: 'linear-gradient(90deg, #f0bc42, #f57c30)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  statLbl: {
    fontSize: 10, color: 'rgba(240,242,255,0.35)',
    fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  statDivider: { width: 1, background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' },
  xpSection: {},
  xpRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { fontSize: 12, color: 'rgba(240,242,255,0.4)', fontWeight: 600 },
  xpVal: { fontSize: 12, color: '#f0bc42', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" },
  xpBar: {
    height: 5, background: 'rgba(255,255,255,0.08)',
    borderRadius: 3, overflow: 'hidden',
  },
  xpFill: {
    height: '100%', background: 'linear-gradient(90deg, #f0bc42, #f57c30)',
    borderRadius: 3, transition: 'width 0.6s ease',
  },
  cityScroll: {
    display: 'flex', gap: 8, padding: '16px 16px 0',
    overflowX: 'auto', scrollbarWidth: 'none',
  },
  cityTab: {
    flexShrink: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4, padding: '10px 14px',
    borderRadius: 14, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(240,242,255,0.5)', cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
    position: 'relative', minWidth: 64,
  },
  cityTabActive: {
    background: 'rgba(224,64,160,0.15)', border: '1px solid rgba(224,64,160,0.35)',
    color: '#e040a0',
  },
  cityTabLocked: { cursor: 'default', opacity: 0.5 },
  lockOverlay: {
    position: 'absolute', top: -4, right: -4, fontSize: 10,
  },
  cityProgress: { padding: '16px 16px 0' },
  cityProgressRow: {
    display: 'flex', justifyContent: 'space-between', marginBottom: 6,
  },
  cityProgressLabel: { fontSize: 13, fontWeight: 700, color: 'rgba(240,242,255,0.7)' },
  cityProgressFrac: { fontSize: 12, color: '#f0bc42', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" },
  cityProgressBar: {
    height: 4, background: 'rgba(255,255,255,0.08)',
    borderRadius: 2, overflow: 'hidden',
  },
  cityProgressFill: {
    height: '100%', background: 'linear-gradient(90deg, #e040a0, #7c4dcc)',
    borderRadius: 2, transition: 'width 0.6s ease',
  },
  lockedCity: {
    margin: '24px 16px', padding: '32px 20px',
    background: 'rgba(255,255,255,0.03)', borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.07)',
    textAlign: 'center',
  },
  lockedCityTitle: {
    fontSize: 22, fontWeight: 800, margin: '12px 0 8px',
    fontFamily: "'Space Grotesk', sans-serif",
    color: 'rgba(240,242,255,0.4)',
  },
  lockedCityText: {
    fontSize: 14, color: 'rgba(240,242,255,0.35)', lineHeight: 1.6,
    margin: '0 0 16px',
  },
  lockedCityProgress: {},
  lockedReq: {
    fontSize: 13, color: 'rgba(240,242,255,0.4)',
    display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
  },
  badgeGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 12, padding: '16px 16px 0',
  },
  badgeCard: {
    background: '#141626', borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.07)',
    padding: '16px 12px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 6, position: 'relative',
    transition: 'all 0.3s',
  },
  badgeCardLocked: {
    border: '1px solid rgba(255,255,255,0.05)',
    opacity: 0.6,
  },
  badgeSymbol: {
    fontSize: 32, fontWeight: 900, lineHeight: 1,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  rarityRibbon: {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.12em',
    textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif",
  },
  badgeName: {
    fontSize: 13, fontWeight: 800, textAlign: 'center',
    fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em',
  },
  badgeDesc: {
    fontSize: 10, textAlign: 'center', lineHeight: 1.4,
  },
  earnedStamp: {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
    border: '1px solid', borderRadius: 4, padding: '2px 6px',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  seaCta: {
    margin: '20px 16px 0',
    background: 'linear-gradient(135deg, rgba(61,143,245,0.1), rgba(124,77,204,0.1))',
    border: '1px solid rgba(61,143,245,0.2)', borderRadius: 16,
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
  },
  seaCtaIcon: { fontSize: 32 },
  seaCtaTitle: { fontSize: 15, fontWeight: 700, marginBottom: 3, fontFamily: "'Space Grotesk', sans-serif" },
  seaCtaSub: { fontSize: 12, color: 'rgba(240,242,255,0.4)' },
};

