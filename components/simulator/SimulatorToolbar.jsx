'use client'

export default function SimulatorToolbar({ simState, simTime, onPlay, onPause, onStop, onBuild, onTogglePalette, showPalette }) {
  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const stateLabel = {
    idle: { text: 'Ready', color: '#6b7280' },
    running: { text: 'Simulating', color: '#10b981' },
    paused: { text: 'Paused', color: '#f59e0b' },
    building: { text: 'Building...', color: '#3b82f6' },
    error: { text: 'Error', color: '#ef4444' },
  }[simState] || { text: 'Ready', color: '#6b7280' }

  return (
    <header className="sim-toolbar">
      {/* Brand */}
      <div className="sim-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="6" fill="#6366f1"/>
          <rect x="8" y="8" width="16" height="16" rx="2" fill="none" stroke="white" strokeWidth="1.5"/>
          <circle cx="11" cy="11" r="1.2" fill="white"/>
          <circle cx="21" cy="11" r="1.2" fill="white"/>
          <circle cx="11" cy="21" r="1.2" fill="white"/>
          <circle cx="21" cy="21" r="1.2" fill="white"/>
          <rect x="13" y="13" width="6" height="6" rx="1" fill="white" opacity="0.8"/>
          <line x1="8" y1="16" x2="4" y2="16" stroke="white" strokeWidth="1.5"/>
          <line x1="24" y1="16" x2="28" y2="16" stroke="white" strokeWidth="1.5"/>
          <line x1="16" y1="8" x2="16" y2="4" stroke="white" strokeWidth="1.5"/>
          <line x1="16" y1="24" x2="16" y2="28" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div className="sim-brand-text">
          <span className="sim-brand-name">STM32 Simulator</span>
          <span className="sim-brand-chip">STM32F103C8 · Blue Pill</span>
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="sim-controls">
        {/* Build */}
        <button
          className={`sim-ctrl-btn build ${simState === 'building' ? 'loading' : ''}`}
          onClick={onBuild}
          disabled={simState === 'building' || simState === 'running'}
          title="Build firmware (Ctrl+Shift+B)"
        >
          {simState === 'building' ? (
            <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m13 0h3a2 2 0 0 0 2-2v-3"/>
            </svg>
          )}
          {simState === 'building' ? 'Building...' : 'Build'}
        </button>

        <div className="sim-ctrl-divider" />

        {/* Play */}
        <button
          className={`sim-ctrl-btn play ${simState === 'running' ? 'active' : ''}`}
          onClick={onPlay}
          disabled={simState === 'running' || simState === 'building'}
          title="Start simulation (F5)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          {simState === 'running' ? 'Running' : 'Play'}
        </button>

        {/* Pause */}
        <button
          className={`sim-ctrl-btn pause ${simState === 'paused' ? 'active' : ''}`}
          onClick={onPause}
          disabled={simState !== 'running'}
          title="Pause simulation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
          Pause
        </button>

        {/* Stop */}
        <button
          className="sim-ctrl-btn stop"
          onClick={onStop}
          disabled={simState === 'idle' || simState === 'building'}
          title="Stop simulation"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          Stop
        </button>
      </div>

      {/* Status & Info */}
      <div className="sim-status-group">
        <div className="sim-status-indicator">
          <span className="sim-status-dot" style={{ background: stateLabel.color }} />
          <span className="sim-status-text" style={{ color: stateLabel.color }}>{stateLabel.text}</span>
        </div>
        {simState === 'running' && (
          <span className="sim-timer">{formatTime(simTime)}</span>
        )}

        <div className="sim-ctrl-divider" />

        {/* Clock freq badge */}
        <div className="sim-chip-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
          </svg>
          72 MHz
        </div>
        <div className="sim-chip-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/><path d="M14 15v4"/><path d="M8 15v4"/><path d="M6 19h12"/>
          </svg>
          64KB Flash
        </div>

        <div className="sim-ctrl-divider" />

        {/* Right actions */}
        <button className="sim-icon-btn" title="Simulator settings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </button>
        <button className="sim-icon-btn" title="Share project">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <button className="sim-icon-btn" title="Back to Harvegen" onClick={() => window.location.href = '/'}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
