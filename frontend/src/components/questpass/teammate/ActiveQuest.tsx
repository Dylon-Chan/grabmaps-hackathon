// @ts-nocheck
"use client";
import { GrabMap } from "@/components/GrabMap";
import * as React from "react";

// Screen 3: Active Quest — with location state machine + distance + CTA states
export const ActiveQuest = ({ quest, onStopUnlocked, onBack, onComplete, locationState, userLocation, onRequestLocation, demoMode, airportState, flightMinsRemaining, initialStopIdx = 0, unlockedStopIds = [] as string[], city, route }) => {
  const [currentStopIdx, setCurrentStopIdx] = React.useState(initialStopIdx);
  const [hintUsed, setHintUsed] = React.useState(false);
  const [arriving, setArriving] = React.useState(false);
  const [placeSearchStatus, setPlaceSearchStatus] = React.useState('idle'); // idle|loading|success|failed|using_fallback
  const [resolvedPlace, setResolvedPlace] = React.useState(null);
  const [stops, setStops] = React.useState(quest.stops_data.map(s => ({ ...s, unlocked: unlockedStopIds.includes(s.id) })));

  React.useEffect(() => {
    setCurrentStopIdx(initialStopIdx);
    setStops(quest.stops_data.map(s => ({ ...s, unlocked: unlockedStopIds.includes(s.id) })));
    setHintUsed(false);
    setPlaceSearchStatus('idle');
  }, [quest.id, initialStopIdx, unlockedStopIds.join('|')]);

  const currentStop = stops[currentStopIdx];
  const completedCount = stops.filter(s => s.unlocked).length;
  const progress = completedCount / stops.length;

  // Compute distance to current stop
  const stopLocation = React.useMemo(() => ({
    lat: currentStop.resolvedLat || currentStop.lat,
    lng: currentStop.resolvedLng || currentStop.lng,
  }), [currentStop]);

  const distanceMeters = React.useMemo(() => {
    if (!userLocation) return null;
    return window.GrabMaps.calculateDistance(userLocation, stopLocation);
  }, [userLocation, stopLocation]);

  const withinRadius = window.GrabMaps.isWithinUnlockRadius(distanceMeters, currentStop.unlockRadiusMeters);

  // Resolve place via GrabMaps stub on mount / stop change
  React.useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      setPlaceSearchStatus('loading');
      setResolvedPlace(null);
      const result = await window.GrabMaps.searchPlace(currentStop.placeQuery);
      if (cancelled) return;
      if (result && result.lat) {
        setResolvedPlace(result);
        setPlaceSearchStatus('success');
      } else {
        // Use fallback coords from data
        setPlaceSearchStatus('using_fallback');
        setResolvedPlace({ name: currentStop.name, lat: currentStop.fallbackLat, lng: currentStop.fallbackLng });
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [currentStopIdx]);

  // CTA state machine
  // not_requested → Enable Location
  // loading → Locating…
  // denied/demo → Simulate Arrival
  // granted + outside radius → Get Directions
  // granted + within radius → Unlock Stop
  const ctaState = React.useMemo(() => {
    if (locationState === 'not_requested') return 'enable_location';
    if (locationState === 'loading') return 'locating';
    if (locationState === 'denied' || demoMode) return 'simulate';
    if (withinRadius) return 'unlock';
    return 'get_directions';
  }, [locationState, demoMode, withinRadius]);

  const handleSimulateArrival = () => {
    setArriving(true);
    setTimeout(() => {
      setArriving(false);
      const updatedStop = { ...currentStop, resolvedLat: stopLocation.lat, resolvedLng: stopLocation.lng };
      onStopUnlocked(updatedStop, currentStopIdx, stops.length, () => {
        const updated = stops.map((s, i) => i === currentStopIdx ? { ...s, unlocked: true } : s);
        setStops(updated);
        if (currentStopIdx + 1 < stops.length) {
          setCurrentStopIdx(currentStopIdx + 1);
          setHintUsed(false);
          setPlaceSearchStatus('idle');
        } else {
          onComplete(quest);
        }
      });
    }, 1200);
  };

  // Airport buffer display
  const bufferColor = { safe: '#2ecb82', warning: '#f0bc42', unsafe: '#f57c30' }[airportState];
  const bufferIcon = { safe: '🛡', warning: '⚠', unsafe: '🚨' }[airportState];
  const flightH = Math.floor(flightMinsRemaining / 60);
  const flightM = flightMinsRemaining % 60;

  // Format distance
  const fmtDist = (m) => {
    if (m === null) return '—';
    if (m < 1000) return `${Math.round(m)}m`;
    return `${(m / 1000).toFixed(1)}km`;
  };

  // Location status label
  const locationStatusLabel = {
    not_requested: { label: 'Location off', color: 'rgba(240,242,255,0.3)', icon: '📍' },
    loading: { label: 'Locating…', color: '#3d8ff5', icon: '📡' },
    granted: { label: `~${fmtDist(distanceMeters)} away`, color: withinRadius ? '#2ecb82' : '#f0bc42', icon: withinRadius ? '✓' : '🧭' },
    denied: { label: 'Demo mode', color: '#7c4dcc', icon: '🎮' },
  }[locationState] || { label: 'Demo mode', color: '#7c4dcc', icon: '🎮' };

  return (
    <div style={aqStyles.root}>
      {/* Airport Buffer Bar */}
      <div style={{ ...aqStyles.buffer, background: `linear-gradient(90deg, ${bufferColor}14, ${bufferColor}08)`, borderBottom: `1px solid ${bufferColor}30` }}>
        <div style={aqStyles.bufferContent}>
          <span style={{ ...aqStyles.bufferLabel, color: bufferColor }}>Airport buffer</span>
          <span style={aqStyles.bufferTime}>
            {flightH}h {flightM}m to flight
            {airportState === 'safe' && ' · You have time'}
            {airportState === 'warning' && ' · Wrap up soon'}
            {airportState === 'unsafe' && ' · Head to airport now!'}
          </span>
        </div>
        <div style={{ ...aqStyles.shieldDot, background: bufferColor, boxShadow: `0 0 6px ${bufferColor}` }} />
      </div>

      {/* Header */}
      <div style={aqStyles.header}>
        <button onClick={onBack} style={aqStyles.backBtn}>← Quests</button>
        <div style={aqStyles.questTitle}>{quest.name}</div>
        <div style={{ ...aqStyles.xpChip, color: quest.color }}>+{quest.xpReward} XP</div>
      </div>

      {/* Progress bar */}
      <div style={aqStyles.progressSection}>
        <div style={aqStyles.progressHeader}>
          <span style={aqStyles.progressLabel}>Quest Progress</span>
          <span style={aqStyles.progressFrac}>{completedCount}/{stops.length} stops</span>
        </div>
        <div style={aqStyles.progressBar}>
          <div style={{ ...aqStyles.progressFill, width: `${progress * 100}%`, background: quest.color }} />
        </div>
      </div>

      {/* Stop Timeline */}
      <div style={aqStyles.timeline}>
        {stops.map((stop, i) => {
          const isCurrent = i === currentStopIdx;
          const isDone = stop.unlocked;
          const isFutureStop = i > currentStopIdx;
          return (
            <div key={stop.id} style={aqStyles.timelineItem}>
              {i < stops.length - 1 && (
                <div style={{ ...aqStyles.connector, background: isDone ? quest.color : 'rgba(255,255,255,0.1)' }} />
              )}
              <div style={{
                ...aqStyles.stopDot,
                ...(isDone ? { background: quest.color, boxShadow: `0 0 10px ${quest.color}` } : {}),
                ...(isCurrent ? { background: '#e040a0', boxShadow: '0 0 12px #e040a0', border: '2px solid white' } : {}),
                ...(isFutureStop ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } : {}),
              }}>
                {isDone ? '✓' : isCurrent ? stop.number : '?'}
              </div>
              <div style={aqStyles.stopLabel}>
                {isDone && <span style={{ fontSize: 11, color: quest.color, fontWeight: 700 }}>{stop.name}</span>}
                {isCurrent && <span style={{ fontSize: 11, color: '#e040a0', fontWeight: 700 }}>NOW</span>}
                {isFutureStop && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>???</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Location + Distance Status */}
      <div style={aqStyles.locationBar}>
        {/* Place search status */}
        <div style={aqStyles.placeStatus}>
          {placeSearchStatus === 'loading' && (
            <span style={{ ...aqStyles.statusChip, color: '#3d8ff5', borderColor: 'rgba(61,143,245,0.3)' }}>
              <span style={aqStyles.spinnerSm} /> Searching place…
            </span>
          )}
          {placeSearchStatus === 'success' && (
            <span style={{ ...aqStyles.statusChip, color: '#2ecb82', borderColor: 'rgba(46,203,130,0.3)' }}>
              ✓ {resolvedPlace?.name || currentStop.name}
            </span>
          )}
          {placeSearchStatus === 'using_fallback' && (
            <span style={{ ...aqStyles.statusChip, color: '#f0bc42', borderColor: 'rgba(240,188,66,0.3)' }}>
              ⚠ Using fallback coords
            </span>
          )}
          {placeSearchStatus === 'failed' && (
            <span style={{ ...aqStyles.statusChip, color: '#f57c30', borderColor: 'rgba(245,124,48,0.3)' }}>
              ✕ Place search failed
            </span>
          )}
        </div>
        {/* Location + distance */}
        <div style={{ ...aqStyles.statusChip, color: locationStatusLabel.color, borderColor: locationStatusLabel.color + '44' }}>
          <span>{locationStatusLabel.icon}</span>
          <span>{locationStatusLabel.label}</span>
        </div>
        {/* Unlock radius indicator */}
        {locationState === 'granted' && (
          <div style={{ ...aqStyles.statusChip, color: withinRadius ? '#2ecb82' : 'rgba(240,242,255,0.4)', borderColor: withinRadius ? 'rgba(46,203,130,0.3)' : 'rgba(255,255,255,0.08)' }}>
            ◎ {currentStop.unlockRadiusMeters}m radius
          </div>
        )}
        {demoMode && locationState !== 'loading' && (
          <div style={{ ...aqStyles.statusChip, color: '#7c4dcc', borderColor: 'rgba(124,77,204,0.3)' }}>
            🎮 Demo mode
          </div>
        )}
      </div>

      {/* Current Clue Card */}
      <div style={aqStyles.clueSection}>
        <div style={aqStyles.clueHeader}>
          <span style={aqStyles.clueStopNum}>STOP {currentStop.number} of {stops.length}</span>
          <span style={aqStyles.clueArea}>{currentStop.neighborhood}</span>
        </div>

        <div style={aqStyles.clueCard}>
          <div style={aqStyles.cluePattern}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ ...aqStyles.cluePatternDot, opacity: 0.08 + (i % 3) * 0.06 }} />
            ))}
          </div>
          <div style={aqStyles.clueBody}>
            <div style={aqStyles.clueEyeRow}>
              <span style={aqStyles.clueEye}>🔍</span>
              <span style={aqStyles.clueWordLabel}>CLUE</span>
            </div>
            <p style={aqStyles.clueText}>"{currentStop.clue}"</p>
          </div>
          {hintUsed && (
            <div style={aqStyles.hintBox}>
              <span style={aqStyles.hintLabel}>💡 HINT</span>
              <p style={aqStyles.hintText}>{currentStop.hint}</p>
            </div>
          )}
        </div>

        {/* Action Buttons — CTA state machine */}
        <div style={aqStyles.actions}>
          {!hintUsed && ctaState !== 'enable_location' && (
            <button onClick={() => setHintUsed(true)} style={aqStyles.hintBtn}>💡 Hint</button>
          )}

          {ctaState === 'enable_location' && (
            <button onClick={onRequestLocation} style={aqStyles.enableLocationBtn}>
              📍 Enable Location
            </button>
          )}
          {ctaState === 'locating' && (
            <button disabled style={aqStyles.loadingBtn}>
              <span style={aqStyles.spinner} /> Locating…
            </button>
          )}
          {ctaState === 'get_directions' && (
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${stopLocation.lat},${stopLocation.lng}`, '_blank')}
              style={aqStyles.directionsBtn}
            >
              🧭 Get Directions
            </button>
          )}
          {ctaState === 'unlock' && (
            <button onClick={handleSimulateArrival} style={aqStyles.unlockBtn}>
              ✦ Unlock Stop
            </button>
          )}
          {ctaState === 'simulate' && (
            <button onClick={handleSimulateArrival} disabled={arriving} style={{ ...aqStyles.arrivalBtn, ...(arriving ? aqStyles.arrivalBtnLoading : {}) }}>
              {arriving
                ? <span style={aqStyles.arrivalLoading}><span style={aqStyles.spinner} /> Detecting arrival…</span>
                : <>📡 Simulate Arrival</>
              }
            </button>
          )}
        </div>

        {/* Contextual note */}
        {ctaState === 'simulate' && <p style={aqStyles.arrivalNote}>Demo mode · tap to simulate physical arrival</p>}
        {ctaState === 'get_directions' && distanceMeters !== null && (
          <p style={aqStyles.arrivalNote}>You are {fmtDist(distanceMeters)} away · need to be within {currentStop.unlockRadiusMeters}m to unlock</p>
        )}
        {ctaState === 'enable_location' && <p style={aqStyles.arrivalNote}>Enable location to see distance · or use demo mode</p>}
      </div>

      {/* Mini-map */}
      <div style={aqStyles.miniMapSection}>
        <div style={aqStyles.miniMapLabel}>LIVE GRABMAPS ROUTE</div>
        <div style={aqStyles.miniMap}>
          {city && (
            <GrabMap
              city={city}
              stops={quest.sourceQuest.stops}
              activeStopId={currentStop.sourceStop.id}
              route={route}
              onStopSelect={(stopId) => {
                const idx = quest.sourceQuest.stops.findIndex((stop) => stop.id === stopId);
                if (idx !== -1) setCurrentStopIdx(idx);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const aqStyles = {
  root: { minHeight: '100vh', background: '#0b0d1a', color: '#f0f2ff', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', paddingBottom: 32 },
  buffer: { padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, transition: 'all 0.4s' },
  bufferContent: { flex: 1 },
  bufferLabel: { fontWeight: 700, display: 'block', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' },
  bufferTime: { color: 'rgba(240,242,255,0.6)', fontSize: 12 },
  shieldDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  backBtn: { background: 'none', border: 'none', color: 'rgba(240,242,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  questTitle: { fontSize: 14, fontWeight: 700, color: 'rgba(240,242,255,0.9)', fontFamily: "'Space Grotesk', sans-serif", maxWidth: 160, textAlign: 'center' },
  xpChip: { fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" },
  progressSection: { padding: '16px 20px 0' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(240,242,255,0.4)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" },
  progressFrac: { fontSize: 12, fontWeight: 600, color: 'rgba(240,242,255,0.5)', fontFamily: "'Space Grotesk', sans-serif" },
  progressBar: { height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, transition: 'width 0.6s ease' },
  timeline: { display: 'flex', alignItems: 'flex-start', padding: '20px 20px 0', gap: 0, position: 'relative' },
  timelineItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  connector: { position: 'absolute', top: 12, left: '50%', right: '-50%', height: 2, zIndex: 0, transition: 'background 0.4s' },
  stopDot: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, zIndex: 1, position: 'relative', fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.3s', color: 'white' },
  stopLabel: { marginTop: 6, textAlign: 'center', maxWidth: 60, lineHeight: 1.2 },
  // Location bar
  locationBar: { display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 16px 0' },
  placeStatus: { display: 'flex', alignItems: 'center' },
  statusChip: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 8, border: '1px solid', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.02em' },
  spinnerSm: { width: 10, height: 10, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#3d8ff5', display: 'inline-block', animation: 'spin 0.8s linear infinite' },
  // Clue section
  clueSection: { padding: '16px 16px 0' },
  clueHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clueStopNum: { fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(240,242,255,0.4)', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" },
  clueArea: { fontSize: 12, fontWeight: 600, color: '#e040a0', background: 'rgba(224,64,160,0.12)', border: '1px solid rgba(224,64,160,0.25)', borderRadius: 6, padding: '3px 8px' },
  clueCard: { background: 'linear-gradient(135deg, #16162a, #1a1535)', border: '1px solid rgba(224,64,160,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 30px rgba(224,64,160,0.08)' },
  cluePattern: { display: 'flex', flexWrap: 'wrap', gap: 4, padding: '10px 14px 6px' },
  cluePatternDot: { width: 8, height: 8, borderRadius: 2, background: '#e040a0' },
  clueBody: { padding: '4px 18px 18px' },
  clueEyeRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  clueEye: { fontSize: 20 },
  clueWordLabel: { fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: '#e040a0', fontFamily: "'Space Grotesk', sans-serif" },
  clueText: { fontSize: 16, lineHeight: 1.6, margin: 0, color: 'rgba(240,242,255,0.9)', fontStyle: 'italic' },
  hintBox: { borderTop: '1px solid rgba(240,188,66,0.2)', background: 'rgba(240,188,66,0.05)', padding: '12px 18px' },
  hintLabel: { fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#f0bc42', display: 'block', marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" },
  hintText: { fontSize: 14, color: 'rgba(240,188,66,0.8)', margin: 0, lineHeight: 1.5 },
  // Action buttons
  actions: { display: 'flex', gap: 10, marginTop: 14 },
  hintBtn: { flex: '0 0 auto', padding: '13px 16px', borderRadius: 12, background: 'rgba(240,188,66,0.1)', border: '1px solid rgba(240,188,66,0.25)', color: '#f0bc42', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  enableLocationBtn: { flex: 1, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #3d8ff5, #7c4dcc)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 4px 20px rgba(61,143,245,0.3)' },
  loadingBtn: { flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(240,242,255,0.4)', fontWeight: 700, fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'not-allowed' },
  directionsBtn: { flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(61,143,245,0.15)', border: '1px solid rgba(61,143,245,0.3)', color: '#3d8ff5', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  unlockBtn: { flex: 1, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #2ecb82, #3d8ff5)', border: 'none', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 4px 20px rgba(46,203,130,0.35)', animation: 'glow-pulse 2s infinite' },
  arrivalBtn: { flex: 2, padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #e040a0, #7c4dcc)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 4px 20px rgba(224,64,160,0.3)', transition: 'all 0.2s' },
  arrivalBtnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  arrivalLoading: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  spinner: { width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', display: 'inline-block', animation: 'spin 0.8s linear infinite' },
  arrivalNote: { fontSize: 11, color: 'rgba(240,242,255,0.25)', textAlign: 'center', marginTop: 8 },
  miniMapSection: { padding: '20px 16px 0' },
  miniMapLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(240,242,255,0.3)', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif" },
  miniMap: { position: 'relative', height: 170, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' },
};
