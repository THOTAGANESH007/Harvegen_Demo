'use client'

import { useState, useRef, useCallback } from 'react'
import { ComponentIcon } from './ComponentPalette'
import { COMPONENT_PINS, parseEndpoint, isRailPin } from './componentPins'

export default function CircuitCanvas({
  components, connections, simState, gpioState,
  onRemoveComponent, onConnectionsChange, onComponentsChange,
  pendingComponent, onPlaceComponent, onCancelPlace
}) {
  const canvasRef = useRef(null)
  const [scale, setScale] = useState(1.5)
  const [offset, setOffset] = useState({ x: 70, y: 30 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [hoveredPin, setHoveredPin] = useState(null)
  const [wiringFrom, setWiringFrom] = useState(null)
  const [selectedComp, setSelectedComp] = useState(null)
  const [selectedWire, setSelectedWire] = useState(null)
  const [draggingComp, setDraggingComp] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [ghostRotation, setGhostRotation] = useState(0)

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

  // Cancel wiring or clear active selections on empty-canvas CLICK
  const handleCanvasClick = useCallback(() => {
    if (wiringFrom) {
      setWiringFrom(null)
    } else {
      setSelectedComp(null)
      setSelectedWire(null)
    }
  }, [wiringFrom])

  const handleMouseDown = useCallback((e) => {
    // Place pending component on left click
    if (pendingComponent && e.button === 0 && !e.altKey) {
      const pos = toCanvas(e.clientX, e.clientY)
      onPlaceComponent({ ...pendingComponent, x: pos.x - 15, y: pos.y - 15, rotation: ghostRotation })
      setGhostRotation(0)
      return
    }
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
      e.preventDefault()
    }
  }, [offset, pendingComponent, onPlaceComponent, toCanvas, ghostRotation])

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
    if (e.key === 'Escape') {
      if (pendingComponent) {
        onCancelPlace()
        setGhostRotation(0)
      } else {
        setWiringFrom(null)
        setSelectedWire(null)
      }
    }
    if (e.key === 'r' || e.key === 'R') {
      if (pendingComponent) setGhostRotation(r => (r + 90) % 360)
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedComp) {
        onRemoveComponent(selectedComp)
        setSelectedComp(null)
      } else if (selectedWire) {
        onConnectionsChange(prev => prev.filter(c => c.id !== selectedWire))
        setSelectedWire(null)
      }
    }
  }, [pendingComponent, onCancelPlace, selectedComp, onRemoveComponent, selectedWire, onConnectionsChange])

  // ─── STM32 Board Pin Definitions ─────────────────────────────────────────
  const BOARD_W = 90
  const BOARD_H = 200
  const PIN_SPACING = 10
  const PIN_START_Y = 28

  const LEFT_PINS = ['PA0','PA1','PA2','PA3','PA4','PA5','PA6','PA7','PB0','PB1','PB10','PB11','GND','3V3']
  const RIGHT_PINS = ['PA15','PA14','PA13','PA12','PA11','PA10','PA9','PA8','PB15','PB14','PB13','PB12','PC13','GND']

  const getPinPos = (side, index) => {
    const y = offset.y + (PIN_START_Y + index * PIN_SPACING) * scale
    if (side === 'left') return { x: offset.x + 2 * scale, y }
    return { x: offset.x + (BOARD_W - 2) * scale, y }
  }

  const allBoardPins = [
    ...LEFT_PINS.map((id, i) => ({ id, index: i, side: 'left', label: id })),
    ...RIGHT_PINS.map((id, i) => ({ id, index: i, side: 'right', label: id })),
  ]

  const getBoardPinWorldPos = (pinId) => {
    const pin = allBoardPins.find(p => p.id === pinId)
    if (!pin) return null
    return getPinPos(pin.side, pin.index)
  }

  // ─── Get the world position of a component's pin dot ─────────────────────
  const getCompPinPos = (comp) => {
    // Pin is at the bottom-left of the component (anode/input terminal)
    const cx = offset.x + comp.x * scale
    const cy = offset.y + comp.y * scale
    return { x: cx + 4 * scale, y: cy + getCompHeight(comp) * scale + 4 * scale }
  }

  const getCompHeight = (comp) => {
    switch (comp.type) {
      case 'led':         return 30
      case 'resistor':    return 14
      case 'button':      return 22
      case 'lcd':         return 30
      case 'buzzer':      return 22
      case 'potentiometer': return 24
      case 'dht22':       return 40
      default:            return 24
    }
  }

  // ─── Resolve endpoint ("PA0" or "led-123:A") to screen {x,y} ─────────────
  const resolveEndpointPos = (endpointId) => {
    if (!endpointId) return null

    // Board pin: PA0, GND, 3V3, etc.
    const boardPos = getBoardPinWorldPos(endpointId)
    if (boardPos) return boardPos

    // Component pin: "compId:pinId"
    if (endpointId.includes(':')) {
      const { compId, pinId } = parseEndpoint(endpointId)
      const comp = components.find(c => c.id === compId)
      if (!comp) return null
      const schema = COMPONENT_PINS[comp.type]
      const pinDef = schema?.pins.find(p => p.id === pinId)
      if (!pinDef) return null
      return {
        x: offset.x + (comp.x + pinDef.offsetX) * scale,
        y: offset.y + (comp.y + pinDef.offsetY) * scale,
      }
    }

    // Legacy fallback: whole component (single bottom dot)
    const comp = components.find(c => c.id === endpointId)
    if (comp) return {
      x: offset.x + (comp.x + 8) * scale,
      y: offset.y + (comp.y + getCompHeight(comp)) * scale + 6 * scale,
    }
    return null
  }

  // ─── Wiring: unified handler with connection-limit enforcement ─────────────
  const handleWireClick = useCallback((e, endpointId) => {
    e.stopPropagation()
    if (pendingComponent) return

    if (!wiringFrom) {
      setWiringFrom(endpointId)
      return
    }

    // Clicked same endpoint = cancel
    if (wiringFrom === endpointId) {
      setWiringFrom(null)
      return
    }

    // Enforce: one wire per pin (GND/3V3 board pins allow multiple)
    const isPinAlreadyUsed = (epId) => {
      if (isRailPin(epId)) return false  // power rails allow multiple wires
      return connections.some(c => c.from === epId || c.to === epId)
    }
    if (isPinAlreadyUsed(wiringFrom)) {
      alert(`Pin "${wiringFrom}" already has a wire connected!`)
      setWiringFrom(null)
      return
    }
    if (isPinAlreadyUsed(endpointId)) {
      alert(`Pin "${endpointId.includes(':') ? endpointId.split(':')[1] : endpointId}" already has a wire connected!`)
      setWiringFrom(null)
      return
    }

    // Pick wire color based on pin type
    const getWireColor = (epId) => {
      if (epId === 'GND' || epId.endsWith(':GND') || epId.endsWith(':K') || epId.endsWith(':-')) return '#60a5fa'
      if (epId === '3V3' || epId.endsWith(':VCC') || epId.endsWith(':+')) return '#ef4444'
      if (epId.endsWith(':SDA')) return '#a78bfa'
      if (epId.endsWith(':SCL')) return '#818cf8'
      return '#69f0ae'  // signal/data = green
    }
    const color = getWireColor(endpointId) !== '#69f0ae' ? getWireColor(endpointId) : getWireColor(wiringFrom)

    onConnectionsChange(prev => [...prev, {
      id: `c-${Date.now()}`, from: wiringFrom, to: endpointId, color
    }])
    setWiringFrom(null)
  }, [wiringFrom, connections, onConnectionsChange, pendingComponent])

  // ─── Component body click: select OR complete wire ───────────────────────
  const handleCompClick = useCallback((e, compId) => {
    e.stopPropagation()
    if (wiringFrom) {
      handleWireClick(e, compId)
    } else {
      setSelectedComp(prev => prev === compId ? null : compId)
    }
  }, [wiringFrom, handleWireClick])

  return (
    <div
      ref={canvasRef}
      className="sim-canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      onClick={handleCanvasClick}
      tabIndex={0}
      style={{ cursor: isPanning ? 'grabbing' : (pendingComponent || wiringFrom) ? 'crosshair' : 'default', outline: 'none' }}
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



      {/* STM32 Blue Pill Board */}
      <div style={{
        position:'absolute', left:offset.x, top:offset.y,
        width: BOARD_W*scale, height: BOARD_H*scale,
        transformOrigin:'0 0',
      }}>
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
                  style={{ width:6*scale, height:6*scale, borderRadius:'50%', cursor:'crosshair' }}
                  onMouseEnter={() => setHoveredPin(pinId)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={(e) => handleWireClick(e, pinId)}
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
                  style={{ width:6*scale, height:6*scale, borderRadius:'50%', cursor:'crosshair' }}
                  onMouseEnter={() => setHoveredPin(pinId)}
                  onMouseLeave={() => setHoveredPin(null)}
                  onClick={(e) => handleWireClick(e, pinId)}
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
        const cx = offset.x + comp.x * scale
        const cy = offset.y + comp.y * scale
        const connectedPin = connections.find(c => c.to === comp.id || c.from === comp.id)
        const boardPin = connectedPin
          ? (connectedPin.from === comp.id ? connectedPin.to : connectedPin.from)
          : null
        const pinMatch = boardPin ? boardPin.match(/^P([ABC])(\d+)$/) : null
        const pinVal = pinMatch ? gpioState?.[pinMatch[1]]?.[parseInt(pinMatch[2])] : undefined
        const compLedOn = simState === 'running' && comp.type === 'led' && pinVal === 0
        const isWiringSource = wiringFrom === comp.id
        const isWireTarget = !!wiringFrom && wiringFrom !== comp.id

        return (
          <div key={comp.id}
            className={`sim-component ${selectedComp === comp.id ? 'selected' : ''}`}
            style={{
              position:'absolute', left:cx, top:cy, zIndex:20,
              cursor: wiringFrom ? 'crosshair' : 'grab',
              outline: isWireTarget ? `2px dashed #6366f1` : isWiringSource ? `2px solid #69f0ae` : 'none',
              outlineOffset: '3px',
              borderRadius: 4,
            }}
            onMouseDown={(e) => {
              if (wiringFrom) return  // Don't start drag during wiring
              e.stopPropagation()
              setSelectedComp(comp.id)
              setDraggingComp(comp.id)
            }}
            onClick={(e) => handleCompClick(e, comp.id)}
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

            {/* Per-pin dots from schema — correct hardware pin positions */}
            {(() => {
              const schema = COMPONENT_PINS[comp.type]
              if (!schema) return null
              return schema.pins.map(pin => {
                const epId = `${comp.id}:${pin.id}`
                const isSource = wiringFrom === epId
                const isTarget = !!wiringFrom && wiringFrom !== epId
                const isUsed = connections.some(c => c.from === epId || c.to === epId)
                return (
                  <div
                    key={pin.id}
                    title={`${pin.label}\n${pin.description}${isUsed ? ' [CONNECTED]' : ''}`}
                    onClick={(e) => {
                      if (isUsed && !wiringFrom) return  // already wired, only allow as target
                      handleWireClick(e, epId)
                    }}
                    style={{
                      position: 'absolute',
                      left: pin.offsetX * scale,
                      top: pin.offsetY * scale,
                      width: 7 * scale,
                      height: 7 * scale,
                      borderRadius: '50%',
                      background: isUsed ? '#2d4a2d' : isSource ? '#69f0ae' : isTarget ? pin.color : pin.color,
                      border: `${Math.max(1, 1.5 * scale)}px solid ${isSource ? '#69f0ae' : isUsed ? '#1b3a1b' : '#1a1a2e'}`,
                      boxShadow: isSource ? `0 0 ${6 * scale}px #69f0ae` : isTarget ? `0 0 ${4 * scale}px ${pin.color}` : 'none',
                      opacity: isUsed ? 0.5 : 1,
                      cursor: isUsed && !wiringFrom ? 'not-allowed' : 'crosshair',
                      zIndex: 35,
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.15s',
                    }}
                  />
                )
              })
            })()}

            {/* Remove button when selected */}
            {selectedComp === comp.id && (
              <button className="sim-comp-remove" onClick={(e)=>{e.stopPropagation();onRemoveComponent(comp.id)}}>×</button>
            )}
          </div>
        )
      })}

      {/* Pin tooltip */}
      {hoveredPin && (() => {
        const pin = allBoardPins.find(p => p.id === hoveredPin)
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
        Alt+Drag: Pan · Scroll: Zoom · Click pin/component: Wire · Esc: Cancel · Click comp: Select
      </div>

      {/* Wiring mode indicator */}
      {wiringFrom && (
        <div className="sim-wiring-badge">
          🔌 Wiring from <strong>{wiringFrom}</strong> — click a board pin or component to connect
        </div>
      )}

      {/* Wire SVG — rendered LAST so it paints above board and components */}
      <svg style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 999, overflow: 'visible'
      }}>
        {connections.map(conn => {
          const from = resolveEndpointPos(conn.from)
          const to   = resolveEndpointPos(conn.to)
          if (!from || !to) return null
          const mx = (from.x + to.x) / 2
          const color = conn.color || '#818cf8'
          const isSelected = selectedWire === conn.id
          
          return (
            <g key={conn.id}>
              {/* Thick invisible interaction target for easy clicking and hover */}
              <path
                d={`M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`}
                fill="none"
                stroke="transparent"
                strokeWidth="14"
                strokeLinecap="round"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedComp(null)
                  setSelectedWire(prev => prev === conn.id ? null : conn.id)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  onConnectionsChange(prev => prev.filter(c => c.id !== conn.id))
                  setSelectedWire(null)
                }}
                title="Click to select | Double-click to delete wire"
              />
              {/* Glow layer */}
              <path
                d={`M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`}
                fill="none"
                stroke={isSelected ? '#f59e0b' : color}
                strokeWidth={isSelected ? "8" : "6"}
                strokeOpacity={isSelected ? "0.6" : "0.25"}
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />
              {/* Main wire */}
              <path
                d={`M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`}
                fill="none"
                stroke={isSelected ? '#fbbf24' : color}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />
              {/* Endpoint dots */}
              <circle cx={from.x} cy={from.y} r="4" fill={isSelected ? '#fbbf24' : color} style={{ pointerEvents: 'none' }} />
              <circle cx={to.x} cy={to.y} r="4" fill={isSelected ? '#fbbf24' : color} style={{ pointerEvents: 'none' }} />
            </g>
          )
        })}
        {/* Live dashed preview while routing */}
        {wiringFrom && (() => {
          const from = resolveEndpointPos(wiringFrom)
          if (!from) return null
          const mx = (from.x + mousePos.x) / 2
          return (
            <g>
              <path d={`M${from.x},${from.y} C${mx},${from.y} ${mx},${mousePos.y} ${mousePos.x},${mousePos.y}`}
                fill="none" stroke="#818cf8" strokeWidth="2" strokeDasharray="8 4" strokeLinecap="round" strokeOpacity="0.85" />
              <circle cx={from.x} cy={from.y} r="5" fill="#818cf8" opacity="0.9" />
            </g>
          )
        })()}
      </svg>

      {/* Ghost component — follows cursor during placement */}
      {pendingComponent && (
        <>
          <div
            style={{
              position: 'absolute',
              left: mousePos.x - 20,
              top: mousePos.y - 20,
              pointerEvents: 'none',
              opacity: 0.7,
              transform: `rotate(${ghostRotation}deg)`,
              transformOrigin: 'center center',
              zIndex: 999,
              filter: 'drop-shadow(0 0 8px #6366f1) drop-shadow(0 0 16px #6366f180)',
            }}
          >
            <ComponentIcon comp={pendingComponent} size={36} />
          </div>
          <div className="sim-placement-badge">
            <span style={{ color: '#7986cb' }}>⊕</span>
            Placing <strong>{pendingComponent.label}</strong>
            <span style={{ color: '#546e7a', marginLeft: 8 }}>· Click to drop · R to rotate · Esc to cancel</span>
          </div>
        </>
      )}
    </div>
  )
}
