/**
 * STM32 C Code Execution Engine
 * Parses user-written C code and simulates STM32 HAL behavior.
 * Extracts GPIO operations, delays, printf/UART output, and drives the circuit.
 */

// ─── GPIO State ─────────────────────────────────────────────────────────────
export function createGPIOState() {
  const ports = { A: {}, B: {}, C: {} }
  for (const port of ['A', 'B', 'C']) {
    for (let i = 0; i <= 15; i++) ports[port][i] = 0
  }
  return ports
}

// ─── Parse GPIO pin number from GPIO_PIN_x ──────────────────────────────────
function parsePinNumber(pinStr) {
  const m = pinStr.match(/GPIO_PIN_(\d+)/)
  return m ? parseInt(m[1]) : -1
}

// ─── Parse port letter from GPIOx ───────────────────────────────────────────
function parsePort(portStr) {
  const m = portStr.match(/GPIO([ABC])/)
  return m ? m[1] : null
}

// ─── Parse delay value from HAL_Delay(x) ────────────────────────────────────
function parseDelay(delayStr) {
  const m = delayStr.match(/HAL_Delay\s*\(\s*(\d+)\s*\)/)
  return m ? parseInt(m[1]) : 0
}

// ─── Parse printf / sprintf strings ─────────────────────────────────────────
function parsePrintf(line) {
  const m = line.match(/printf\s*\(\s*"([^"]+)"/)
  if (m) return m[1].replace(/\\n/g, '\n').replace(/\\r/g, '').trim()
  return null
}

// ─── Parse HAL_UART_Transmit strings ────────────────────────────────────────
function parseUART(line) {
  const m = line.match(/HAL_UART_Transmit\s*\([^,]+,\s*\(uint8_t\s*\*\)\s*"([^"]+)"/)
  if (m) return m[1].replace(/\\n/g, '\n').replace(/\\r/g, '').trim()
  return null
}

// ─── Detect compilation errors in user code ─────────────────────────────────
export function detectErrors(code) {
  const errors = []
  const lines = code.split('\n')

  lines.forEach((line, i) => {
    const ln = i + 1
    const trimmed = line.trim()
    // Skip comments and preprocessor
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed.startsWith('/*')) return

    // Missing semicolons (basic)
    if (
      trimmed.length > 0 &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith('(') &&
      !trimmed.endsWith(')') &&
      /^(HAL_|GPIO_|__HAL_|RCC_)/.test(trimmed)
    ) {
      errors.push({ line: ln, msg: `Possible missing semicolon`, severity: 'warning' })
    }
  })

  // Check for main function
  if (!code.includes('int main')) {
    errors.push({ line: 0, msg: 'No main() function found', severity: 'error' })
  }

  // Check for while(1) or infinite loop
  if (!code.includes('while') && !code.includes('for(;;')) {
    errors.push({ line: 0, msg: 'No infinite loop detected — MCU may halt immediately', severity: 'warning' })
  }

  return errors
}

