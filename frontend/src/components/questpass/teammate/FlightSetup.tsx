// @ts-nocheck
"use client";
import * as React from "react";

// js/FlightSetup.jsx — QuestPass Activation Screen
// ─────────────────────────────────────────────────────────────────────────────
// Helper functions (exported to window for teammate integration)
// Replace estimatedAirportRouteMins with GrabMaps.getRouteToAirport() result later.

const ESTIMATED_AIRPORT_ROUTE_MINS = 45; // TODO: replace with GrabMaps.getRouteToAirport()

function calculateTimeUntilFlight(flightDateTime) {
  // Returns minutes until flight (can be negative if in past)
  return Math.round((new Date(flightDateTime) - new Date()) / 60000);
}

function calculateAirportArrivalTime(flightDateTime, airportBufferMinutes) {
  // Returns Date: when user must be AT the airport
  return new Date(new Date(flightDateTime) - airportBufferMinutes * 60000);
}

function calculateSafeExplorationWindow(flightDateTime, airportBufferMinutes, estimatedAirportRouteMinutes) {
  // Returns minutes user can safely spend exploring
  const minutesUntilFlight = calculateTimeUntilFlight(flightDateTime);
  return minutesUntilFlight - airportBufferMinutes - estimatedAirportRouteMinutes;
}

function getLayoverSafetyStatus(safeExplorationWindowMinutes) {
  if (safeExplorationWindowMinutes < 0) {
    return { status: 'past', label: 'Flight has passed', color: '#f57c30', icon: '⚠' };
  }
  if (safeExplorationWindowMinutes < 180) {
    return { status: 'airport_first', label: 'Airport-first mode', color: '#f57c30', icon: '🚨', description: 'Very short window — quick quests only.' };
  }
  if (safeExplorationWindowMinutes < 480) {
    return { status: 'short', label: 'Short layover', color: '#f0bc42', icon: '⚡', description: '2h–4h quests recommended.' };
  }
  return { status: 'plenty', label: 'Plenty of time', color: '#2ecb82', icon: '✦', description: 'All quests available.' };
}

// Export helpers for teammate use
if (typeof window !== 'undefined') {
  Object.assign(window, {
    calculateTimeUntilFlight,
    calculateAirportArrivalTime,
    calculateSafeExplorationWindow,
    getLayoverSafetyStatus,
    ESTIMATED_AIRPORT_ROUTE_MINS,
  });
}

