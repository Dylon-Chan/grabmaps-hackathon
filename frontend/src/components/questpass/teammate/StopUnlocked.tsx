// @ts-nocheck
"use client";
import * as React from "react";

// Screen 4: Stop Unlocked — with verified place, distance, Open Route CTA
export const StopUnlocked = ({ stop, stopIdx, totalStops, quest, onContinue, onComplete, userLocation }) => {
  const [phase, setPhase] = React.useState('burst');
  const [tick, setTick] = React.useState(0);
  const isLast = stopIdx === totalStops - 1;

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 900);
    const t2 = setTimeout(() => setPhase('actions'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 80);
    return () => clearInterval(t);
  }, []);

  const particles = React.useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      x: 30 + Math.random() * 40,
      y: 10 + Math.random() * 30,
      size: 4 + Math.random() * 6,
      color: [quest.color, '#e040a0', '#f0bc42', '#2ecb82', '#7c4dcc'][i % 5],
      angle: (i / 18) * 360,
    })), []);

  // Compute distance from user to this stop
  const stopCoords = {
    lat: stop.resolvedLat || stop.lat,
    lng: stop.resolvedLng || stop.lng,
  };
  const distanceMeters = React.useMemo(() => {
    if (!userLocation) return null;
    return window.GrabMaps.calculateDistance(userLocation, stopCoords);
  }, [userLocation, stopCoords]);

  const fmtDist = (m) => {
    if (m === null) return null;
    if (m < 1000) return `${Math.round(m)}m`;
    return `${(m / 1000).toFixed(1)}km`;
  };

  const openRoute = () => {
    const { lat, lng } = stopCoords;
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  const reward = stop.reward || stop.collectible;

  return (
    <div style={suStyles.root}>
      {/* Particle burst */}
      {phase === 'burst' && (
        <div style={suStyles.particleLayer} aria-hidden>
          {particles.map((p, i) => (
            <div key={i} style={{
              ...suStyles.particle,
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              transform: `translateX(${Math.cos((p.angle * Math.PI) / 180) * (tick * 3)}px) translateY(${Math.sin((p.angle * Math.PI) / 180) * (tick * 3)}px)`,
              opacity: Math.max(0, 1 - tick / 12),
            }} />
          ))}
        </div>
      )}

      <div style={{ ...suStyles.glowBg, background: `radial-gradient(ellipse at 50% 30%, ${quest.color}22 0%, transparent 70%)` }} />

      {/* Header */}
      <div style={suStyles.header}>
        <div style={suStyles.stopBreadcrumb}>STOP {stopIdx + 1} of {totalStops} · {quest.name}</div>
      </div>

      {/* Unlock banner */}
      <div style={{ ...suStyles.unlockBanner, opacity: phase === 'burst' ? 0 : 1, transform: phase === 'burst' ? 'scale(0.9)' : 'scale(1)' }}>
        <div style={suStyles.unlockIcon}>✦</div>
        <h1 style={suStyles.unlockTitle}>Unlocked!</h1>
        <div style={{ color: quest.color, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
          {stop.neighborhood}
        </div>
      </div>

      {/* Place Card */}
      <div style={{
        ...suStyles.placeCard,
        opacity: phase !== 'burst' ? 1 : 0,
        transform: phase !== 'burst' ? 'translateY(0)' : 'translateY(24px)',
        borderColor: quest.color + '44',
        boxShadow: `0 0 40px ${quest.color}18`,
      }}>
        <div style={{ ...suStyles.cardStripe, background: `linear-gradient(90deg, ${quest.color}66, transparent)` }} />

        {/* Place top: name + collectible */}
        <div style={suStyles.placeTop}>
          <div style={{ flex: 1 }}>
            <h2 style={suStyles.placeName}>{stop.name}</h2>

            {/* Verified place row */}
            <div style={suStyles.verifiedRow}>
              <span style={suStyles.verifiedBadge}>
                <span style={{ color: quest.color }}>✓</span> Verified: {stop.name}
              </span>
              <span style={suStyles.neighborhoodBadge}>
                📍 {stop.neighborhood}
              </span>
            </div>

            {/* Distance from user */}
            {distanceMeters !== null && (
              <div style={suStyles.distanceRow}>
                <span style={suStyles.distanceIcon}>📡</span>
                <span style={suStyles.distanceText}>
                  You arrived within <strong style={{ color: quest.color }}>{fmtDist(distanceMeters)}</strong> of this spot
                </span>
              </div>
            )}
            {distanceMeters === null && (
              <div style={suStyles.distanceRow}>
                <span style={suStyles.distanceIcon}>🎮</span>
                <span style={{ ...suStyles.distanceText, color: 'rgba(240,242,255,0.3)' }}>Simulated arrival · demo mode</span>
              </div>
            )}
          </div>

          {/* Collectible token */}
          {reward && (
            <div style={{ ...suStyles.collectible, borderColor: reward.color + '55', background: reward.color + '12' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: reward.color, textShadow: `0 0 12px ${reward.color}`, fontFamily: "'Space Grotesk', sans-serif" }}>
                {reward.symbol}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 60, color: reward.color, fontFamily: "'Space Grotesk', sans-serif" }}>
                {reward.name}
              </div>
            </div>
          )}
        </div>

        {/* Story */}
        <div style={suStyles.section}>
          <div style={suStyles.sectionLabel}>📖 THE STORY</div>
          <p style={suStyles.sectionText}>{stop.story}</p>
        </div>

        {/* Local Tip */}
        <div style={{ ...suStyles.tipBox, borderColor: quest.color + '33', background: quest.color + '0c' }}>
          <div style={{ ...suStyles.tipLabel, color: quest.color }}>🗝 LOCAL TIP</div>
          <p style={suStyles.tipText}>{stop.localTip}</p>
        </div>

        {/* Photo Challenge */}
        <div style={suStyles.photoChal}>
          <div style={suStyles.photoLabel}>
            <span style={{ fontSize: 16 }}>📸</span>
            <span style={suStyles.photoLabelText}>PHOTO CHALLENGE</span>
          </div>
          <p style={suStyles.photoText}>{stop.photoChallenge}</p>
          <button style={suStyles.photoBtn}>Upload Photo Challenge</button>
        </div>

        {/* Open Route CTA */}
        <div style={suStyles.openRouteCta}>
          <button onClick={openRoute} style={suStyles.openRouteBtn}>
            <span>🧭</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Open Route</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                {stopCoords.lat.toFixed(5)}, {stopCoords.lng.toFixed(5)}
                {stop.grabPlaceId ? ` · ID: ${stop.grabPlaceId}` : ' · GrabMaps ID pending'}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', opacity: 0.5 }}>↗</span>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        ...suStyles.ctaSection,
        opacity: phase === 'actions' ? 1 : 0,
        transform: phase === 'actions' ? 'translateY(0)' : 'translateY(12px)',
      }}>
        {isLast ? (
          <button onClick={onComplete} style={suStyles.completeBtn}>
            <span>🏆</span> Complete Quest & Earn Badge
          </button>
        ) : (
          <button onClick={onContinue} style={{ ...suStyles.nextBtn, background: `linear-gradient(135deg, ${quest.color}, #7c4dcc)` }}>
            Next Stop → Stop {stopIdx + 2}
          </button>
        )}
        {reward && (
          <p style={suStyles.collectibleNote}>
            <span style={{ color: reward.color }}>{reward.symbol}</span> {reward.name} · +{stop.xp} XP added to passport
          </p>
        )}
      </div>
    </div>
  );
};

