'use client'

import { useState, useRef, useCallback } from 'react'

export default function CircuitCanvas({
  components, connections, simState, gpioState,
  onRemoveComponent, onConnectionsChange, onComponentsChange
}) {
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(1.5)
  const [offset, setOffset] = useState({ x: 70, y: 30 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [hoveredPin, setHoveredPin] = useState(null)
  const [wiringFrom, setWiringFrom] = useState(null)
  const [selectedComp, setSelectedComp] = useState(null)
  const [draggingComp, setDraggingComp] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // PC13 is active-low: 0 = LED ON
  const pc13 = gpioState?.C?.[13] ?? 1
  const ledOnBoard = pc13 === 0 && simState === 'running'

  const toCanvas = useCallback((cx, cy) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: (cx - rect.left - offset.x) / scale, y: (cy - rect.top - offset.y) / scale }
  }, [offset, scale])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setScale(s => Math.max(0.4, Math.min(4, s * (e.deltaY > 0 ? 0.9 : 1.1))))
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      e.preventDefault()
    }
  }, [offset])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (isPanning) setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    if (draggingComp) {
      const pos = toCanvas(e.clientX, e.clientY)
      onComponentsChange(prev => prev.map(c => c.id === draggingComp ? { ...c, x: pos.x - 20, y: pos.y - 15 } : c))
    }
  }, [isPanning, panStart, draggingComp, toCanvas, onComponentsChange])

  const handleMouseUp = useCallback(() => { setIsPanning(false); setDraggingComp(null) }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setWiringFrom(null)
  }, [])

  // STM32 pin definitions (board coordinates at scale=1)
  const BOARD_W = 90
  const BOARD_H = 200
  const PIN_ROWS = 14
  const PIN_SPACING = 10
  const PIN_START_Y = 28

  // Left pins: PA0–PA7, PB0, PB1, PB10, PB11, GND, 3V3
  const LEFT_PINS = ['PA0','PA1','PA2','PA3','PA4','PA5','PA6','PA7','PB0','PB1','PB10','PB11','GND','3V3']
  // Right pins
  const RIGHT_PINS = ['PA15','PA14','PA13','PA12','PA11','PA10','PA9','PA8','PB15','PB14','PB13','PB12','PC13','GND']

  const getPinPos = (side, index) => {
    const bx = offset.x
    const by = offset.y
    const y = by + (PIN_START_Y + index * PIN_SPACING) * scale
    if (side === 'left') return { x: bx + 2 * scale, y }
    return { x: bx + (BOARD_W - 2) * scale, y }
  }

  const handlePinClick = useCallback((pinId) => {
    if (!wiringFrom) { setWiringFrom(pinId); return }
    if (wiringFrom !== pinId) {
      onConnectionsChange(prev => [...prev, { id: `c-${Date.now()}`, from: wiringFrom, to: pinId, color: '#6366f1' }])
    }
    setWiringFrom(null)
  }, [wiringFrom, onConnectionsChange])

  const allPins = [
    ...LEFT_PINS.map((id, i) => ({ id, index: i, side: 'left', label: id })),
    ...RIGHT_PINS.map((id, i) => ({ id, index: i, side: 'right', label: id })),
  ]

  const getPinWorldPos = (pinId) => {
    const pin = allPins.find(p => p.id === pinId)
    if (!pin) return null
    return getPinPos(pin.side, pin.index)
  }

  return (
    <div
      ref={canvasRef}
      className="sim-canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ cursor: isPanning ? 'grabbing' : wiringFrom ? 'crosshair' : 'default', outline: 'none' }}
    >
      {/* Dot Grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
        <defs>
          <pattern id="dotgrid" width={20*scale} height={20*scale} patternUnits="userSpaceOnUse"
            x={offset.x % (20*scale)} y={offset.y % (20*scale)}>
            <circle cx={20*scale} cy={20*scale} r="0.8" fill="#1e2030"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)"/>
      </svg>

      {/* Wire SVG */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:15 }}>
        {connections.map(conn => {
          const from = getPinWorldPos(conn.from)
          const toComp = components.find(c => c.id === conn.to)
          if (!from) return null
          let toPos = toComp
            ? { x: offset.x + (toComp.x + 10) * scale, y: offset.y + toComp.y * scale }
            : getPinWorldPos(conn.to)
          if (!toPos) return null
          const mx = (from.x + toPos.x) / 2
          return (
            <path key={conn.id}
              d={`M${from.x},${from.y} C${mx},${from.y} ${mx},${toPos.y} ${toPos.x},${toPos.y}`}
              fill="none" stroke={conn.color || '#6366f1'} strokeWidth="2" strokeLinecap="round"
              style={{ filter:`drop-shadow(0 0 3px ${conn.color||'#6366f1'}80)` }}
            />
          )
        })}
        {/* Live wire while routing */}
        {wiringFrom && (() => {
          const from = getPinWorldPos(wiringFrom)
          if (!from) return null
          return <line x1={from.x} y1={from.y} x2={mousePos.x} y2={mousePos.y}
            stroke="#6366f1" strokeWidth="2" strokeDasharray="6 3"
            style={{ filter:'drop-shadow(0 0 4px #6366f1)' }}/>
        })()}
      </svg>

      {/* STM32 Blue Pill Board */}
      <div style={{
        position:'absolute', left:offset.x, top:offset.y,
        width: BOARD_W*scale, height: BOARD_H*scale,
        transformOrigin:'0 0',
      }}>
        {/* PCB */}
        <div className="sim-pcb" style={{ width:'100%', height:'100%' }}>
          {/* USB connector */}
          <div className="sim-usb" style={{ width: 18*scale, height: 14*scale, top: 4*scale, left: (BOARD_W/2-9)*scale }}>
            <span style={{ fontSize: 6*scale }}>USB</span>
          </div>

          {/* Chip body */}
          <div className="sim-chip-body" style={{
            width: 36*scale, height: 36*scale,
            top: (BOARD_H/2 - 22)*scale, left: (BOARD_W/2 - 18)*scale,
          }}>
            <div style={{ fontSize: 4.5*scale, color:'#94a3b8', textAlign:'center', lineHeight:1.2, marginTop:2*scale }}>
              STM32<br/>F103C8T6<br/>ARM
            </div>
          </div>

          {/* Crystal */}
          <div className="sim-crystal" style={{
            width:10*scale, height:22*scale,
            top:(BOARD_H/2+18)*scale, left:(BOARD_W/2-5)*scale
          }}/>

          {/* Onboard LED (PC13) */}
          <div
            className="sim-onboard-led"
            style={{
              width: 5*scale, height: 5*scale,
              top: (PIN_START_Y + 12*PIN_SPACING - 2)*scale,
              left: (BOARD_W - 14)*scale,
              background: ledOnBoard ? '#ef4444' : '#330000',
              boxShadow: ledOnBoard ? `0 0 ${8*scale}px ${4*scale}px #ef444480` : 'none',
            }}
            title="PC13 — Onboard LED (Active LOW)"
          />

          {/* RST Button */}
          <div className="sim-rst-btn" style={{ width:8*scale, height:8*scale, top:(BOARD_H-30)*scale, left:10*scale }}>
            <span style={{ fontSize: 4*scale }}>RST</span>
          </div>

          {/* Left Pins */}
          {LEFT_PINS.map((pinId, i) => {
            const y = (PIN_START_Y + i*PIN_SPACING)*scale
            const isGnd = pinId === 'GND'
            const isPwr = pinId === '3V3'
            const isActive = wiringFrom === pinId
            return (
              <div key={pinId} style={{ position:'absolute', left: 0, top: y - 3*scale, display:'flex', alignItems:'center', gap: 2*scale }}>
                <div
                  className={`sim-pin-dot ${isGnd?'gnd':isPwr?'pwr':'gpio'} ${isActive?'active':''} ${hoveredPin===pinId?'hover':''}`}
                  style={{ width:6*scale, height:6*scale, borderRadius:'50%' }}
                  onMouseEnter={() => setHoveredPin(pinId)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={() => handlePinClick(pinId)}
                  title={pinId}
                />
                <span style={{ fontSize: 4*scale, color:'#94a3b8', fontFamily:'monospace', userSelect:'none' }}>{pinId}</span>
              </div>
            )
          })}

          {/* Right Pins */}
          {RIGHT_PINS.map((pinId, i) => {
            const y = (PIN_START_Y + i*PIN_SPACING)*scale
            const isGnd = pinId === 'GND'
            const isPwr = pinId === '3V3'
            const isPC13 = pinId === 'PC13'
            const isActive = wiringFrom === pinId
            return (
              <div key={`r-${pinId}-${i}`} style={{ position:'absolute', right:0, top: y - 3*scale, display:'flex', alignItems:'center', flexDirection:'row-reverse', gap:2*scale }}>
                <div
                  className={`sim-pin-dot ${isGnd?'gnd':isPwr?'pwr':isPC13?'pc13':'gpio'} ${isActive?'active':''} ${hoveredPin===pinId?'hover':''}`}
                  style={{ width:6*scale, height:6*scale, borderRadius:'50%' }}
                  onMouseEnter={() => setHoveredPin(pinId)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={() => handlePinClick(pinId)}
                  title={pinId}
                />
                <span style={{ fontSize:4*scale, color:'#94a3b8', fontFamily:'monospace', userSelect:'none' }}>{pinId}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Draggable Components */}
      {components.map(comp => {
        const x = offset.x + comp.x*scale
        const y = offset.y + comp.y*scale
        // LED: check if any connected pin is driven LOW
        const connectedPin = connections.find(c => c.to === comp.id)?.from
        const pinPort = connectedPin ? connectedPin.match(/^P([ABC])(\d+)$/)?.[1] : null
        const pinNum = connectedPin ? connectedPin.match(/^P([ABC])(\d+)$/)?.[2] : null
        const pinVal = pinPort && pinNum ? gpioState?.[pinPort]?.[parseInt(pinNum)] : undefined
        const compLedOn = simState === 'running' && comp.type === 'led' && pinVal === (comp.activeLow ? 1 : 0)

        return (
          <div key={comp.id}
            className={`sim-component ${selectedComp === comp.id ? 'selected' : ''}`}
            style={{ position:'absolute', left:x, top:y, zIndex:20, cursor:'grab' }}
            onMouseDown={(e) => { e.stopPropagation(); setSelectedComp(comp.id); setDraggingComp(comp.id) }}
          >
            {comp.type === 'led' && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                <div className="sim-comp-led-body" style={{
                  width: 16*scale, height: 22*scale,
                  background: compLedOn ? comp.color : '#1a1a2e',
                  borderRadius: `${6*scale}px ${6*scale}px 0 0`,
                  border: `${1.5*scale}px solid ${comp.color}`,
                  boxShadow: compLedOn ? `0 0 ${10*scale}px ${5*scale}px ${comp.color}60` : 'none',
                  position:'relative',
                }}>
                  <div style={{ position:'absolute', top:3*scale, left:3*scale, width:4*scale, height:4*scale, background:'rgba(255,255,255,0.3)', borderRadius:'50%' }}/>
                </div>
                <span style={{ fontSize:8, color:'#9ca3af', fontFamily:'monospace' }}>{comp.label}</span>
              </div>
            )}
            {comp.type === 'resistor' && (
              <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                <div style={{ width:6*scale, height:2*scale, background:'#9ca3af' }}/>
                <div style={{ width:28*scale, height:10*scale, background:'#c8a862', borderRadius:2*scale, display:'flex', alignItems:'center', justifyContent:'space-evenly', padding:`0 ${2*scale}px` }}>
                  {['#8b4513','#111','#f97316','#c0c0c0'].map((c,i)=>(
                    <div key={i} style={{ width:2*scale, height:'80%', background:c }}/>
                  ))}
                </div>
                <div style={{ width:6*scale, height:2*scale, background:'#9ca3af' }}/>
                <span style={{ fontSize:8, color:'#9ca3af', fontFamily:'monospace', position:'absolute', top:12*scale, left:0 }}>{comp.label}</span>
              </div>
            )}
            {comp.type === 'button' && (
              <div style={{ width:22*scale, height:22*scale, border:`${2*scale}px solid #6b7280`, borderRadius:3*scale, background:'#1f2937', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:12*scale, height:12*scale, background:'#374151', borderRadius:2*scale }}/>
              </div>
            )}
            {comp.type === 'lcd' && (
              <div style={{ width:72*scale, height:26*scale, background:'#0d1b0d', border:`${1.5*scale}px solid #2d5a2d`, borderRadius:2*scale, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:60*scale, height:16*scale, background:'#0a150a', borderRadius:1*scale, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {simState==='running'
                    ? <span style={{ fontSize:6*scale, color:'#4ade80', fontFamily:'monospace' }}>Hello STM32!</span>
                    : <span style={{ fontSize:5*scale, color:'#1a3a1a', fontFamily:'monospace' }}>LCD 16×2</span>
                  }
                </div>
              </div>
            )}
            {comp.type === 'buzzer' && (
              <div style={{ width:22*scale, height:22*scale, background:simState==='running'?'#374151':'#1f2937', border:`${2*scale}px solid #6b7280`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.1s' }}>
                <div style={{ width:10*scale, height:10*scale, background:'#111827', borderRadius:'50%' }}/>
              </div>
            )}
            {comp.type === 'potentiometer' && (
              <div style={{ width:24*scale, height:24*scale, background:'#374151', border:`${2*scale}px solid #6b7280`, borderRadius:3*scale, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:14*scale, height:14*scale, background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:2*scale, height:6*scale, background:'#e2e8f0', borderRadius:1*scale }}/>
                </div>
              </div>
            )}
            {comp.type === 'dht22' && (
              <div style={{ width:22*scale, height:34*scale, background:'#1a2744', border:`${1.5*scale}px solid #2d4a7a`, borderRadius:2*scale, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2*scale }}>
                <span style={{ fontSize:5*scale, color:'#60a5fa', fontFamily:'monospace', fontWeight:'bold' }}>DHT22</span>
                {simState==='running'&&<span style={{ fontSize:4.5*scale, color:'#34d399', fontFamily:'monospace' }}>25°C</span>}
              </div>
            )}

            {/* Remove button when selected */}
            {selectedComp === comp.id && (
              <button className="sim-comp-remove" onClick={(e)=>{e.stopPropagation();onRemoveComponent(comp.id)}}>×</button>
            )}
          </div>
        )
      })}

      {/* Pin tooltip */}
      {hoveredPin && (() => {
        const pin = allPins.find(p => p.id === hoveredPin)
        if (!pin) return null
        const pos = getPinPos(pin.side, pin.index)
        return (
          <div className="sim-pin-tooltip" style={{ left: pos.x + 10, top: pos.y - 22, zIndex:50 }}>
            {pin.label}
          </div>
        )
      })()}

      {/* Zoom controls */}
      <div className="sim-zoom-controls">
        <button className="sim-zoom-btn" onClick={() => setScale(s => Math.min(4, s*1.2))}>+</button>
        <span className="sim-zoom-level">{Math.round(scale*100)}%</span>
        <button className="sim-zoom-btn" onClick={() => setScale(s => Math.max(0.4, s*0.8))}>−</button>
        <button className="sim-zoom-btn" onClick={() => { setScale(1.5); setOffset({x:70,y:30}) }} title="Reset">⊡</button>
      </div>

      {/* Canvas hint */}
      <div className="sim-canvas-hint">
        Alt+Drag: Pan · Scroll: Zoom · Click pin: Wire · Esc: Cancel · Click comp: Select
      </div>

      {/* Wiring mode indicator */}
      {wiringFrom && (
        <div className="sim-wiring-badge">
          🔌 Wiring from <strong>{wiringFrom}</strong> — click another pin to connect
        </div>
      )}
    </div>
  )
}
