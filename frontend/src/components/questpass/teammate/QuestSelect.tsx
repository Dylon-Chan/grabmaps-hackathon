// @ts-nocheck
"use client";
import * as React from "react";

// Screen 2: Quest Selection — with route-aware ETA placeholders
export const QuestSelect = ({ timeOption, onSelectQuest, onBack, questRouteState, onFetchRoute, flightMinsRemaining, airportState }) => {
  const [filter, setFilter] = React.useState('all');
  const [hoveredId, setHoveredId] = React.useState(null);

  const filters = [
    { id: 'all', label: 'All Quests' },
    { id: 'food', label: 'Food' },
    { id: 'heritage', label: 'Heritage' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'local life', label: 'Local Life' },
  ];

  const difficultyStars = (d) => Array.from({ length: 3 }).map((_, i) => (
    <span key={i} style={{ color: i < d ? '#f0bc42' : 'rgba(255,255,255,0.15)', fontSize: 11 }}>★</span>
  ));

  const rarityLabel = { common: 'COMMON', uncommon: 'RARE', rare: 'EPIC', legendary: 'LEGENDARY' };
  const rarityColor = { common: '#2ecb82', uncommon: '#7c4dcc', rare: '#f0bc42', legendary: '#e040a0' };
  const filtered = window.QUESTS.filter(q => filter === 'all' || q.theme === filter);
  const fits = (q) => q.durationMins <= timeOption.mins;

  // Airport buffer color
  const bufferColor = { safe: '#2ecb82', warning: '#f0bc42', unsafe: '#f57c30' }[airportState];
  const bufferIcon = { safe: '🛡', warning: '⚠', unsafe: '🚨' }[airportState];
  const flightH = Math.floor(flightMinsRemaining / 60);
  const flightM = flightMinsRemaining % 60;

  // Route ETA row for a quest
  const RouteEtaRow = ({ quest }) => {
    const rs = questRouteState?.[quest.id];
    React.useEffect(() => {
      if (!rs) onFetchRoute(quest);
    }, [quest.id]);

    if (!rs || rs.status === 'idle') return null;

    if (rs.status === 'loading') return (
      <div style={qsStyles.routeRow}>
        <div style={qsStyles.routeLoadingDot} />
        <span style={qsStyles.routeMuted}>Calculating route…</span>
      </div>
    );

    if (rs.status === 'failed') return (
      <div style={qsStyles.routeRow}>
        <span style={{ ...qsStyles.routeChip, color: 'rgba(240,242,255,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}>
          Route unavailable
        </span>
      </div>
    );

    const fitsWindow = quest.durationMins <= timeOption.mins;
    const bufferOk = rs.safeBufferMins === null ? null : rs.safeBufferMins > 120;

    return (
      <div style={qsStyles.routeRow}>
        {rs.estimatedRouteMins !== null ? (
          <span style={{ ...qsStyles.routeChip, color: '#3d8ff5', borderColor: 'rgba(61,143,245,0.3)' }}>
            🚇 ~{rs.estimatedRouteMins}m travel
          </span>
        ) : (
          <span style={{ ...qsStyles.routeChip, color: 'rgba(240,242,255,0.35)', borderColor: 'rgba(255,255,255,0.08)' }}>
            🚇 Route TBD
          </span>
        )}
        {rs.airportReturnMins !== null ? (
          <span style={{ ...qsStyles.routeChip, color: bufferColor, borderColor: bufferColor + '44' }}>
            ✈ +{rs.airportReturnMins}m to airport
          </span>
        ) : (
          <span style={{ ...qsStyles.routeChip, color: 'rgba(240,242,255,0.35)', borderColor: 'rgba(255,255,255,0.08)' }}>
            ✈ Airport ETA TBD
          </span>
        )}
        <span style={{
          ...qsStyles.routeChip,
          color: fitsWindow ? '#2ecb82' : '#f57c30',
          borderColor: fitsWindow ? 'rgba(46,203,130,0.3)' : 'rgba(245,124,48,0.3)',
        }}>
          {fitsWindow ? '✓ Fits window' : '⚠ Over time'}
        </span>
        {rs.safeBufferMins !== null && (
          <span style={{
            ...qsStyles.routeChip,
            color: bufferOk ? '#2ecb82' : '#f57c30',
            borderColor: (bufferOk ? 'rgba(46,203,130,0.3)' : 'rgba(245,124,48,0.3)'),
          }}>
            {bufferOk ? '🛡 Safe buffer' : '⚠ Tight buffer'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={qsStyles.root}>
      {/* Header */}
      <div style={qsStyles.header}>
        <button onClick={onBack} style={qsStyles.backBtn}>← Back</button>
        <div style={qsStyles.timeChip}>
          <span style={{ color: '#f0bc42' }}>⏱</span> {timeOption.label} window
        </div>
        <div style={{ ...qsStyles.airportMini, color: bufferColor }}>
            <span>✈</span>
          <span>{flightH}h{flightM}m</span>
        </div>
      </div>

      {/* Title */}
      <div style={qsStyles.titleBlock}>
        <h2 style={qsStyles.title}>Choose your<br /><span style={qsStyles.titleAccent}>mission.</span></h2>
        <p style={qsStyles.subtitle}>Each quest is a different slice of Singapore. Pick your vibe.</p>
      </div>

      {/* Airport Safety Bar */}
      <div style={{ ...qsStyles.safetyBar, borderColor: bufferColor + '33', background: bufferColor + '0d' }}>
        <span style={qsStyles.safetyText}>
          Flight in <strong style={{ color: bufferColor }}>{flightH}h {flightM}m</strong>
          {airportState === 'safe' && ' · All quests fit your window'}
          {airportState === 'warning' && ' · Short quests recommended'}
          {airportState === 'unsafe' && ' · Head to airport soon!'}
        </span>
        <div style={{ ...qsStyles.safetyDot, background: bufferColor, boxShadow: `0 0 6px ${bufferColor}` }} />
      </div>

      {/* Filters */}
      <div style={qsStyles.filterScroll}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ ...qsStyles.filterPill, ...(filter === f.id ? qsStyles.filterActive : {}) }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Quest Cards */}
      <div style={qsStyles.cardList}>
        {filtered.map((quest) => {
          const canFit = fits(quest);
          const isHovered = hoveredId === quest.id;
          const badge = window.BADGES.find(b => b.id === quest.badgeId);
          return (
            <div key={quest.id}
              onMouseEnter={() => setHoveredId(quest.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => !quest.locked && onSelectQuest(quest)}
              style={{
                ...qsStyles.card,
                ...(quest.featured ? qsStyles.cardFeatured : {}),
                ...(quest.locked ? qsStyles.cardLocked : {}),
                ...(isHovered && !quest.locked ? qsStyles.cardHovered : {}),
                opacity: (!canFit && !quest.locked) ? 0.55 : 1,
              }}>
              <div style={{ ...qsStyles.cardGradient, background: `linear-gradient(135deg, ${quest.gradient[0]}, ${quest.gradient[1]})` }} />

              {/* Top row */}
              <div style={qsStyles.cardTop}>
                <div style={qsStyles.cardTopLeft}>
                  {quest.featured && <span style={qsStyles.featuredTag}>★ FEATURED</span>}
                  {quest.recommended && !quest.featured && <span style={qsStyles.recommendedTag}>↗ RECOMMENDED</span>}
                  {quest.locked && <span style={qsStyles.lockedTag}>🔒 LOCKED</span>}
                  {!canFit && !quest.locked && <span style={qsStyles.tooLongTag}>⚠ Needs more time</span>}
                </div>
                {badge && (
                  <div style={{ ...qsStyles.badgePreview, borderColor: badge.color + '44', background: badge.color + '18' }}>
                    <span style={{ fontSize: 14, color: badge.color }}>{badge.symbol}</span>
                    <span style={{ ...qsStyles.badgeRarityText, color: rarityColor[badge.rarity] }}>{rarityLabel[badge.rarity]}</span>
                  </div>
                )}
              </div>

              {/* Identity */}
              <div style={qsStyles.cardMid}>
                <div style={{ ...qsStyles.themeOrb, background: quest.color + '22', border: `1px solid ${quest.color}44` }}>
                  <span style={{ fontSize: 18, color: quest.color }}>
                    {quest.theme === 'heritage' ? '🏛' : quest.theme === 'food' ? '🍜' : quest.theme === 'architecture' ? '📸' : '🌿'}
                  </span>
                </div>
                <div>
                  <h3 style={qsStyles.questName}>{quest.name}</h3>
                  <p style={qsStyles.questTagline}>{quest.tagline}</p>
                </div>
              </div>

              {/* Stats */}
              <div style={qsStyles.statsRow}>
                <div style={qsStyles.stat}><span style={qsStyles.statIcon}>⏱</span><span style={qsStyles.statVal}>{quest.duration}</span></div>
                <div style={qsStyles.statDivider} />
                <div style={qsStyles.stat}><span style={qsStyles.statIcon}>📍</span><span style={qsStyles.statVal}>{quest.stops} stops</span></div>
                <div style={qsStyles.statDivider} />
                <div style={qsStyles.stat}><span style={qsStyles.statIcon}>⚡</span><span style={qsStyles.statVal}>{quest.xpReward} XP</span></div>
                <div style={qsStyles.statDivider} />
                <div style={qsStyles.stat}>{difficultyStars(quest.difficulty)}</div>
              </div>

              {/* Route ETA row */}
              {!quest.locked && <RouteEtaRow quest={quest} />}

              {/* Persona tags */}
              <div style={qsStyles.personaRow}>
                {quest.persona.map(p => <span key={p} style={qsStyles.personaTag}>{p}</span>)}
                <span style={{ ...qsStyles.personaTag, color: quest.color, borderColor: quest.color + '44', background: quest.color + '12' }}>#{quest.vibe}</span>
              </div>

              {/* CTA */}
              {!quest.locked ? (
                <div style={{ ...qsStyles.cardCta, background: quest.color + '15', borderTop: `1px solid ${quest.color}22` }}>
                  <span style={{ color: quest.color, fontWeight: 700, fontSize: 13 }}>
                    {isHovered ? 'Start this quest →' : `${quest.neighborhood} · ${quest.duration}`}
                  </span>
                </div>
              ) : (
                <div style={{ ...qsStyles.cardCta, background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(240,242,255,0.3)', fontSize: 13 }}>Complete other quests to unlock</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const qsStyles = {
  root: { minHeight: '100vh', background: '#0b0d1a', color: '#f0f2ff', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', paddingBottom: 40 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 20, background: 'rgba(11,13,26,0.95)', backdropFilter: 'blur(12px)' },
  backBtn: { background: 'none', border: 'none', color: 'rgba(240,242,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  timeChip: { background: 'rgba(240,188,66,0.12)', border: '1px solid rgba(240,188,66,0.25)', borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 600, color: '#f0bc42', display: 'flex', alignItems: 'center', gap: 5 },
  airportMini: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" },
  titleBlock: { padding: '24px 20px 8px' },
  title: { fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.15, letterSpacing: '-0.02em' },
  titleAccent: { background: 'linear-gradient(90deg, #e040a0, #7c4dcc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: 14, color: 'rgba(240,242,255,0.45)', margin: 0 },
  safetyBar: { margin: '12px 20px', border: '1px solid', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(240,242,255,0.6)', transition: 'all 0.3s' },
  safetyText: { flex: 1 },
  safetyDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  filterScroll: { display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' },
  filterPill: { flexShrink: 0, padding: '7px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,242,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", whiteSpace: 'nowrap' },
  filterActive: { background: 'rgba(224,64,160,0.15)', border: '1px solid rgba(224,64,160,0.4)', color: '#e040a0' },
  cardList: { display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' },
  card: { background: '#141626', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative', cursor: 'pointer', transition: 'all 0.25s' },
  cardFeatured: { border: '1px solid rgba(240,188,66,0.3)', boxShadow: '0 0 30px rgba(240,188,66,0.08)' },
  cardLocked: { cursor: 'default', filter: 'grayscale(0.6)' },
  cardHovered: { transform: 'translateY(-2px)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' },
  cardGradient: { position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 14px 0', position: 'relative' },
  cardTopLeft: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  featuredTag: { fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#f0bc42', background: 'rgba(240,188,66,0.15)', border: '1px solid rgba(240,188,66,0.3)', borderRadius: 6, padding: '3px 7px', fontFamily: "'Space Grotesk', sans-serif" },
  recommendedTag: { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#3d8ff5', background: 'rgba(61,143,245,0.12)', border: '1px solid rgba(61,143,245,0.25)', borderRadius: 6, padding: '3px 7px', fontFamily: "'Space Grotesk', sans-serif" },
  lockedTag: { fontSize: 10, fontWeight: 700, color: 'rgba(240,242,255,0.3)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 7px', fontFamily: "'Space Grotesk', sans-serif" },
  tooLongTag: { fontSize: 10, fontWeight: 700, color: '#f57c30', background: 'rgba(245,124,48,0.1)', borderRadius: 6, padding: '3px 7px', fontFamily: "'Space Grotesk', sans-serif" },
  badgePreview: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '6px 10px', borderRadius: 10, border: '1px solid' },
  badgeRarityText: { fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" },
  cardMid: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', position: 'relative' },
  themeOrb: { width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  questName: { fontSize: 17, fontWeight: 800, margin: 0, marginBottom: 3, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' },
  questTagline: { fontSize: 13, color: 'rgba(240,242,255,0.5)', margin: 0 },
  statsRow: { display: 'flex', alignItems: 'center', padding: '0 14px 10px', gap: 0, position: 'relative' },
  stat: { display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'center' },
  statIcon: { fontSize: 12, opacity: 0.7 },
  statVal: { fontSize: 12, fontWeight: 600, color: 'rgba(240,242,255,0.7)', fontFamily: "'Space Grotesk', sans-serif" },
  statDivider: { width: 1, height: 16, background: 'rgba(255,255,255,0.08)' },
  // Route ETA row
  routeRow: { display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 14px 10px', position: 'relative', alignItems: 'center' },
  routeChip: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1px solid', background: 'transparent', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.03em' },
  routeMuted: { fontSize: 11, color: 'rgba(240,242,255,0.3)', fontStyle: 'italic' },
  routeLoadingDot: { width: 6, height: 6, borderRadius: '50%', background: '#3d8ff5', animation: 'pulse 1.5s infinite' },
  personaRow: { display: 'flex', gap: 6, padding: '0 14px 12px', flexWrap: 'wrap', position: 'relative' },
  personaTag: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,242,255,0.5)', fontFamily: "'Space Grotesk', sans-serif" },
  cardCta: { padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' },
};