const suStyles = {
  root: { minHeight: '100vh', background: '#0b0d1a', color: '#f0f2ff', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', paddingBottom: 32, position: 'relative', overflow: 'hidden' },
  particleLayer: { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 },
  particle: { position: 'absolute', borderRadius: '50%', transition: 'opacity 0.1s' },
  glowBg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  header: { padding: '20px 20px 0', position: 'relative', zIndex: 10 },
  stopBreadcrumb: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(240,242,255,0.3)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" },
  unlockBanner: { textAlign: 'center', padding: '24px 20px 16px', position: 'relative', zIndex: 10, transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)' },
  unlockIcon: { fontSize: 40, marginBottom: 8, filter: 'drop-shadow(0 0 16px #f0bc42)', animation: 'float 3s ease-in-out infinite' },
  unlockTitle: { fontSize: 42, fontWeight: 900, margin: '0 0 6px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em', background: 'linear-gradient(135deg, white, rgba(240,242,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  placeCard: { margin: '0 16px', borderRadius: 20, background: '#141626', border: '1px solid', overflow: 'hidden', position: 'relative', zIndex: 10, transition: 'all 0.5s ease' },
  cardStripe: { height: 3 },
  placeTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 16px 10px', gap: 12 },
  placeName: { fontSize: 20, fontWeight: 800, margin: '0 0 8px', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' },
  verifiedRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  verifiedBadge: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(46,203,130,0.1)', border: '1px solid rgba(46,203,130,0.25)', color: 'rgba(240,242,255,0.7)', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 4 },
  neighborhoodBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,242,255,0.5)', fontFamily: "'Space Grotesk', sans-serif" },
  distanceRow: { display: 'flex', alignItems: 'center', gap: 5 },
  distanceIcon: { fontSize: 12 },
  distanceText: { fontSize: 12, color: 'rgba(240,242,255,0.5)', lineHeight: 1.4 },
  collectible: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 14px', borderRadius: 12, border: '1px solid', flexShrink: 0 },
  section: { padding: '0 16px 12px' },
  sectionLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(240,242,255,0.35)', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 5 },
  sectionText: { fontSize: 14, lineHeight: 1.65, margin: 0, color: 'rgba(240,242,255,0.75)' },
  tipBox: { margin: '0 16px 12px', borderRadius: 12, border: '1px solid', padding: '12px 14px' },
  tipLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" },
  tipText: { fontSize: 14, lineHeight: 1.6, margin: 0, color: 'rgba(240,242,255,0.7)' },
  photoChal: { margin: '0 16px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px' },
  photoLabel: { display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 },
  photoLabelText: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(240,242,255,0.4)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" },
  photoText: { fontSize: 14, color: 'rgba(240,242,255,0.75)', margin: '0 0 10px', fontStyle: 'italic', lineHeight: 1.55 },
  photoBtn: { width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,242,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  // Open route
  openRouteCta: { padding: '0 16px 14px' },
  openRouteBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: 'rgba(61,143,245,0.08)', border: '1px solid rgba(61,143,245,0.2)', color: '#3d8ff5', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif', sans-serif", textAlign: 'left', fontSize: 13 },
  // CTA
  ctaSection: { padding: '16px 16px 0', transition: 'all 0.4s ease 0.3s', position: 'relative', zIndex: 10 },
  nextBtn: { width: '100%', padding: '16px', borderRadius: 14, border: 'none', color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.02em', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  completeBtn: { width: '100%', padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg, #f0bc42, #f57c30)', border: 'none', color: '#0b0d1a', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.02em', boxShadow: '0 4px 24px rgba(240,188,66,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  collectibleNote: { fontSize: 12, color: 'rgba(240,242,255,0.3)', textAlign: 'center', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

