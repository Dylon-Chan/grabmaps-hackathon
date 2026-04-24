// @ts-nocheck
"use client";
import * as React from "react";

// js/FlightSettingsModal.jsx
// Bottom-sheet modal for editing flight time from the home screen.
// Reuses helper functions exported by FlightSetup.jsx (window.*).

export const FlightSettingsModal = ({ flightData, onSave, onCancel }) => {
  // Pre-fill from existing flightData if available, else blank
  const parsedFlight = React.useMemo(() => {
    if (!flightData?.flightDateTime) return { date: '', time: '' };
    const d = new Date(flightData.flightDateTime);
    const pad = n => String(n).padStart(2, '0');
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }, [flightData]);

  const [flightDate, setFlightDate] = React.useState(parsedFlight.date);
  const [flightTime, setFlightTime] = React.useState(parsedFlight.time);
  const [bufferHours, setBufferHours] = React.useState(
    flightData?.bufferMins ? flightData.bufferMins / 60 : 2
  );
  const [saved, setSaved] = React.useState(false);

  const bufferOptions = [
    { label: '1h', value: 1 },
    { label: '2h', value: 2 },
    { label: '3h', value: 3 },
  ];

  const flightDateTime = flightDate && flightTime ? `${flightDate}T${flightTime}` : null;
  const bufferMins = bufferHours * 60;
  const minsUntilFlight = flightDateTime ? window.calculateTimeUntilFlight(flightDateTime) : null;
  const safeWindowMins = flightDateTime
    ? window.calculateSafeExplorationWindow(flightDateTime, bufferMins, window.ESTIMATED_AIRPORT_ROUTE_MINS)
    : null;
  const safetyStatus = safeWindowMins !== null ? window.getLayoverSafetyStatus(safeWindowMins) : null;
  const airportArrivalTime = flightDateTime
    ? window.calculateAirportArrivalTime(flightDateTime, bufferMins)
    : null;

  const isPast = minsUntilFlight !== null && minsUntilFlight < 0;
  const isValid = flightDateTime && !isPast;

  const fmtMins = (m) => {
    if (m <= 0) return '0m';
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}`.trim() : `${min}m`;
  };
  const fmtTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSave = () => {
    if (!isValid) return;
    setSaved(true);
    setTimeout(() => {
      onSave({
        flightDateTime,
        flightMinsRemaining: minsUntilFlight,
        bufferMins,
        safeWindowMins,
        safetyStatus,
        airportArrivalTime,
      });
    }, 900);
  };

  return (
    // Overlay
    <div style={fsmStyles.overlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      {/* Sheet */}
      <div style={fsmStyles.sheet}>
        {/* Drag handle */}
        <div style={fsmStyles.handle} />

        {/* Header */}
        <div style={fsmStyles.header}>
          <div style={fsmStyles.headerLeft}>
            <span style={fsmStyles.headerIcon}>✈</span>
            <div>
              <div style={fsmStyles.title}>Flight Settings</div>
              <div style={fsmStyles.subtitle}>Changi Airport · Singapore</div>
            </div>
          </div>
          <button onClick={onCancel} style={fsmStyles.closeBtn}>✕</button>
        </div>

        <p style={fsmStyles.helperCopy}>
          Update your flight time so we only show quests you can finish safely.
        </p>

        {/* Inputs */}
        <div style={fsmStyles.inputRow}>
          <div style={fsmStyles.inputGroup}>
            <label style={fsmStyles.inputMini}>DATE</label>
            <input
              type="date"
              value={flightDate}
              onChange={e => { setFlightDate(e.target.value); setSaved(false); }}
              style={{ ...fsmStyles.input, ...(isPast ? fsmStyles.inputError : {}) }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div style={fsmStyles.inputGroup}>
            <label style={fsmStyles.inputMini}>TIME</label>
            <input
              type="time"
              value={flightTime}
              onChange={e => { setFlightTime(e.target.value); setSaved(false); }}
              style={{ ...fsmStyles.input, ...(isPast ? fsmStyles.inputError : {}) }}
            />
          </div>
        </div>
        {isPast && <div style={fsmStyles.errorMsg}>⚠ That time is in the past. Please check again.</div>}

        {/* Buffer selector */}
        <div style={fsmStyles.sectionLabel}>AIRPORT BUFFER</div>
        <div style={fsmStyles.bufferPills}>
          {bufferOptions.map(opt => (
            <button key={opt.value}
              onClick={() => { setBufferHours(opt.value); setSaved(false); }}
              style={{ ...fsmStyles.bufferPill, ...(bufferHours === opt.value ? fsmStyles.bufferPillActive : {}) }}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Recalculated summary */}
        {isValid && safetyStatus && (
          <div style={{ ...fsmStyles.summaryCard, borderColor: safetyStatus.color + '44', background: safetyStatus.color + '0c' }}>
            <div style={{ ...fsmStyles.statusBadge, color: safetyStatus.color, background: safetyStatus.color + '18', border: `1px solid ${safetyStatus.color}44` }}>
              <span>{safetyStatus.icon}</span>
              <span>{safetyStatus.label}</span>
            </div>
            <div style={fsmStyles.summaryGrid}>
              <div style={fsmStyles.summaryBox}>
                <div style={fsmStyles.summaryNum}>{fmtMins(minsUntilFlight)}</div>
                <div style={fsmStyles.summaryLbl}>until flight</div>
              </div>
              <div style={fsmStyles.summaryBox}>
                <div style={{ ...fsmStyles.summaryNum, color: safetyStatus.color }}>{fmtMins(Math.max(0, safeWindowMins))}</div>
                <div style={fsmStyles.summaryLbl}>safe window</div>
              </div>
              <div style={fsmStyles.summaryBox}>
                <div style={fsmStyles.summaryNum}>{fmtTime(airportArrivalTime)}</div>
                <div style={fsmStyles.summaryLbl}>at Changi by</div>
              </div>
            </div>
          </div>
        )}

        {/* Save confirmation */}
        {saved && (
          <div style={fsmStyles.savedMsg}>
            <span style={{ color: '#2ecb82' }}>◈</span>
            <span style={{ color: '#2ecb82', fontWeight: 700 }}>Safety scan updated</span>
          </div>
        )}

        {/* Buttons */}
        <div style={fsmStyles.btnRow}>
          <button onClick={onCancel} style={fsmStyles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!isValid || saved}
            style={{ ...fsmStyles.saveBtn, ...(!isValid || saved ? fsmStyles.saveBtnDisabled : {}) }}
          >
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const fsmStyles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(6,8,16,0.75)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    width: '100%', maxWidth: 430,
    background: '#141626',
    borderRadius: '20px 20px 0 0',
    border: '1px solid rgba(255,255,255,0.08)',
    borderBottom: 'none',
    padding: '0 20px 36px',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
    animation: 'slideUpSheet 0.28s cubic-bezier(0.34,1.2,0.64,1)',
  },
  handle: {
    width: 36, height: 4, background: 'rgba(255,255,255,0.12)',
    borderRadius: 2, margin: '12px auto 16px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerIcon: { fontSize: 22 },
  title: {
    fontSize: 17, fontWeight: 800,
    fontFamily: "'Space Grotesk', sans-serif",
    color: '#f0f2ff',
  },
  subtitle: { fontSize: 11, color: 'rgba(240,242,255,0.35)', marginTop: 2 },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, width: 30, height: 30,
    color: 'rgba(240,242,255,0.5)', fontSize: 13,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  helperCopy: {
    fontSize: 13, color: 'rgba(240,242,255,0.4)', lineHeight: 1.5,
    margin: '0 0 16px',
  },
  inputRow: { display: 'flex', gap: 10, marginBottom: 4 },
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
  },
  inputError: { borderColor: 'rgba(245,124,48,0.5)', background: 'rgba(245,124,48,0.06)' },
  errorMsg: {
    fontSize: 12, color: '#f57c30', margin: '4px 0 8px',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
    color: 'rgba(240,242,255,0.3)', textTransform: 'uppercase',
    margin: '14px 0 8px', fontFamily: "'Space Grotesk', sans-serif",
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
  summaryCard: {
    borderRadius: 12, border: '1px solid',
    marginBottom: 12, overflow: 'hidden',
  },
  statusBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 14px', fontSize: 12, fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  summaryGrid: { display: 'flex' },
  summaryBox: {
    flex: 1, textAlign: 'center', padding: '10px 0',
    borderRight: '1px solid rgba(255,255,255,0.06)',
  },
  summaryNum: {
    fontSize: 16, fontWeight: 900, marginBottom: 2,
    fontFamily: "'Space Grotesk', sans-serif", color: '#f0f2ff',
  },
  summaryLbl: {
    fontSize: 9, color: 'rgba(240,242,255,0.35)',
    fontWeight: 600, letterSpacing: '0.05em',
  },
  savedMsg: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 700, marginBottom: 12,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  btnRow: { display: 'flex', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: '13px', borderRadius: 12,
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(240,242,255,0.45)', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
  },
  saveBtn: {
    flex: 2, padding: '13px', borderRadius: 12,
    background: 'linear-gradient(135deg, #e040a0, #7c4dcc)',
    border: 'none', color: 'white', fontWeight: 800, fontSize: 15,
    cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
    boxShadow: '0 4px 20px rgba(224,64,160,0.3)',
    transition: 'all 0.2s',
  },
  saveBtnDisabled: {
    background: 'rgba(255,255,255,0.08)', boxShadow: 'none',
    color: 'rgba(240,242,255,0.3)', cursor: 'not-allowed',
  },
};

// Slide-up animation for sheet
if (typeof document !== 'undefined' && !document.getElementById('questpass-sheet-animation')) {
  const _sheetStyle = document.createElement('style');
  _sheetStyle.id = 'questpass-sheet-animation';
  _sheetStyle.textContent = `@keyframes slideUpSheet { from { transform: translateY(100%) } to { transform: translateY(0) } }`;
  document.head.appendChild(_sheetStyle);
}