// ─── Main: Parse C code into an array of simulation steps ────────────────────
export function parseCode(code) {
  const steps = []
  const lines = code.split('\n')
  let inMain = false
  let inWhile = false
  let braceDepth = 0
  let mainBraceStart = -1

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()

    // Detect main() entry
    if (/int\s+main\s*\(/.test(line)) {
      inMain = true
      mainBraceStart = braceDepth
    }

    if (inMain) {
      braceDepth += (line.match(/\{/g) || []).length
      braceDepth -= (line.match(/\}/g) || []).length
    }

    if (!inMain) continue

    // Detect while(1) / for(;;)
    if (/while\s*\(\s*1\s*\)|for\s*\(\s*;/.test(line)) {
      inWhile = true
    }

    // HAL_GPIO_WritePin
    const writeMatch = line.match(/HAL_GPIO_WritePin\s*\(\s*(GPIO[ABC])\s*,\s*(GPIO_PIN_\d+)\s*,\s*(GPIO_PIN_SET|GPIO_PIN_RESET)\s*\)/)
    if (writeMatch) {
      steps.push({
        type: 'gpio_write',
        port: parsePort(writeMatch[1]),
        pin: parsePinNumber(writeMatch[2]),
        value: writeMatch[3] === 'GPIO_PIN_SET' ? 1 : 0,
        loop: inWhile,
        raw: line,
      })
    }

    // HAL_GPIO_TogglePin
    const toggleMatch = line.match(/HAL_GPIO_TogglePin\s*\(\s*(GPIO[ABC])\s*,\s*(GPIO_PIN_\d+)\s*\)/)
    if (toggleMatch) {
      steps.push({
        type: 'gpio_toggle',
        port: parsePort(toggleMatch[1]),
        pin: parsePinNumber(toggleMatch[2]),
        loop: inWhile,
        raw: line,
      })
    }

    // HAL_Delay
    const delayMatch = line.match(/HAL_Delay\s*\(\s*(\d+)\s*\)/)
    if (delayMatch) {
      steps.push({
        type: 'delay',
        ms: parseInt(delayMatch[1]),
        loop: inWhile,
        raw: line,
      })
    }

    // printf
    const printfMsg = parsePrintf(line)
    if (printfMsg) {
      steps.push({ type: 'serial_out', msg: printfMsg, loop: inWhile, raw: line })
    }

    // HAL_UART_Transmit
    const uartMsg = parseUART(line)
    if (uartMsg) {
      steps.push({ type: 'serial_out', msg: uartMsg, loop: inWhile, raw: line })
    }

    // HAL_Init
    if (/HAL_Init\s*\(\s*\)/.test(line)) {
      steps.push({ type: 'hal_init', raw: line })
    }

    // SystemClock_Config
    if (/SystemClock_Config\s*\(\s*\)/.test(line)) {
      steps.push({ type: 'sysclock', raw: line })
    }
  }

  return steps
}

// ─── Execution Runner ────────────────────────────────────────────────────────
// Returns an async generator that yields simulation events
export async function* runSimulation(code, signal) {
  const errors = detectErrors(code)
  const criticalErrors = errors.filter(e => e.severity === 'error')

  yield { type: 'boot', msg: '⚡ STM32 Simulator v1.0 — Harvegen', time: Date.now() }
  await sleep(150)
  yield { type: 'boot', msg: `🎯 Target: STM32F103C8T6 | ARM Cortex-M3 | 72MHz`, time: Date.now() }
  await sleep(150)

  if (criticalErrors.length > 0) {
    for (const err of criticalErrors) {
      yield { type: 'error', msg: `❌ Error${err.line ? ` (line ${err.line})` : ''}: ${err.msg}`, time: Date.now() }
    }
    yield { type: 'error', msg: '⛔ Compilation failed — fix errors and retry.', time: Date.now() }
    return
  }

  if (errors.length > 0) {
    for (const w of errors) {
      yield { type: 'warning', msg: `⚠ Warning (line ${w.line}): ${w.msg}`, time: Date.now() }
    }
  }

  yield { type: 'boot', msg: '✅ Parsing firmware...', time: Date.now() }
  await sleep(200)

  const steps = parseCode(code)

  if (steps.length === 0) {
    yield { type: 'warning', msg: '⚠ No recognizable HAL operations found. Writing printf/HAL_GPIO_WritePin/HAL_Delay is needed.', time: Date.now() }
  }

  yield { type: 'boot', msg: `📦 ${steps.length} operation(s) extracted`, time: Date.now() }
  await sleep(200)
  yield { type: 'boot', msg: '🚀 HAL_Init() ... OK', time: Date.now() }
  await sleep(150)
  yield { type: 'boot', msg: '🕐 SystemClock_Config() ... 72MHz PLL configured', time: Date.now() }
  await sleep(150)
  yield { type: 'boot', msg: '📌 GPIO Init complete', time: Date.now() }
  await sleep(200)
  yield { type: 'separator', msg: '──── Entering main loop ────', time: Date.now() }
  await sleep(100)

  // GPIO state tracker
  const gpio = createGPIOState()

  // Separate init steps (before loop) and loop steps
  const initSteps = steps.filter(s => !s.loop)
  const loopSteps = steps.filter(s => s.loop)

  // Run init steps once
  for (const step of initSteps) {
    if (signal?.aborted) return
    yield* executeStep(step, gpio)
  }

  if (loopSteps.length === 0) {
    yield { type: 'system', msg: 'ℹ Program complete (no infinite loop)', time: Date.now() }
    return
  }

  // Run loop steps indefinitely
  while (true) {
    for (const step of loopSteps) {
      if (signal?.aborted) return
      yield* executeStep(step, gpio)
      // Yield control after each step so UI can react
      await sleep(0)
    }
  }
}

function* executeStep(step, gpio) {
  switch (step.type) {
    case 'gpio_write': {
      gpio[step.port][step.pin] = step.value
      const state = step.value === 1 ? 'HIGH' : 'LOW'
      const ledNote = (step.port === 'C' && step.pin === 13)
        ? step.value === 0 ? ' 🔴 LED ON' : ' ⚫ LED OFF'
        : ''
      yield {
        type: 'gpio',
        msg: `GPIO_Write: P${step.port}${step.pin} = ${state}${ledNote}`,
        port: step.port,
        pin: step.pin,
        value: step.value,
        time: Date.now(),
      }
      break
    }
    case 'gpio_toggle': {
      const cur = gpio[step.port][step.pin]
      const next = cur === 1 ? 0 : 1
      gpio[step.port][step.pin] = next
      const state = next === 1 ? 'HIGH' : 'LOW'
      const ledNote = (step.port === 'C' && step.pin === 13)
        ? next === 0 ? ' 🔴 LED ON' : ' ⚫ LED OFF'
        : ''
      yield {
        type: 'gpio',
        msg: `GPIO_Toggle: P${step.port}${step.pin} → ${state}${ledNote}`,
        port: step.port,
        pin: step.pin,
        value: next,
        time: Date.now(),
      }
      break
    }
    case 'delay':
      yield { type: 'delay', msg: `HAL_Delay(${step.ms}ms) ...`, ms: step.ms, time: Date.now() }
      break
    case 'serial_out':
      yield { type: 'serial', msg: step.msg, time: Date.now() }
      break
    default:
      break
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
