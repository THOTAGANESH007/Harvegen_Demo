'use client'

export default function SimulatorToolbar({ simState, simTime, onPlay, onPause, onStop, onBuild }) {
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const STATUS = {
    idle: { text: 'Ready', color: '#546e7a' },
    running: { text: 'Simulating', color: '#69f0ae' },
    paused: { text: 'Paused', color: '#ffb74d' },
    building: { text: 'Building…', color: '#82b1ff' },
    error: { text: 'Error', color: '#ef5350' },
  }[simState] || { text: 'Ready', color: '#546e7a' }

  return (
    <header className="sim-toolbar">
      {/* Brand */}
      <div className="sim-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="5" fill="#1565c0" />
          <rect x="9" y="9" width="14" height="14" rx="2" fill="none" stroke="#82b1ff" strokeWidth="1.5" />
          <rect x="13" y="13" width="6" height="6" rx="1" fill="#82b1ff" />
          {[['8', '16', '4', '16'], ['24', '16', '28', '16'], ['16', '8', '16', '4'], ['16', '24', '16', '28']].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#82b1ff" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="sim-brand-text">
          <span className="sim-brand-name">STM32 Simulator</span>
          <span className="sim-brand-chip">STM32F103C8 </span>
        </div>
      </div>

      {/* Controls */}
      <div className="sim-controls">
        {/* Build */}
        <button className={`sim-ctrl-btn build ${simState === 'building' ? 'loading' : ''}`}
          onClick={onBuild} disabled={simState === 'building' || simState === 'running'} title="Verify & Build (Ctrl+Shift+B)">
          {simState === 'building'
            ? <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13 0h3a2 2 0 0 0 2-2v-3" /></svg>
          }
          {simState === 'building' ? 'Building…' : 'Build'}
        </button>

        <div className="sim-ctrl-divider" />

        {/* Play */}
        <button className={`sim-ctrl-btn play ${simState === 'running' ? 'active' : ''}`}
          onClick={onPlay} disabled={simState === 'running' || simState === 'building'} title="Start Simulation (F5)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          {simState === 'running' ? 'Running' : 'Play'}
        </button>

        {/* Pause */}
        <button className={`sim-ctrl-btn pause ${simState === 'paused' ? 'active' : ''}`}
          onClick={onPause} disabled={simState !== 'running'} title="Pause">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          Pause
        </button>

        {/* Stop */}
        <button className="sim-ctrl-btn stop"
          onClick={onStop} disabled={simState === 'idle' || simState === 'building'} title="Stop">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
          Stop
        </button>
      </div>

      {/* Status & Info */}
      <div className="sim-status-group">
        <div className="sim-status-indicator">
          <span className="sim-status-dot" style={{ background: STATUS.color, boxShadow: `0 0 6px ${STATUS.color}80` }} />
          <span className="sim-status-text" style={{ color: STATUS.color }}>{STATUS.text}</span>
        </div>
        {simState === 'running' && <span className="sim-timer">{fmt(simTime)}</span>}

        <div className="sim-ctrl-divider" />

        <div className="sim-chip-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" /></svg>
          72 MHz
        </div>
        <div className="sim-chip-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          64KB Flash
        </div>
        <div className="sim-chip-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          20KB SRAM
        </div>

        <div className="sim-ctrl-divider" />

        <button className="sim-icon-btn" title="Share Project">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
        <button className="sim-icon-btn" title="Back to Harvegen" onClick={() => window.location.href = '/'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>
      </div>
    </header>
  )
}
