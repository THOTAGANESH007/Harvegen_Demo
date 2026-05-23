'use client'

import { useState } from 'react'

const LIBS = [
  { id: 'freertos', name: 'FreeRTOS Kernel', desc: 'Real-time operating system kernel for embedded systems.', version: 'v10.4.3' },
  { id: 'lcd_i2c', name: 'LiquidCrystal I2C', desc: 'HAL implementation for driving 16x2 / 20x4 LCD displays over I2C.', version: 'v1.1.2' },
  { id: 'dht', name: 'DHT Sensor Library', desc: 'Driver for DHT11 and DHT22 Temperature & Humidity sensors.', version: 'v1.4.2' },
  { id: 'adafruit_sensor', name: 'Adafruit Unified Sensor', desc: 'Common sensor abstraction layer for unified sensor drivers.', version: 'v1.1.4' },
  { id: 'usb_device', name: 'STM32 USB Device Library', desc: 'Official ST microcontrollers USB device middleware stack.', version: 'v2.8.0' },
  { id: 'fatfs', name: 'FatFs Middleware', desc: 'Generic FAT/exFAT file system module for small embedded systems.', version: 'R0.14b' },
  { id: 'cmsis_dsp', name: 'CMSIS DSP Library', desc: 'ARM optimized digital signal processing routines.', version: 'v1.8.0' },
]

export default function LibraryPalette({ onAdd, onClose, existing = [] }) {
  const [search, setSearch] = useState('')

  const filtered = LIBS.filter(lib =>
    lib.name.toLowerCase().includes(search.toLowerCase()) ||
    lib.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="sim-palette-overlay" onClick={onClose}>
      <div className="sim-palette" onClick={e => e.stopPropagation()}>
        <div className="sim-palette-header">
          <h3 className="sim-palette-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7986cb" strokeWidth="2.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Library Manager
          </h3>
          <button className="sim-palette-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <input
          type="text"
          className="sim-palette-search"
          placeholder="Search libraries (e.g. RTOS, sensor, LCD)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <div className="sim-palette-body">
          <div className="sim-palette-category">
            <div className="sim-palette-cat-title">AVAILABLE LIBRARIES</div>
            <div className="sim-palette-items" style={{ gridTemplateColumns: '1fr' }}>
              {filtered.map(lib => {
                const isAdded = existing.includes(lib.name)
                return (
                  <div
                    key={lib.id}
                    className="sim-palette-item"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: isAdded ? 0.6 : 1,
                      cursor: isAdded ? 'default' : 'pointer'
                    }}
                    onClick={() => { if (!isAdded) onAdd(lib.name) }}
                  >
                    <div className="sim-palette-item-info">
                      <span className="sim-palette-item-name">{lib.name} <span style={{ color: '#546e7a', fontWeight: 'normal', fontSize: '10px' }}>({lib.version})</span></span>
                      <span className="sim-palette-item-desc" style={{ fontSize: '11px', marginTop: '2px' }}>{lib.desc}</span>
                    </div>
                    <div>
                      {isAdded ? (
                        <span style={{ fontSize: '11px', color: '#69f0ae', fontWeight: 'bold' }}>✓ Installed</span>
                      ) : (
                        <button className="sim-add-comp-btn" style={{ padding: '4px 12px' }}>Install</button>
                      )}
                    </div>
                  </div>
                )
              })}
              {filtered.length === 0 && (
                <div style={{ color: '#546e7a', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                  No matching libraries found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
