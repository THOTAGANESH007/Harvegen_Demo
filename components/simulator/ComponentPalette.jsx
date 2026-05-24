'use client'

import { useState, useEffect, useRef } from 'react'

const COMPONENTS = [
  // Outputs
  { type: 'led', label: 'Red LED',         color: '#ef4444', category: 'Outputs',  icon: 'led',          description: 'Red Light Emitting Diode' },
  { type: 'led', label: 'Green LED',       color: '#10b981', category: 'Outputs',  icon: 'led',          description: 'Green Light Emitting Diode' },
  { type: 'led', label: 'Blue LED',        color: '#3b82f6', category: 'Outputs',  icon: 'led',          description: 'Blue Light Emitting Diode' },
  { type: 'led', label: 'Yellow LED',      color: '#f59e0b', category: 'Outputs',  icon: 'led',          description: 'Yellow Light Emitting Diode' },
  { type: 'led', label: 'White LED',       color: '#e2e8f0', category: 'Outputs',  icon: 'led',          description: 'White LED' },
  { type: 'buzzer', label: 'Buzzer',                         category: 'Outputs',  icon: 'buzzer',       description: 'Passive piezo buzzer' },
  { type: 'lcd',    label: 'LCD 16×2',                       category: 'Outputs',  icon: 'lcd',          description: '16×2 character LCD display' },

  // Inputs
  { type: 'button',       label: 'Push Button',              category: 'Inputs',   icon: 'button',       description: 'Momentary tactile push button' },
  { type: 'potentiometer',label: 'Potentiometer',            category: 'Inputs',   icon: 'pot',          description: '10kΩ rotary potentiometer' },
  { type: 'dht22',        label: 'DHT22',                    category: 'Sensors',  icon: 'dht22',        description: 'Temp & Humidity sensor' },

  // Passives
  { type: 'resistor', label: '220Ω',   value: '220',         category: 'Passives', icon: 'resistor',     description: 'Current-limiting resistor' },
  { type: 'resistor', label: '1kΩ',    value: '1k',          category: 'Passives', icon: 'resistor',     description: '1kΩ general resistor' },
  { type: 'resistor', label: '10kΩ',   value: '10k',         category: 'Passives', icon: 'resistor',     description: 'Pull-up/down resistor' },
]

function ComponentIcon({ comp, size = 36 }) {
  const s = size
  if (comp.icon === 'led') return (
    <svg width={s * 0.7} height={s} viewBox="0 0 14 22">
      <path d="M2 0 h10 a0 0 0 0 1 12 6 L7 20 L2 6 a0 0 0 0 1 0 -6z" fill="none"/>
      <ellipse cx="7" cy="3" rx="5" ry="5" fill={comp.color || '#ef4444'} opacity="0.9"/>
      <path d="M7 8 L2 20 L12 20 Z" fill={comp.color || '#ef4444'} opacity="0.85"/>
      <line x1="5" y1="20" x2="5" y2="22" stroke="#94a3b8" strokeWidth="1.5"/>
      <line x1="9" y1="20" x2="9" y2="22" stroke="#94a3b8" strokeWidth="1.5"/>
      <ellipse cx="7" cy="4" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.3)"/>
    </svg>
  )
  if (comp.icon === 'resistor') return (
    <svg width={s * 1.4} height={s * 0.5} viewBox="0 0 40 14">
      <line x1="0" y1="7" x2="6" y2="7" stroke="#9ca3af" strokeWidth="1.5"/>
      <rect x="6" y="2" width="28" height="10" rx="2" fill="#c8a862"/>
      <line x1="10" y1="2" x2="10" y2="12" stroke="#8b4513" strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="12" stroke="#111" strokeWidth="2"/>
      <line x1="22" y1="2" x2="22" y2="12" stroke="#f97316" strokeWidth="2"/>
      <line x1="28" y1="2" x2="28" y2="12" stroke="#c0c0c0" strokeWidth="2"/>
      <line x1="34" y1="7" x2="40" y2="7" stroke="#9ca3af" strokeWidth="1.5"/>
    </svg>
  )
  if (comp.icon === 'button') return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#1f2937" stroke="#6b7280" strokeWidth="1.5"/>
      <rect x="7" y="7" width="10" height="10" rx="2" fill="#374151"/>
      <line x1="5" y1="0" x2="5" y2="2" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="19" y1="0" x2="19" y2="2" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="5" y1="22" x2="5" y2="24" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="19" y1="22" x2="19" y2="24" stroke="#9ca3af" strokeWidth="1.5"/>
    </svg>
  )
  if (comp.icon === 'pot') return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#374151" stroke="#6b7280" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#6366f1"/>
      <line x1="12" y1="7" x2="12" y2="4" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"/>
      <line x1="5" y1="22" x2="9" y2="20" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="12" y1="22" x2="12" y2="24" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="19" y1="22" x2="15" y2="20" stroke="#9ca3af" strokeWidth="1.5"/>
    </svg>
  )
  if (comp.icon === 'lcd') return (
    <svg width={s * 2} height={s * 0.7} viewBox="0 0 72 26">
      <rect x="0" y="0" width="72" height="26" rx="2" fill="#0d1b0d" stroke="#2d5a2d" strokeWidth="1"/>
      <rect x="5" y="4" width="62" height="18" rx="1" fill="#0a150a"/>
      <text x="8" y="15" fontSize="7" fill="#1a3a1a" fontFamily="monospace">LCD 16×2</text>
    </svg>
  )
  if (comp.icon === 'buzzer') return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#1f2937" stroke="#6b7280" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#111827"/>
      <circle cx="12" cy="12" r="2" fill="#374151"/>
      <line x1="9" y1="24" x2="9" y2="22" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="15" y1="24" x2="15" y2="22" stroke="#9ca3af" strokeWidth="1.5"/>
    </svg>
  )
  if (comp.icon === 'dht22') return (
    <svg width={s * 0.75} height={s * 1.2} viewBox="0 0 18 28">
      <rect x="0" y="0" width="18" height="24" rx="2" fill="#1a2744" stroke="#2d4a7a" strokeWidth="1"/>
      <text x="9" y="12" fontSize="5" fill="#60a5fa" textAnchor="middle" fontFamily="monospace" fontWeight="bold">DHT</text>
      <text x="9" y="19" fontSize="4" fill="#60a5fa" textAnchor="middle" fontFamily="monospace">22</text>
      <line x1="4" y1="24" x2="4" y2="28" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="9" y1="24" x2="9" y2="28" stroke="#9ca3af" strokeWidth="1.5"/>
      <line x1="14" y1="24" x2="14" y2="28" stroke="#9ca3af" strokeWidth="1.5"/>
    </svg>
  )
  return <svg width={s} height={s} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#374151" stroke="#6b7280" strokeWidth="1.5"/></svg>
}

