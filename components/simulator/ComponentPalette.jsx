'use client'

const COMPONENT_CATEGORIES = [
  {
    name: 'Outputs',
    icon: '💡',
    items: [
      { type: 'led', label: 'LED (Red)', color: '#ef4444', width: 20, height: 30, description: 'Light Emitting Diode' },
      { type: 'led', label: 'LED (Green)', color: '#10b981', width: 20, height: 30, description: 'Green LED' },
      { type: 'led', label: 'LED (Blue)', color: '#3b82f6', width: 20, height: 30, description: 'Blue LED' },
      { type: 'led', label: 'LED (Yellow)', color: '#f59e0b', width: 20, height: 30, description: 'Yellow LED' },
      { type: 'lcd', label: 'LCD 16x2', width: 80, height: 30, description: 'Character LCD Display' },
      { type: 'buzzer', label: 'Buzzer', width: 30, height: 30, description: 'Passive Buzzer' },
    ]
  },
  {
    name: 'Inputs',
    icon: '🎛️',
    items: [
      { type: 'button', label: 'Push Button', width: 20, height: 20, description: 'Momentary push button' },
      { type: 'potentiometer', label: 'Potentiometer', width: 30, height: 30, description: '10kΩ Potentiometer' },
    ]
  },
  {
    name: 'Passives',
    icon: '⚡',
    items: [
      { type: 'resistor', label: '220Ω', value: '220Ω', width: 40, height: 14, description: 'Current limiting resistor' },
      { type: 'resistor', label: '1kΩ', value: '1kΩ', width: 40, height: 14, description: '1k Ohm resistor' },
      { type: 'resistor', label: '10kΩ', value: '10kΩ', width: 40, height: 14, description: 'Pull-up resistor' },
    ]
  },
  {
    name: 'Sensors',
    icon: '📡',
    items: [
      { type: 'dht22', label: 'DHT22', width: 30, height: 40, description: 'Temperature & Humidity Sensor' },
    ]
  },
]

export default function ComponentPalette({ onAdd, onClose }) {
  return (
    <div className="sim-palette-overlay" onClick={onClose}>
      <div className="sim-palette" onClick={e => e.stopPropagation()}>
        <div className="sim-palette-header">
          <div className="sim-palette-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Add Component
          </div>
          <button className="sim-palette-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <input className="sim-palette-search" placeholder="Search components..." autoFocus />

        <div className="sim-palette-body">
          {COMPONENT_CATEGORIES.map(cat => (
            <div key={cat.name} className="sim-palette-category">
              <div className="sim-palette-cat-title">
                <span>{cat.icon}</span>
                {cat.name}
              </div>
              <div className="sim-palette-items">
                {cat.items.map((item, idx) => (
                  <button
                    key={`${item.type}-${idx}`}
                    className="sim-palette-item"
                    onClick={() => onAdd(item)}
                    title={item.description}
                  >
                    <ComponentPreview item={item} />
                    <div className="sim-palette-item-info">
                      <span className="sim-palette-item-name">{item.label}</span>
                      <span className="sim-palette-item-desc">{item.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ComponentPreview({ item }) {
  if (item.type === 'led') return (
    <div className="sim-preview-led" style={{
      width: 16, height: 22,
      background: item.color || '#ef4444',
      borderRadius: '50% 50% 0 0',
      boxShadow: `0 0 6px 2px ${item.color}40`,
      border: `1px solid ${item.color}`,
    }} />
  )
  if (item.type === 'resistor') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <div style={{ width: 4, height: 2, background: '#9ca3af' }} />
      <div style={{ width: 24, height: 8, background: '#c8a862', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <div style={{ width: 2, height: '100%', background: '#8b4513' }} />
        <div style={{ width: 2, height: '100%', background: '#000' }} />
        <div style={{ width: 2, height: '100%', background: '#f97316' }} />
        <div style={{ width: 2, height: '100%', background: '#c0c0c0' }} />
      </div>
      <div style={{ width: 4, height: 2, background: '#9ca3af' }} />
    </div>
  )
  if (item.type === 'button') return (
    <div style={{ width: 20, height: 20, border: '2px solid #6b7280', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 10, height: 10, background: '#374151', borderRadius: 2 }} />
    </div>
  )
  if (item.type === 'lcd') return (
    <div style={{ width: 36, height: 18, background: '#1a3a1a', border: '1px solid #2d6a2d', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 10, background: '#0f2d0f', borderRadius: 1 }} />
    </div>
  )
  if (item.type === 'dht22') return (
    <div style={{ width: 18, height: 28, background: '#1a2744', border: '1px solid #2d4a7a', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 7, color: '#60a5fa', textAlign: 'center', lineHeight: 1.2 }}>DHT</span>
    </div>
  )
  if (item.type === 'buzzer') return (
    <div style={{ width: 20, height: 20, background: '#374151', border: '1px solid #6b7280', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 8, height: 8, background: '#1f2937', borderRadius: '50%' }} />
    </div>
  )
  if (item.type === 'potentiometer') return (
    <div style={{ width: 20, height: 20, background: '#374151', border: '1px solid #6b7280', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 12, height: 12, background: '#6366f1', borderRadius: '50%' }} />
    </div>
  )
  return <div style={{ width: 24, height: 24, background: '#374151', borderRadius: 4 }} />
}
