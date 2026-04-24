// @ts-nocheck
"use client";
import * as React from "react";

// Screen 1: Quest Map — Landing
export const QuestMap = ({ onSelectTime, onOpenPassport, userXP, userLevel, airportState, flightMinsRemaining, onEditFlight }) => {
  const [selectedTime, setSelectedTime] = React.useState(null);
  const [hoveredZone, setHoveredZone] = React.useState(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const timeOptions = [
    { label: '2h', mins: 120, icon: '⚡' },
    { label: '4h', mins: 240, icon: '🗺' },
    { label: '8h', mins: 480, icon: '🌆' },
    { label: '24h', mins: 1440, icon: '🌙' },
    { label: '48h', mins: 2880, icon: '✦' },
  ];

  // Airport countdown — from props (real or demo)
  const totalMins = flightMinsRemaining != null ? flightMinsRemaining : 9 * 60 + 40;
  const airportHours = Math.floor(totalMins / 60);
  const airportMins = totalMins % 60;
  const bufferColor = { safe: '#2ecb82', warning: '#f0bc42', unsafe: '#f57c30' }[airportState || 'safe'];

  return (
    <div style={questMapStyles.root}>
      {/* Stars bg */}
      <div style={questMapStyles.stars} />

      {/* Top Bar */}
      <div style={questMapStyles.topBar}>
        <div style={questMapStyles.xpPill}>
          <span style={questMapStyles.levelBadge}>LV {userLevel}</span>
          <div style={questMapStyles.xpBarOuter}>
            <div style={{ ...questMapStyles.xpBarInner, width: `${(userXP % 500) / 5}%` }} />
          </div>
          <span style={questMapStyles.xpText}>{userXP} XP</span>
        </div>
        <div
          style={{ ...questMapStyles.airportTimer, borderColor: bufferColor + '44', background: bufferColor + '12', cursor: 'pointer' }}
          onClick={onEditFlight}
          title="Edit flight settings"
        >
          <span style={{ fontSize: 14, color: bufferColor }}>{airportHours}h {airportMins}m</span>
          <span style={{ fontSize: 10, color: bufferColor + 'aa', fontWeight: 600 }}>✏</span>
          <div style={{ ...questMapStyles.safetyDot, background: bufferColor, boxShadow: `0 0 6px ${bufferColor}` }} />
        </div>
      </div>

      {/* Hero Title */}
      <div style={questMapStyles.hero}>
        <div style={questMapStyles.logoRow}>
          <span style={questMapStyles.logoIcon}>◈</span>
          <span style={questMapStyles.logoText}>QuestPass SG</span>
        </div>
        <h1 style={questMapStyles.headline}>Turn your layover<br />into a <em style={questMapStyles.em}>quest</em>.</h1>
        <p style={questMapStyles.sub}>Solve clues. Unlock places. Collect Singapore.</p>
      </div>

      {/* Singapore Quest Map */}
      <div style={questMapStyles.mapContainer}>
        <SingaporeMap
          neighborhoods={window.NEIGHBORHOODS}
          hoveredZone={hoveredZone}
          setHoveredZone={setHoveredZone}
          tick={tick}
        />
        {hoveredZone && (
          <div style={questMapStyles.zoneTooltip}>
            <span style={{ color: hoveredZone.color, fontWeight: 700 }}>{hoveredZone.name}</span>
            <span style={{ color: 'rgba(240,242,255,0.6)', fontSize: 12 }}> · {hoveredZone.quests} quest{hoveredZone.quests > 1 ? 's' : ''}</span>
          </div>
        )}
        {/* Nearby prompt */}
        <div style={questMapStyles.nearbyPrompt}>
          <span style={{ fontSize: 13 }}>📡</span>
          <span>3 quests detected nearby</span>
        </div>
      </div>

      {/* Time Selector */}
      <div style={questMapStyles.timeSection}>
        <p style={questMapStyles.timeLabel}>How long do you have?</p>
        <div style={questMapStyles.timePills}>
          {timeOptions.map(opt => (
            <button
              key={opt.label}
              onClick={() => setSelectedTime(opt)}
              style={{
                ...questMapStyles.timePill,
                ...(selectedTime?.label === opt.label ? questMapStyles.timePillActive : {})
              }}
            >
              <span style={{ fontSize: 14 }}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={questMapStyles.ctaRow}>
        <button
          onClick={() => selectedTime && onSelectTime(selectedTime)}
          style={{
            ...questMapStyles.ctaBtn,
            ...(selectedTime ? questMapStyles.ctaBtnActive : questMapStyles.ctaBtnDisabled)
          }}
        >
          {selectedTime ? `Begin Quest · ${selectedTime.label}` : 'Select your time above'}
          {selectedTime && <span style={{ marginLeft: 8 }}>→</span>}
        </button>
        <button onClick={onOpenPassport} style={questMapStyles.passportBtn}>
          <span>◈</span> My Passport
        </button>
      </div>
    </div>
  );
};

// SVG Singapore Map Component
const SingaporeMap = ({ neighborhoods, hoveredZone, setHoveredZone, tick }) => {
  const W = 340, H = 180;
  // Simplified Singapore island outline (normalized to W×H)
  const islandPath = `
    M 30,90 C 35,55 60,30 90,25 C 120,18 155,20 185,18
    C 215,15 248,22 268,35 C 295,50 315,68 320,85
    C 325,102 310,125 285,135 C 260,145 230,150 200,148
    C 170,150 145,148 120,145 C 90,142 60,140 42,128
    C 28,118 25,110 30,90 Z
  `;
  // Sentosa (small island below)
  const sentosaPath = `M 170,158 C 178,155 195,155 205,158 C 210,162 205,168 195,168 C 182,168 168,165 170,158 Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <radialGradient id="islandGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1e2540" />
          <stop offset="100%" stopColor="#0d1020" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {neighborhoods.map(n => (
          <radialGradient key={n.id} id={`ng-${n.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={n.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={n.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Ocean background subtle grid */}
      <rect width={W} height={H + 20} fill="#080c18" rx="12" />
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 20} x2={W} y2={i * 20} stroke="rgba(61,143,245,0.06)" strokeWidth="1" />
      ))}
      {Array.from({ length: 18 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2={H + 20} stroke="rgba(61,143,245,0.06)" strokeWidth="1" />
      ))}

      {/* Island fill */}
      <path d={islandPath} fill="url(#islandGrad)" stroke="rgba(61,143,245,0.4)" strokeWidth="1.5" />
      <path d={sentosaPath} fill="#141830" stroke="rgba(61,143,245,0.25)" strokeWidth="1" />

      {/* MRT lines (simplified) */}
      <polyline points="37,65 80,58 160,50 220,52 285,70" fill="none" stroke="rgba(61,143,245,0.3)" strokeWidth="1.5" strokeDasharray="4,3" />
      <polyline points="50,95 100,88 165,82 230,80 300,88" fill="none" stroke="rgba(224,64,160,0.25)" strokeWidth="1.5" strokeDasharray="4,3" />

      {/* Neighborhood glow halos */}
      {neighborhoods.map(n => {
        const cx = (n.x / 100) * W;
        const cy = (n.y / 100) * H;
        const isHovered = hoveredZone?.id === n.id;
        const pulseR = 22 + (Math.sin((tick * 0.8 + n.x * 0.1)) * 4);
        return (
          <g key={n.id}>
            <circle cx={cx} cy={cy} r={pulseR + (isHovered ? 8 : 0)} fill={`url(#ng-${n.id})`} />
          </g>
        );
      })}

      {/* Quest path dots */}
      {[
        { x: 42, y: 63 }, { x: 48, y: 68 }, { x: 54, y: 58 }, { x: 56, y: 50 }, { x: 60, y: 54 }
      ].map((p, i, arr) => {
        if (i === 0) return null;
        const prev = arr[i - 1];
        return (
          <line
            key={i}
            x1={(prev.x / 100) * W} y1={(prev.y / 100) * H}
            x2={(p.x / 100) * W} y2={(p.y / 100) * H}
            stroke="rgba(240,188,66,0.2)" strokeWidth="1" strokeDasharray="3,4"
          />
        );
      })}

      {/* Neighborhood nodes */}
      {neighborhoods.map(n => {
        const cx = (n.x / 100) * W;
        const cy = (n.y / 100) * H;
        const isHovered = hoveredZone?.id === n.id;
        return (
          <g
            key={n.id}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredZone(n)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            <circle cx={cx} cy={cy} r={isHovered ? 9 : 7} fill={n.color} filter="url(#nodeGlow)" opacity={0.95} />
            <circle cx={cx} cy={cy} r={isHovered ? 9 : 7} fill="none" stroke="white" strokeWidth="1.5" opacity={0.6} />
            {/* Quest count badge */}
            <circle cx={cx + 6} cy={cy - 6} r={5} fill="#0b0d1a" />
            <text x={cx + 6} y={cy - 3} textAnchor="middle" fontSize="6" fill={n.color} fontWeight="700">{n.quests}</text>
            {/* Label */}
            <text x={cx} y={cy + 17} textAnchor="middle" fontSize="7" fill="rgba(240,242,255,0.7)" fontFamily="'DM Sans', sans-serif">{n.name}</text>
          </g>
        );
      })}

      {/* Compass rose */}
      <g transform="translate(308, 18)">
        <circle cx="0" cy="0" r="10" fill="rgba(13,16,26,0.8)" stroke="rgba(61,143,245,0.3)" strokeWidth="1" />
        <text x="0" y="-4" textAnchor="middle" fontSize="5" fill="rgba(61,143,245,0.8)">N</text>
        <line x1="0" y1="-8" x2="0" y2="8" stroke="rgba(61,143,245,0.4)" strokeWidth="0.5" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke="rgba(61,143,245,0.4)" strokeWidth="0.5" />
      </g>
    </svg>
  );
};

const questMapStyles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #060810 0%, #0b0d1a 40%, #0d1020 100%)',
    color: '#f0f2ff',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 32px 0',
    position: 'relative',
    overflow: 'hidden',
  },
  stars: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 75% 8%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 15%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.3) 0%, transparent 100%),
      radial-gradient(1px 1px at 5% 50%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 60% 5%, rgba(255,255,255,0.5) 0%, transparent 100%)`,
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px 0',
    position: 'relative', zIndex: 10,
  },
  xpPill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.06)', borderRadius: 20,
    padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)',
  },
  levelBadge: {
    background: 'linear-gradient(135deg, #f0bc42, #f57c30)',
    color: '#0b0d1a', fontWeight: 800, fontSize: 11,
    borderRadius: 8, padding: '2px 7px',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  xpBarOuter: {
    width: 60, height: 4, background: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden',
  },
  xpBarInner: {
    height: '100%', borderRadius: 2,
    background: 'linear-gradient(90deg, #f0bc42, #f57c30)',
    transition: 'width 0.5s ease',
  },
  xpText: { fontSize: 11, color: 'rgba(240,242,255,0.5)', fontFamily: "'Space Grotesk', sans-serif" },
  airportTimer: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(46,203,130,0.12)', borderRadius: 20,
    padding: '6px 12px', border: '1px solid rgba(46,203,130,0.25)',
    cursor: 'pointer',
  },
  airportText: { fontSize: 12, color: '#2ecb82', fontWeight: 600 },
  safetyDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#2ecb82',
    boxShadow: '0 0 6px #2ecb82',
    animation: 'pulse 2s infinite',
  },
  hero: {
    padding: '24px 20px 8px',
    position: 'relative', zIndex: 10,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  logoIcon: {
    fontSize: 18, color: '#e040a0',
    filter: 'drop-shadow(0 0 8px #e040a0)',
  },
  logoText: {
    fontSize: 13, fontWeight: 700, letterSpacing: '0.15em',
    color: 'rgba(240,242,255,0.5)', textTransform: 'uppercase',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  headline: {
    fontSize: 32, fontWeight: 800, lineHeight: 1.15,
    margin: 0, marginBottom: 8,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '-0.02em',
    textWrap: 'pretty',
  },
  em: {
    fontStyle: 'italic',
    background: 'linear-gradient(90deg, #e040a0, #f0bc42)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  sub: {
    fontSize: 15, color: 'rgba(240,242,255,0.55)', margin: 0,
    letterSpacing: '0.01em',
  },
  mapContainer: {
    position: 'relative', margin: '16px 16px 0',
    borderRadius: 16, overflow: 'hidden',
    border: '1px solid rgba(61,143,245,0.15)',
    boxShadow: '0 0 40px rgba(61,143,245,0.08), inset 0 0 60px rgba(0,0,0,0.4)',
  },
  zoneTooltip: {
    position: 'absolute', bottom: 44, left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(13,16,26,0.95)', borderRadius: 8,
    padding: '5px 12px', fontSize: 13, fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.1)',
    whiteSpace: 'nowrap', pointerEvents: 'none',
  },
  nearbyPrompt: {
    position: 'absolute', bottom: 10, left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(224,64,160,0.15)',
    border: '1px solid rgba(224,64,160,0.3)',
    borderRadius: 20, padding: '5px 14px',
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, color: '#e040a0',
    whiteSpace: 'nowrap',
  },
  timeSection: {
    padding: '20px 20px 0',
    position: 'relative', zIndex: 10,
  },
  timeLabel: {
    fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
    color: 'rgba(240,242,255,0.4)', textTransform: 'uppercase',
    margin: '0 0 10px',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  timePills: {
    display: 'flex', gap: 8,
  },
  timePill: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 3, padding: '10px 0',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, cursor: 'pointer', color: 'rgba(240,242,255,0.6)',
    fontSize: 13, fontWeight: 600,
    fontFamily: "'Space Grotesk', sans-serif",
    transition: 'all 0.2s',
  },
  timePillActive: {
    background: 'rgba(240,188,66,0.15)',
    border: '1px solid rgba(240,188,66,0.5)',
    color: '#f0bc42',
    boxShadow: '0 0 16px rgba(240,188,66,0.15)',
  },
  ctaRow: {
    padding: '16px 20px 0',
    display: 'flex', flexDirection: 'column', gap: 10,
    position: 'relative', zIndex: 10,
  },
  ctaBtn: {
    width: '100%', padding: '16px',
    borderRadius: 14, border: 'none', cursor: 'pointer',
    fontSize: 16, fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.02em',
    transition: 'all 0.25s',
  },
  ctaBtnActive: {
    background: 'linear-gradient(135deg, #e040a0, #7c4dcc)',
    color: 'white',
    boxShadow: '0 4px 24px rgba(224,64,160,0.4)',
  },
  ctaBtnDisabled: {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(240,242,255,0.25)',
    cursor: 'not-allowed',
  },
  passportBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '12px',
    color: 'rgba(240,242,255,0.5)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    fontFamily: "'Space Grotesk', sans-serif",
  },
};