const CATEGORIES = ['Outputs', 'Inputs', 'Sensors', 'Passives']

export default function ComponentPalette({ onPick, onClose }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const searchRef = useRef(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  const filtered = COMPONENTS.filter(c => {
    const matchSearch = !search ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    return matchSearch && matchCat
  })

  const grouped = {}
  filtered.forEach(c => {
    if (!grouped[c.category]) grouped[c.category] = []
    grouped[c.category].push(c)
  })

  return (
    <div className="wk-palette-backdrop" onClick={onClose}>
      <div className="wk-palette" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wk-palette-hdr">
          <div className="wk-palette-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7986cb" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Component
          </div>
          <button className="wk-palette-x" onClick={onClose} title="Close (Esc)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="wk-palette-search-wrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#546e7a" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={searchRef}
            className="wk-palette-search"
            placeholder="Search parts... (e.g. LED, button, sensor)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onClose() }}
          />
          {search && (
            <button className="wk-palette-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>

        {/* Category pills */}
        <div className="wk-palette-cats">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              className={`wk-palette-cat ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>

        {/* Component list */}
        <div className="wk-palette-list">
          {Object.keys(grouped).length === 0 && (
            <div className="wk-palette-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#263238" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              No parts found for "{search}"
            </div>
          )}
          {(activeCategory === 'All' ? CATEGORIES : [activeCategory]).map(cat => {
            const items = grouped[cat]
            if (!items?.length) return null
            return (
              <div key={cat}>
                <div className="wk-palette-group-label">{cat}</div>
                {items.map((comp, i) => (
                  <button
                    key={`${comp.type}-${i}`}
                    className="wk-palette-row"
                    onClick={() => { onPick(comp); onClose() }}
                    title={`${comp.label} — ${comp.description}\nClick to place on canvas`}
                  >
                    <div className="wk-palette-row-icon">
                      <ComponentIcon comp={comp} size={28} />
                    </div>
                    <div className="wk-palette-row-info">
                      <span className="wk-palette-row-name">{comp.label}</span>
                      <span className="wk-palette-row-desc">{comp.description}</span>
                    </div>
                    <svg className="wk-palette-row-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )
          })}
        </div>

        <div className="wk-palette-hint">
          Click a part → it follows your cursor → click canvas to place
        </div>
      </div>
    </div>
  )
}

// Named export for use in canvas ghost rendering
export { ComponentIcon, COMPONENTS }
