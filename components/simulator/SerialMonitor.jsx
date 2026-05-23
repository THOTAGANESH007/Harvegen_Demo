'use client'
import { useRef, useEffect } from 'react'

export default function SerialMonitor({ logs, type, simState }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  const getLineClass = ({ type: t }) => {
    const map = { system:'sim-log-system', success:'sim-log-success', error:'sim-log-error',
      warning:'sim-log-warning', highlight:'sim-log-highlight', serial:'sim-log-serial',
      gpio:'sim-log-gpio', delay:'sim-log-delay', boot:'sim-log-system', separator:'sim-log-system',
      info:'sim-log-system', output:'sim-log-output' }
    return map[t] || 'sim-log-output'
  }

  const getBadge = ({ type: t }) => {
    if (t === 'success') return <span className="sim-log-badge ok">OK</span>
    if (t === 'error')   return <span className="sim-log-badge err">ERR</span>
    if (t === 'warning') return <span className="sim-log-badge err" style={{background:'#2d1a00',color:'#f59e0b'}}>WARN</span>
    if (t === 'gpio' || t === 'highlight') return <span className="sim-log-badge ok" style={{background:'#0d1a2d',color:'#60a5fa'}}>GPIO</span>
    if (t === 'serial')  return <span className="sim-log-badge" style={{background:'#1a0d2d',color:'#a78bfa'}}>UART</span>
    if (t === 'delay')   return <span className="sim-log-badge" style={{background:'#1a100d',color:'#fb923c'}}>DLY</span>
    if (t === 'system' || t === 'boot') return <span className="sim-log-badge sys">SYS</span>
    if (t === 'info')    return <span className="sim-log-badge inf">INFO</span>
    return null
  }

  const fmt = (ts) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`
  }

  return (
    <div className="sim-serial-monitor">
      {logs.length === 0 ? (
        <div className="sim-serial-empty">
          {type === 'serial'
            ? <><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg><span>Press ▶ Play to start simulation</span></>
            : <><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg><span>Click Build to compile firmware</span></>
          }
        </div>
      ) : (
        <div className="sim-log-container">
          {logs.map((log, i) => (
            <div key={i} className={`sim-log-line ${getLineClass(log)}`}>
              <span className="sim-log-time">{fmt(log.time)}</span>
              <span className="sim-log-prefix">{getBadge(log)}</span>
              <span className="sim-log-msg">{log.msg}</span>
            </div>
          ))}
          {simState === 'running' && type === 'serial' && (
            <div className="sim-log-cursor">
              <span className="sim-log-time">{fmt(Date.now())}</span>
              <span className="sim-cursor-blink">█</span>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      )}
    </div>
  )
}
