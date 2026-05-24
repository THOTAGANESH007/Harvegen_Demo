/**
 * Component Pin Definitions
 * Based on actual hardware datasheets and STM32 connection standards.
 * Every pin has: id, label, type, x/y offset (at scale=1 from component origin), color, maxConnections
 *
 * Pin types:
 *   'anode'   — LED positive terminal (connect to GPIO via resistor)
 *   'cathode' — LED negative terminal (connect to GND)
 *   'signal'  — Digital GPIO signal pin
 *   'analog'  — ADC input pin (potentiometer wiper)
 *   'power'   — VCC supply pin
 *   'ground'  — GND pin
 *   'i2c_sda' — I2C data line
 *   'i2c_scl' — I2C clock line
 *   'passive' — Resistor terminal (bidirectional)
 */

export const COMPONENT_PINS = {

  // LED: 2 pins — Anode (+) and Cathode (-)
  // Physical: Longer leg = Anode, Shorter leg = Cathode
  led: {
    minRequired: 2,
    maxTotal: 2,
    pins: [
      {
        id: 'A',
        label: 'Anode (+)',
        description: 'Connect to GPIO pin (via 220Ω resistor)',
        type: 'anode',
        color: '#ef4444',
        // position below LED body, left leg
        offsetX: 3,
        offsetY: 26,
      },
      {
        id: 'K',
        label: 'Cathode (−)',
        description: 'Connect to GND',
        type: 'cathode',
        color: '#60a5fa',
        // position below LED body, right leg
        offsetX: 13,
        offsetY: 26,
      },
    ],
  },

  // Resistor: 2 terminals — bidirectional passive component
  // 220Ω typically placed between GPIO pin and LED anode
  resistor: {
    minRequired: 1,
    maxTotal: 2,
    pins: [
      {
        id: '1',
        label: 'Terminal 1',
        description: 'Connect to GPIO pin or signal source',
        type: 'passive',
        color: '#9ca3af',
        offsetX: 0,
        offsetY: 5,
      },
      {
        id: '2',
        label: 'Terminal 2',
        description: 'Connect to component (LED anode, etc.)',
        type: 'passive',
        color: '#9ca3af',
        offsetX: 40,
        offsetY: 5,
      },
    ],
  },

  // Push Button: 2 functional pins
  // Physically 4-pin DIP but pins 1&3 are shorted and 2&4 are shorted
  // Connection: One side to GPIO (with pull-up), other side to GND
  button: {
    minRequired: 2,
    maxTotal: 2,
    pins: [
      {
        id: 'A',
        label: 'Signal Pin',
        description: 'Connect to GPIO input (enable internal pull-up in code)',
        type: 'signal',
        color: '#f59e0b',
        offsetX: 11,
        offsetY: -2,   // top
      },
      {
        id: 'B',
        label: 'GND',
        description: 'Connect to GND',
        type: 'ground',
        color: '#60a5fa',
        offsetX: 11,
        offsetY: 24,  // bottom
      },
    ],
  },

  // Potentiometer: 3 pins
  // Left pin: VCC, Middle pin: Wiper (analog output), Right pin: GND
  potentiometer: {
    minRequired: 3,
    maxTotal: 3,
    pins: [
      {
        id: 'VCC',
        label: 'VCC (+3.3V)',
        description: 'Connect to 3.3V power rail',
        type: 'power',
        color: '#ef4444',
        offsetX: -3,
        offsetY: 12,  // left side
      },
      {
        id: 'SIG',
        label: 'Wiper (Analog Out)',
        description: 'Connect to STM32 ADC-capable pin (PA0–PA7)',
        type: 'analog',
        color: '#f59e0b',
        offsetX: 12,
        offsetY: 26,  // bottom center
      },
      {
        id: 'GND',
        label: 'GND',
        description: 'Connect to GND',
        type: 'ground',
        color: '#60a5fa',
        offsetX: 27,
        offsetY: 12,  // right side
      },
    ],
  },

  // Buzzer: 2 pins — Positive (+) and Negative (-)
  // Passive buzzer needs PWM signal; Active buzzer needs digital HIGH/LOW
  buzzer: {
    minRequired: 2,
    maxTotal: 2,
    pins: [
      {
        id: '+',
        label: 'Positive (+)',
        description: 'Connect to GPIO pin (PWM for passive buzzer)',
        type: 'signal',
        color: '#ef4444',
        offsetX: 6,
        offsetY: 24,
      },
      {
        id: '-',
        label: 'Negative (−)',
        description: 'Connect to GND',
        type: 'ground',
        color: '#60a5fa',
        offsetX: 16,
        offsetY: 24,
      },
    ],
  },

  // LCD 16x2 with I2C backpack (PCF8574): 4 pins
  // I2C address typically 0x27; SDA → PB7, SCL → PB6 on STM32
  lcd: {
    minRequired: 4,
    maxTotal: 4,
    pins: [
      {
        id: 'VCC',
        label: 'VCC (5V)',
        description: 'Connect to 5V (or 3.3V for 3.3V modules)',
        type: 'power',
        color: '#ef4444',
        offsetX: 8,
        offsetY: 28,
      },
      {
        id: 'GND',
        label: 'GND',
        description: 'Connect to GND',
        type: 'ground',
        color: '#60a5fa',
        offsetX: 24,
        offsetY: 28,
      },
      {
        id: 'SDA',
        label: 'SDA (I2C Data)',
        description: 'Connect to STM32 I2C SDA pin (e.g. PB7)',
        type: 'i2c_sda',
        color: '#a78bfa',
        offsetX: 48,
        offsetY: 28,
      },
      {
        id: 'SCL',
        label: 'SCL (I2C Clock)',
        description: 'Connect to STM32 I2C SCL pin (e.g. PB6)',
        type: 'i2c_scl',
        color: '#818cf8',
        offsetX: 64,
        offsetY: 28,
      },
    ],
  },

  // DHT22: 3 effective pins (Pin 3 = NC, not connected)
  // VCC: 3.3V–5V, DATA: GPIO with 10kΩ pull-up, GND: Ground
  dht22: {
    minRequired: 2,
    maxTotal: 3,
    pins: [
      {
        id: 'VCC',
        label: 'VCC (3.3–5V)',
        description: 'Connect to 3.3V or 5V power',
        type: 'power',
        color: '#ef4444',
        offsetX: 3,
        offsetY: 36,
      },
      {
        id: 'DATA',
        label: 'DATA (1-Wire)',
        description: 'Connect to GPIO pin. Add 10kΩ pull-up to VCC in real hardware.',
        type: 'signal',
        color: '#f59e0b',
        offsetX: 11,
        offsetY: 36,
      },
      {
        id: 'GND',
        label: 'GND',
        description: 'Connect to GND',
        type: 'ground',
        color: '#60a5fa',
        offsetX: 19,
        offsetY: 36,
      },
    ],
  },
}

/** Returns the max connections allowed for a specific component pin endpoint "compId:pinId" */
export function getPinMaxConnections(compType, pinId) {
  const schema = COMPONENT_PINS[compType]
  if (!schema) return 1
  const pin = schema.pins.find(p => p.id === pinId)
  return pin ? 1 : 1  // every physical pin can only have 1 wire
}

/** Parse an endpoint string: returns { compId, pinId } or { boardPin } */
export function parseEndpoint(endpointId) {
  if (endpointId.includes(':')) {
    const idx = endpointId.lastIndexOf(':')
    return { compId: endpointId.slice(0, idx), pinId: endpointId.slice(idx + 1) }
  }
  return { boardPin: endpointId }
}

/** Check if a board pin is GND or power rail (allow multiple connections) */
export function isRailPin(pinId) {
  return pinId === 'GND' || pinId === '3V3'
}