// ─── FlightSetup component ────────────────────────────────────────────────────
export const FlightSetup = ({ onActivate, onDemoMode }) => {
  // Default flight time: today + 10 hours (reasonable demo default)
  const defaultFlight = React.useMemo(() => {
    const d = new Date(Date.now() + 10 * 60 * 60 * 1000);
    const pad = n => String(n).padStart(2, '0');
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }, []);

  const [flightDate, setFlightDate] = React.useState('');
  const [flightTime, setFlightTime] = React.useState('');
  const [bufferHours, setBufferHours] = React.useState(2);
  const [confirmed, setConfirmed] = React.useState(false);
  const [activating, setActivating] = React.useState(false);

  const bufferOptions = [
    { label: '1.5h', value: 1.5 },
    { label: '2h', value: 2 },
    { label: '2.5h', value: 2.5 },
    { label: '3h', value: 3 },
  ];

  // Computed values
  const flightDateTime = flightDate && flightTime ? `${flightDate}T${flightTime}` : null;
  const minsUntilFlight = flightDateTime ? calculateTimeUntilFlight(flightDateTime) : null;
  const bufferMins = bufferHours * 60;
  const safeWindowMins = flightDateTime ? calculateSafeExplorationWindow(flightDateTime, bufferMins, ESTIMATED_AIRPORT_ROUTE_MINS) : null;
  const safetyStatus = safeWindowMins !== null ? getLayoverSafetyStatus(safeWindowMins) : null;
  const airportArrivalTime = flightDateTime ? calculateAirportArrivalTime(flightDateTime, bufferMins) : null;

  const isPast = minsUntilFlight !== null && minsUntilFlight < 0;
  const isValid = flightDateTime && !isPast && safeWindowMins !== null;

  // Format helpers
  const fmtMins = (m) => {
    if (m <= 0) return '0m';
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}`.trim() : `${min}m`;
  };
  const fmtTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDateTime = (date) => date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Timeline bar proportions
  const totalMins = minsUntilFlight || 0;
  const questPct = totalMins > 0 ? Math.max(0, Math.min(100, (safeWindowMins / totalMins) * 100)) : 0;
  const bufferPct = totalMins > 0 ? Math.min(100 - questPct, ((bufferMins + ESTIMATED_AIRPORT_ROUTE_MINS) / totalMins) * 100) : 0;

  const handleActivate = () => {
    if (isPast) return;
    setActivating(true);
    setTimeout(() => {
      onActivate({
        flightDateTime,
        flightMinsRemaining: minsUntilFlight,
        bufferMins,
        safeWindowMins,
        safetyStatus,
        airportArrivalTime,
      });
    }, 1400);
  };

  return (
    <div style={fsStyles.root}>
      {/* Stars bg */}
      <div style={fsStyles.stars} />
      {/* Glow */}
      <div style={fsStyles.glow} />

      <div style={fsStyles.scroll}>
        {/* Logo */}
        <div style={fsStyles.logoRow}>
          <span style={fsStyles.logoIcon}>◈</span>
          <span style={fsStyles.logoText}>QuestPass SG</span>
        </div>

        {/* Hero */}
        <div style={fsStyles.hero}>
          <h1 style={fsStyles.headline}>
            Turn your Singapore<br />layover into a <em style={fsStyles.em}>quest.</em>
          </h1>
          <p style={fsStyles.sub}>
            Solve clues, unlock local places, collect Singapore memories — and get back to Changi on time.
          </p>
        </div>

        {/* Activation Card */}
        <div style={fsStyles.card}>
          <div style={fsStyles.cardHeader}>
            <div style={fsStyles.cardHeaderLeft}>
              <span style={fsStyles.cardIcon}>✈</span>
              <div>
                <div style={fsStyles.cardTitle}>Activate your QuestPass</div>
                <div style={fsStyles.cardSub}>Changi Airport · Singapore</div>
              </div>
            </div>
            <div style={fsStyles.scanLine} />
          </div>

          {/* Flight time input */}
          <div style={fsStyles.inputSection}>
            <div style={fsStyles.inputLabel}>When is your flight?</div>
            <div style={fsStyles.inputRow}>
              <div style={fsStyles.inputGroup}>
                <label style={fsStyles.inputMini}>DATE</label>
                <input
                  type="date"
                  value={flightDate}
                  onChange={e => { setFlightDate(e.target.value); setConfirmed(false); }}
                  style={{ ...fsStyles.input, ...(isPast ? fsStyles.inputError : {}) }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div style={fsStyles.inputGroup}>
                <label style={fsStyles.inputMini}>TIME</label>
                <input
                  type="time"
                  value={flightTime}
                  onChange={e => { setFlightTime(e.target.value); setConfirmed(false); }}
                  style={{ ...fsStyles.input, ...(isPast ? fsStyles.inputError : {}) }}
                />
              </div>
            </div>
            {isPast && (
              <div style={fsStyles.errorMsg}>⚠ That flight time is in the past. Please check again.</div>
            )}
          </div>

          {/* Airport buffer selector */}
          <div style={fsStyles.inputSection}>
            <div style={fsStyles.inputLabel}>How early to be back at Changi?</div>
            <div style={fsStyles.bufferPills}>
              {bufferOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setBufferHours(opt.value)}
                  style={{ ...fsStyles.bufferPill, ...(bufferHours === opt.value ? fsStyles.bufferPillActive : {}) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculated result */}
          {isValid && (
            <div style={{ ...fsStyles.resultCard, borderColor: safetyStatus.color + '44', background: safetyStatus.color + '0d' }}>
              {/* Status badge */}
              <div style={{ ...fsStyles.statusBadge, color: safetyStatus.color, background: safetyStatus.color + '1a', border: `1px solid ${safetyStatus.color}44` }}>
                <span>{safetyStatus.icon}</span>
                <span>{safetyStatus.label}</span>
                {safetyStatus.description && <span style={{ opacity: 0.7, fontWeight: 500 }}>· {safetyStatus.description}</span>}
              </div>

              {/* Stats grid */}
              <div style={fsStyles.statsGrid}>
                <div style={fsStyles.statBox}>
                  <div style={fsStyles.statNum}>{fmtMins(minsUntilFlight)}</div>
                  <div style={fsStyles.statLbl}>until flight</div>
                </div>
                <div style={fsStyles.statBox}>
                  <div style={{ ...fsStyles.statNum, color: safetyStatus.color }}>{fmtMins(Math.max(0, safeWindowMins))}</div>
                  <div style={fsStyles.statLbl}>safe quest window</div>
                </div>
                <div style={fsStyles.statBox}>
                  <div style={fsStyles.statNum}>{fmtTime(airportArrivalTime)}</div>
                  <div style={fsStyles.statLbl}>be at Changi by</div>
                </div>
              </div>

              {/* Timeline bar */}
              <div style={fsStyles.timelineSection}>
                <div style={fsStyles.timelineLabels}>
                  <span style={fsStyles.tlLabel}>NOW</span>
                  <span style={fsStyles.tlLabel}>CHANGI</span>
                  <span style={fsStyles.tlLabel}>FLIGHT ✈</span>
                </div>
                <div style={fsStyles.timelineBar}>
                  <div style={{ ...fsStyles.tlSegQuest, width: `${questPct}%`, background: safetyStatus.color }} />
                  <div style={{ ...fsStyles.tlSegBuffer, width: `${bufferPct}%` }} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>
                <div style={fsStyles.timelineLegend}>
                  <div style={fsStyles.legendItem}>
                    <div style={{ ...fsStyles.legendDot, background: safetyStatus.color }} />
                    <span>Quest window</span>
                  </div>
                  <div style={fsStyles.legendItem}>
                    <div style={{ ...fsStyles.legendDot, background: '#e040a0' }} />
                    <span>Travel + buffer ({bufferHours}h)</span>
                  </div>
                </div>
              </div>

              {/* Safety scan complete */}
              <div style={fsStyles.scanComplete}>
                <span style={{ color: safetyStatus.color }}>◈</span>
                <span style={{ color: safetyStatus.color, fontWeight: 700 }}>Safety scan complete</span>
                <span style={{ color: 'rgba(240,242,255,0.4)' }}>
                  · Be at Changi by <strong style={{ color: '#f0f2ff' }}>{fmtDateTime(airportArrivalTime)}</strong>
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Reassurance copy */}
        <p style={fsStyles.reassurance}>
          🔒 We only use this to filter quests and protect your airport buffer.
        </p>

        {/* CTAs */}
        <div style={fsStyles.ctaSection}>
          <button
            onClick={handleActivate}
            disabled={isPast || activating}
            style={{
              ...fsStyles.primaryCta,
              ...(isPast ? fsStyles.primaryCtaDisabled : {}),
              ...(activating ? fsStyles.primaryCtaActivating : {}),
            }}
          >
            {activating ? (
              <span style={fsStyles.activatingRow}>
                <span style={fsStyles.activatingSpinner} />
                Activating QuestPass…
              </span>
            ) : isValid ? (
              'Start exploring safely →'
            ) : (
              isPast ? 'Check your flight time' : 'Start exploring safely →'
            )}
          </button>

          <button onClick={onDemoMode} style={fsStyles.demoCta}>
            🎮 Try demo mode
          </button>
        </div>
      </div>
    </div>
  );
};

const fsStyles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #060810 0%, #0b0d1a 50%, #0d1020 100%)',
    color: '#f0f2ff', fontFamily: "'DM Sans', sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  stars: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 45% 5%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 92% 40%, rgba(255,255,255,0.4) 0%, transparent 100%),
      radial-gradient(1px 1px at 5% 60%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 65% 8%, rgba(255,255,255,0.4) 0%, transparent 100%)`,
  },
  glow: {
    position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
    width: 400, height: 300, borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(224,64,160,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  scroll: {
    position: 'relative', zIndex: 10,
    padding: '28px 20px 40px',
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28,
  },
  logoIcon: { fontSize: 20, color: '#e040a0', filter: 'drop-shadow(0 0 8px #e040a0)' },
  logoText: {
    fontSize: 13, fontWeight: 700, letterSpacing: '0.15em',
    color: 'rgba(240,242,255,0.45)', textTransform: 'uppercase',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  hero: { marginBottom: 28 },
  headline: {
    fontSize: 30, fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px',
    fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em',
    textWrap: 'pretty',
  },
  em: {
    fontStyle: 'italic',
    background: 'linear-gradient(90deg, #e040a0, #f0bc42)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  sub: { fontSize: 15, color: 'rgba(240,242,255,0.5)', lineHeight: 1.6, margin: 0 },

  // Activation card
  card: {
    background: '#141626', borderRadius: 20,
    border: '1px solid rgba(224,64,160,0.2)',
    overflow: 'hidden', marginBottom: 12,
    boxShadow: '0 0 40px rgba(224,64,160,0.06)',
  },
  cardHeader: {
    padding: '14px 16px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'relative', overflow: 'hidden',
  },
  cardHeaderLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 22 },
  cardTitle: {
    fontSize: 15, fontWeight: 800,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  cardSub: { fontSize: 12, color: 'rgba(240,242,255,0.4)', marginTop: 2 },
  scanLine: {
    position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(224,64,160,0.08), transparent)',
    animation: 'scanMove 3s ease-in-out infinite',
  },

  // Inputs
  inputSection: { padding: '14px 16px 0' },
  inputLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    color: 'rgba(240,242,255,0.35)', textTransform: 'uppercase',
    marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif",
  },
  inputRow: { display: 'flex', gap: 10, marginBottom: 14 },
  inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 5 },
  inputMini: {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
    color: 'rgba(240,242,255,0.25)', textTransform: 'uppercase',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#f0f2ff', padding: '10px 12px', fontSize: 14,
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
    outline: 'none', colorScheme: 'dark',
    transition: 'border-color 0.2s',
  },
  inputError: { borderColor: 'rgba(245,124,48,0.5)', background: 'rgba(245,124,48,0.06)' },
  errorMsg: {
    fontSize: 12, color: '#f57c30', marginTop: -8, marginBottom: 10,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  bufferPills: { display: 'flex', gap: 8, marginBottom: 14 },
  bufferPill: {
    flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(240,242,255,0.5)', cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.15s',
  },
  bufferPillActive: {
    background: 'rgba(224,64,160,0.15)', border: '1px solid rgba(224,64,160,0.4)',
    color: '#e040a0',
  },

  // Result card
  resultCard: {
    margin: '0 16px 16px', borderRadius: 14, border: '1px solid',
    overflow: 'hidden', transition: 'all 0.3s',
  },
  statusBadge: {
    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
    padding: '10px 14px', fontSize: 13, fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  statsGrid: {
    display: 'flex', padding: '12px 0 0',
  },
  statBox: {
    flex: 1, textAlign: 'center', padding: '0 0 12px',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  statNum: {
    fontSize: 18, fontWeight: 900, marginBottom: 3,
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#f0f2ff',
  },
  statLbl: {
    fontSize: 10, color: 'rgba(240,242,255,0.35)',
    fontWeight: 600, letterSpacing: '0.05em',
  },

  // Timeline
  timelineSection: { padding: '0 14px 12px' },
  timelineLabels: {
    display: 'flex', justifyContent: 'space-between',
    marginBottom: 5,
  },
  tlLabel: {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
    color: 'rgba(240,242,255,0.3)', textTransform: 'uppercase',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  timelineBar: {
    height: 8, borderRadius: 4, overflow: 'hidden',
    display: 'flex', background: 'rgba(255,255,255,0.06)',
  },
  tlSegQuest: {
    height: '100%', borderRadius: '4px 0 0 4px',
    transition: 'width 0.5s ease',
    minWidth: 0,
  },
  tlSegBuffer: {
    height: '100%', background: '#e040a0',
    transition: 'width 0.5s ease',
    minWidth: 0,
  },
  timelineLegend: {
    display: 'flex', gap: 14, marginTop: 6,
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, color: 'rgba(240,242,255,0.4)',
  },
  legendDot: {
    width: 8, height: 8, borderRadius: 2,
  },
  scanComplete: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5,
    padding: '8px 14px 12px', fontSize: 12,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },

  // Empty state
  emptyResult: {
    margin: '0 16px 16px', padding: '20px',
    background: 'rgba(255,255,255,0.03)', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  emptyIcon: { fontSize: 28, opacity: 0.25 },
  emptyText: {
    fontSize: 13, color: 'rgba(240,242,255,0.3)',
    textAlign: 'center', lineHeight: 1.5,
  },

  reassurance: {
    fontSize: 12, color: 'rgba(240,242,255,0.25)',
    textAlign: 'center', marginBottom: 20, lineHeight: 1.5,
  },

  // CTAs
  ctaSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  primaryCta: {
    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #e040a0, #7c4dcc)',
    color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.02em',
    boxShadow: '0 4px 24px rgba(224,64,160,0.35)',
    transition: 'all 0.2s',
  },
  primaryCtaDisabled: {
    background: 'rgba(255,255,255,0.06)', color: 'rgba(240,242,255,0.25)',
    cursor: 'not-allowed', boxShadow: 'none',
  },
  primaryCtaActivating: {
    opacity: 0.8, cursor: 'not-allowed',
  },
  activatingRow: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' },
  activatingSpinner: {
    width: 16, height: 16, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
    display: 'inline-block', animation: 'spin 0.8s linear infinite',
  },
  demoCta: {
    width: '100%', padding: '13px', borderRadius: 14,
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(240,242,255,0.45)', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
  },
};

// Add scan animation to global styles at runtime
if (typeof document !== 'undefined' && !document.getElementById('questpass-scan-animation')) {
  const _scanStyle = document.createElement('style');
  _scanStyle.id = 'questpass-scan-animation';
  _scanStyle.textContent = `@keyframes scanMove { 0% { left: -60% } 100% { left: 110% } }`;
  document.head.appendChild(_scanStyle);
}
