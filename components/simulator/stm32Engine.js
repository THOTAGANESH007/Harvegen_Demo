/**
 * STM32 C Code Execution Engine v2
 * - Strict multi-pass C syntax validator
 * - HAL function signature checker
 * - GPIO/UART/Delay execution engine
 */

// ─── GPIO State ───────────────────────────────────────────────────────────────
export function createGPIOState() {
  const ports = { A: {}, B: {}, C: {} }
  for (const p of ['A','B','C']) for (let i = 0; i <= 15; i++) ports[p][i] = 1 // default HIGH
  return ports
}

// ─── Strip comments from code (preserving line numbers) ──────────────────────
function stripComments(code) {
  let out = ''
  let i = 0
  const n = code.length
  while (i < n) {
    // Block comment
    if (code[i] === '/' && code[i+1] === '*') {
      i += 2
      while (i < n && !(code[i] === '*' && code[i+1] === '/')) {
        out += code[i] === '\n' ? '\n' : ' '
        i++
      }
      i += 2
    // Line comment
    } else if (code[i] === '/' && code[i+1] === '/') {
      while (i < n && code[i] !== '\n') { out += ' '; i++ }
    // String literal — keep as placeholder
    } else if (code[i] === '"') {
      out += '"'
      i++
      while (i < n && !(code[i] === '"' && code[i-1] !== '\\')) { out += 'x'; i++ }
      out += '"'
      i++
    } else {
      out += code[i++]
    }
  }
  return out
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STRICT VALIDATOR — multi-pass
// ═══════════════════════════════════════════════════════════════════════════════
export function detectErrors(code) {
  const errors = []
  const stripped = stripComments(code)
  const rawLines = code.split('\n')
  const lines = stripped.split('\n')

  // ── Pass 1: Balanced braces / parentheses / brackets ─────────────────────
  let braces = 0, parens = 0, brackets = 0
  let braceOpenLine = [], parenOpenLine = [], bracketOpenLine = []

  lines.forEach((line, idx) => {
    const ln = idx + 1
    for (const ch of line) {
      if (ch === '{') { braces++; braceOpenLine.push(ln) }
      else if (ch === '}') { braces--; braceOpenLine.pop(); if (braces < 0) { errors.push({ line: ln, msg: 'Unexpected closing brace `}`', severity: 'error' }); braces = 0 } }
      else if (ch === '(') { parens++; parenOpenLine.push(ln) }
      else if (ch === ')') { parens--; parenOpenLine.pop(); if (parens < 0) { errors.push({ line: ln, msg: 'Unexpected closing parenthesis `)`', severity: 'error' }); parens = 0 } }
      else if (ch === '[') { brackets++; bracketOpenLine.push(ln) }
      else if (ch === ']') { brackets--; bracketOpenLine.pop(); if (brackets < 0) { errors.push({ line: ln, msg: 'Unexpected closing bracket `]`', severity: 'error' }); brackets = 0 } }
    }
  })
  if (braces > 0) errors.push({ line: braceOpenLine[0] || 0, msg: `Unclosed \`{\` — ${braces} brace(s) never closed`, severity: 'error' })
  if (parens > 0) errors.push({ line: parenOpenLine[0] || 0, msg: `Unclosed \`(\` — ${parens} parenthesis(es) never closed`, severity: 'error' })
  if (brackets > 0) errors.push({ line: bracketOpenLine[0] || 0, msg: `Unclosed \`[\` — ${brackets} bracket(s) never closed`, severity: 'error' })

  // ── Pass 2: Struct/function body completeness ─────────────────────────────
  if (!code.includes('int main')) {
    errors.push({ line: 0, msg: '`int main()` function is missing', severity: 'error' })
  }

  // ── Pass 3: Required includes ─────────────────────────────────────────────
  const usesHAL = /HAL_/.test(code)
  const usesStdio = /printf\s*\(/.test(code)
  if (usesHAL && !code.includes('stm32f1xx_hal.h') && !code.includes('stm32f4xx_hal.h')) {
    errors.push({ line: 1, msg: 'HAL functions used but `#include "stm32f1xx_hal.h"` is missing', severity: 'error' })
  }
  if (usesStdio && !code.includes('<stdio.h>') && !code.includes('stdio.h')) {
    errors.push({ line: 1, msg: '`printf()` used but `#include <stdio.h>` is missing', severity: 'warning' })
  }

  // ── Pass 4: Per-line statement analysis ──────────────────────────────────
  const STATEMENT_PATTERN = /^(HAL_[A-Za-z_]+|GPIO_[A-Za-z_]+|__HAL_[A-Za-z_]+|RCC_[A-Za-z_]+)\s*\(/
  const ENDS_OK = /[;{},]$|^\s*$/

  // HAL function signatures
  const HAL_SIGS = {
    'HAL_GPIO_WritePin': { args: 3, desc: 'HAL_GPIO_WritePin(GPIOx, GPIO_PIN_x, PinState)' },
    'HAL_GPIO_ReadPin':  { args: 2, desc: 'HAL_GPIO_ReadPin(GPIOx, GPIO_PIN_x)' },
    'HAL_GPIO_TogglePin':{ args: 2, desc: 'HAL_GPIO_TogglePin(GPIOx, GPIO_PIN_x)' },
    'HAL_Delay':         { args: 1, desc: 'HAL_Delay(ms)' },
    'HAL_Init':          { args: 0, desc: 'HAL_Init()' },
    'HAL_UART_Transmit': { args: 4, desc: 'HAL_UART_Transmit(&huart, data, size, timeout)' },
    'HAL_RCC_OscConfig': { args: 1, desc: 'HAL_RCC_OscConfig(&RCC_OscInitStruct)' },
    'HAL_RCC_ClockConfig':{ args: 2, desc: 'HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY)' },
    'HAL_GPIO_Init':     { args: 2, desc: 'HAL_GPIO_Init(GPIOx, &GPIO_InitStruct)' },
  }

  // Count commas at depth 1 to estimate arg count
  function countArgs(callStr) {
    const startIdx = callStr.indexOf('(')
    if (startIdx === -1) return 0
    let depth = 0
    let endIdx = -1
    for (let i = startIdx; i < callStr.length; i++) {
      if (callStr[i] === '(') depth++
      else if (callStr[i] === ')') {
        depth--
        if (depth === 0) { endIdx = i; break }
      }
    }
    if (endIdx === -1) return 0
    const inside = callStr.substring(startIdx + 1, endIdx).trim()
    if (!inside) return 0
    let commas = 0
    let curDepth = 0
    for (const ch of inside) {
      if (ch === '(' || ch === '[' || ch === '{') curDepth++
      else if (ch === ')' || ch === ']' || ch === '}') curDepth--
      else if (ch === ',' && curDepth === 0) commas++
    }
    return commas + 1
  }

  lines.forEach((stripped_line, idx) => {
    const ln = idx + 1
    const raw = rawLines[idx] || ''
    const trimRaw = raw.trim()
    const trimmed = stripped_line.trim()

    // Skip blank, preprocessor, open/close braces
    if (!trimmed || trimmed.startsWith('#')) return

    // Skip lines that are just closing braces or function declarations
    if (/^[{}]/.test(trimmed) || /\)\s*$/.test(trimmed) || /\)\s*\{/.test(trimmed)) return

    // Check missing semicolon on statement lines
    const isStatement = STATEMENT_PATTERN.test(trimmed) ||
      /^[a-zA-Z_]\w*\s*=/.test(trimmed) ||        // assignment
      /^return\s/.test(trimmed)                     // return

    if (isStatement && !ENDS_OK.test(trimmed) && !trimmed.endsWith('\\')) {
      errors.push({ line: ln, msg: `Missing semicolon: \`${trimRaw.substring(0, 60)}\``, severity: 'error' })
    }

    // HAL signature validation
    for (const [fnName, sig] of Object.entries(HAL_SIGS)) {
      const fnRegex = new RegExp(`\\b${fnName}\\s*\\(`)
      if (fnRegex.test(trimmed)) {
        const callStart = trimmed.indexOf(fnName)
        const callStr = trimmed.substring(callStart)
        const actual = countArgs(callStr)
        if (actual !== sig.args && actual > 0) {
          errors.push({
            line: ln,
            msg: `Wrong argument count for \`${fnName}\` — expected ${sig.args}, got ${actual}. Usage: ${sig.desc}`,
            severity: 'error'
          })
        }
      }
    }

    // GPIO_PIN_x validation
    const gpioPortMatch = trimmed.match(/\bGPIO([ABC])\b/g)
    if (gpioPortMatch) {
      const pinMatch = trimmed.match(/\bGPIO_PIN_(\d+)\b/)
      if (pinMatch) {
        const pinNum = parseInt(pinMatch[1])
        if (pinNum > 15) {
          errors.push({ line: ln, msg: `Invalid pin: GPIO_PIN_${pinNum} — valid range is GPIO_PIN_0 to GPIO_PIN_15`, severity: 'error' })
        }
      }
    }

    // GPIO_PIN_SET / GPIO_PIN_RESET usage check
    if (/HAL_GPIO_WritePin/.test(trimmed)) {
      if (!/GPIO_PIN_SET|GPIO_PIN_RESET/.test(trimmed)) {
        errors.push({ line: ln, msg: `HAL_GPIO_WritePin 3rd arg must be GPIO_PIN_SET or GPIO_PIN_RESET`, severity: 'error' })
      }
      if (!/GPIO[ABC]/.test(trimmed)) {
        errors.push({ line: ln, msg: `HAL_GPIO_WritePin 1st arg must be GPIOA, GPIOB, or GPIOC`, severity: 'error' })
      }
    }

    // HAL_Delay arg must be numeric
    const delayMatch = trimmed.match(/HAL_Delay\s*\(\s*([^)]+)\s*\)/)
    if (delayMatch) {
      const arg = delayMatch[1].trim()
      if (!/^\d+$/.test(arg)) {
        errors.push({ line: ln, msg: `HAL_Delay argument should be a numeric literal (ms), got: \`${arg}\``, severity: 'warning' })
      }
    }
  })

  // ── Pass 5: Infinite loop check ───────────────────────────────────────────
  if (!/while\s*\(\s*1\s*\)|while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;/.test(code)) {
    errors.push({ line: 0, msg: 'No infinite loop `while(1)` found — MCU will halt after main() returns', severity: 'warning' })
  }

  // ── Pass 6: Undefined GPIO Port usage ─────────────────────────────────────
  const usedPorts = new Set((code.match(/GPIO([ABC])/g) || []).map(m => m.replace('GPIO', '')))
  usedPorts.forEach(port => {
    const enablePattern = new RegExp(`__HAL_RCC_GPIO${port}_CLK_ENABLE`)
    if (!enablePattern.test(code)) {
      errors.push({ line: 0, msg: `GPIO${port} used but \`__HAL_RCC_GPIO${port}_CLK_ENABLE()\` not called`, severity: 'warning' })
    }
  })

  return errors
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CODE PARSER — extract simulation steps from valid C code
// ═══════════════════════════════════════════════════════════════════════════════
function parsePinNumber(s) { const m = s.match(/GPIO_PIN_(\d+)/); return m ? +m[1] : -1 }
function parsePort(s) { const m = s.match(/GPIO([ABC])/); return m ? m[1] : null }

export function parseCode(code) {
  const steps = []
  const lines = stripComments(code).split('\n')
  let inMain = false, inWhile = false, braceDepth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    if (/int\s+main\s*\(/.test(line)) inMain = true
    if (inMain) {
      braceDepth += (line.match(/\{/g)||[]).length
      braceDepth -= (line.match(/\}/g)||[]).length
    }
    if (!inMain) continue

    if (/while\s*\(\s*1\s*\)|while\s*\(\s*true\s*\)|for\s*\(\s*;/.test(line)) inWhile = true

    // HAL_GPIO_WritePin
    const wm = line.match(/HAL_GPIO_WritePin\s*\(\s*(GPIO[ABC])\s*,\s*(GPIO_PIN_\d+)\s*,\s*(GPIO_PIN_SET|GPIO_PIN_RESET)\s*\)/)
    if (wm) steps.push({ type:'gpio_write', port:parsePort(wm[1]), pin:parsePinNumber(wm[2]), value:wm[3]==='GPIO_PIN_SET'?1:0, loop:inWhile })

    // HAL_GPIO_TogglePin
    const tm = line.match(/HAL_GPIO_TogglePin\s*\(\s*(GPIO[ABC])\s*,\s*(GPIO_PIN_\d+)\s*\)/)
    if (tm) steps.push({ type:'gpio_toggle', port:parsePort(tm[1]), pin:parsePinNumber(tm[2]), loop:inWhile })

    // HAL_Delay
    const dm = line.match(/HAL_Delay\s*\(\s*(\d+)\s*\)/)
    if (dm) steps.push({ type:'delay', ms:+dm[1], loop:inWhile })

    // printf
    const pm = line.match(/printf\s*\(\s*"([^"]+)"/)
    if (pm) steps.push({ type:'serial_out', msg:pm[1].replace(/\\n/g,'\n').replace(/\\r/g,'').trim(), loop:inWhile })

    // HAL_UART_Transmit
    const um = line.match(/HAL_UART_Transmit\s*\([^,]+,\s*\(uint8_t\s*\*\)\s*"([^"]+)"/)
    if (um) steps.push({ type:'serial_out', msg:um[1].replace(/\\n/g,'\n').trim(), loop:inWhile })
  }

  return steps
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SIMULATION RUNNER — async generator
// ═══════════════════════════════════════════════════════════════════════════════
export async function* runSimulation(code, signal) {
  const t = () => Date.now()

  yield { type:'boot', msg:'⚡ STM32 Simulator v2.0 — Harvegen', time:t() }
  await sleep(100)
  yield { type:'boot', msg:'🎯 Target: STM32F103C8T6 · ARM Cortex-M3 · 72MHz', time:t() }
  await sleep(100)
  yield { type:'boot', msg:'🔍 Running strict C validator...', time:t() }
  await sleep(150)

  const errors = detectErrors(code)
  const fatal = errors.filter(e => e.severity === 'error')
  const warns = errors.filter(e => e.severity === 'warning')

  if (fatal.length > 0) {
    yield { type:'separator', msg:'── Compilation Errors ──', time:t() }
    for (const e of fatal) {
      await sleep(60)
      yield { type:'error', msg:`❌ error${e.line ? ` [line ${e.line}]` : ''}: ${e.msg}`, time:t(), line:e.line }
    }
    await sleep(100)
    yield { type:'error', msg:`⛔ ${fatal.length} error(s) found — simulation aborted. Fix your code and try again.`, time:t() }
    return
  }

  for (const w of warns) {
    yield { type:'warning', msg:`⚠ warning${w.line ? ` [line ${w.line}]` : ''}: ${w.msg}`, time:t() }
    await sleep(40)
  }

  yield { type:'success', msg:`✅ Validation passed (${warns.length} warning${warns.length!==1?'s':''})`, time:t() }
  await sleep(150)

  const steps = parseCode(code)
  if (steps.length === 0) {
    yield { type:'warning', msg:'⚠ No simulatable HAL calls found. Add HAL_GPIO_WritePin / HAL_Delay / printf().', time:t() }
  }

  yield { type:'boot', msg:`📦 ${steps.length} operation(s) loaded`, time:t() }
  await sleep(120)
  yield { type:'boot', msg:'🚀 HAL_Init() ............. OK', time:t() }
  await sleep(100)
  yield { type:'boot', msg:'🕐 SystemClock_Config() ... 72MHz PLL OK', time:t() }
  await sleep(100)
  yield { type:'boot', msg:'📌 MX_GPIO_Init() ......... OK', time:t() }
  await sleep(150)
  yield { type:'separator', msg:'──────── main loop ────────', time:t() }
  await sleep(80)

  const gpio = createGPIOState()
  const init = steps.filter(s => !s.loop)
  const loop = steps.filter(s => s.loop)

  for (const s of init) { if (signal?.aborted) return; yield* execStep(s, gpio) }

  if (!loop.length) {
    yield { type:'system', msg:'ℹ Program exited (no infinite loop)', time:t() }
    return
  }

  while (true) {
    for (const s of loop) {
      if (signal?.aborted) return
      yield* execStep(s, gpio)
      await sleep(0)
    }
  }
}

function* execStep(step, gpio) {
  const t = Date.now
  switch (step.type) {
    case 'gpio_write': {
      gpio[step.port][step.pin] = step.value
      const state = step.value ? 'HIGH' : 'LOW'
      const note = (step.port==='C' && step.pin===13) ? (step.value===0?' 🔴 LED ON':' ⚫ LED OFF') : ''
      yield { type:'gpio', msg:`GPIO_Write: P${step.port}${step.pin} = ${state}${note}`, port:step.port, pin:step.pin, value:step.value, time:Date.now() }
      break
    }
    case 'gpio_toggle': {
      const next = gpio[step.port][step.pin] === 1 ? 0 : 1
      gpio[step.port][step.pin] = next
      const state = next ? 'HIGH' : 'LOW'
      const note = (step.port==='C' && step.pin===13) ? (next===0?' 🔴 LED ON':' ⚫ LED OFF') : ''
      yield { type:'gpio', msg:`GPIO_Toggle: P${step.port}${step.pin} → ${state}${note}`, port:step.port, pin:step.pin, value:next, time:Date.now() }
      break
    }
    case 'delay':
      yield { type:'delay', msg:`HAL_Delay(${step.ms}ms)`, ms:step.ms, time:Date.now() }
      break
    case 'serial_out':
      yield { type:'serial', msg:step.msg, time:Date.now() }
      break
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CODE GENERATOR — from circuit components → C code
// ═══════════════════════════════════════════════════════════════════════════════
export function generateCodeFromCircuit(components, connections) {
  // Normalize — defend against functional updaters or undefined being passed in
  const comps = Array.isArray(components) ? components : []
  const conns  = Array.isArray(connections) ? connections : []

  if (!comps.length) return null

  // If nothing wired, emit a scaffold that at least boots and prints component names
  if (!conns.length) {
    const compList = comps.map(c => c.label || c.type).join(', ')
    return [
      `/**`,
      ` * STM32F103C8 — Auto-generated scaffold`,
      ` * Components placed: ${compList}`,
      ` * Wire the components to GPIO pins, then click Generate Code again!`,
      ` */`,
      '#include "stm32f1xx_hal.h"',
      '#include <stdio.h>',
      '',
      'void SystemClock_Config(void);',
      'static void MX_GPIO_Init(void);',
      '',
      'int main(void)',
      '{',
      '  HAL_Init();',
      '  SystemClock_Config();',
      '  MX_GPIO_Init();',
      '',
      `  printf("Components: ${compList}\\n");`,
      `  printf("Wire components to pins and click Generate Code!\\n");`,
      '',
      '  while (1)',
      '  {',
      '    HAL_Delay(1000);',
      '  }',
      '}',
      '',
      'void SystemClock_Config(void) { /* Configure 72MHz clock */ }',
      'static void MX_GPIO_Init(void)',
      '{',
      '  // Onboard LED PC13',
      '  __HAL_RCC_GPIOC_CLK_ENABLE();',
      '  GPIO_InitTypeDef GPIO_InitStruct = {0};',
      '  GPIO_InitStruct.Pin = GPIO_PIN_13;',
      '  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;',
      '  GPIO_InitStruct.Pull = GPIO_NOPULL;',
      '  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);',
      '}',
    ].join('\n')
  }

  // Build pin→component mapping
  const pinMap = {} // pinId → component
  conns.forEach(conn => {
    const comp = comps.find(c => c.id === conn.to || c.id === conn.from)
    if (!comp) return
    const pinId = (conn.from || '').startsWith('P') ? conn.from : conn.to
    if (pinId) pinMap[pinId] = comp
  })

  const outputs = []   // pins driving output components (LEDs, buzzers)
  const inputs = []    // pins reading input components (buttons, pots)
  const adcPins = []   // ADC-capable pins with analog components

  for (const [pinId, comp] of Object.entries(pinMap)) {
    const m = pinId.match(/^P([ABC])(\d+)$/)
    if (!m) continue
    const port = m[1], pin = parseInt(m[2])
    const portStr = `GPIO${port}`
    const pinStr = `GPIO_PIN_${pin}`
    if (['led','buzzer','lcd'].includes(comp.type)) outputs.push({ port, pin, portStr, pinStr, comp, pinId })
    if (['button'].includes(comp.type)) inputs.push({ port, pin, portStr, pinStr, comp, pinId })
    if (['potentiometer'].includes(comp.type)) adcPins.push({ port, pin, portStr, pinStr, comp, pinId })
  }

  if (!outputs.length && !inputs.length && !adcPins.length) return null

  // Build includes
  const includes = ['#include "stm32f1xx_hal.h"', '#include <stdio.h>']

  // Build function prototypes
  const protos = ['void SystemClock_Config(void);', 'static void MX_GPIO_Init(void);']
  if (adcPins.length) protos.push('static void MX_ADC_Init(void);')

  // Build MX_GPIO_Init
  const gpioInits = []
  const usedPorts = new Set([...outputs, ...inputs].map(p => p.port))
  usedPorts.forEach(p => gpioInits.push(`  __HAL_RCC_GPIO${p}_CLK_ENABLE();`))
  gpioInits.push('')

  outputs.forEach(({ portStr, pinStr, comp }) => {
    gpioInits.push(`  // ${comp.label} — Output`)
    gpioInits.push(`  HAL_GPIO_WritePin(${portStr}, ${pinStr}, GPIO_PIN_SET); // OFF`)
    gpioInits.push(`  GPIO_InitStruct.Pin = ${pinStr};`)
    gpioInits.push(`  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;`)
    gpioInits.push(`  GPIO_InitStruct.Pull = GPIO_NOPULL;`)
    gpioInits.push(`  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;`)
    gpioInits.push(`  HAL_GPIO_Init(${portStr}, &GPIO_InitStruct);`)
    gpioInits.push('')
  })

  inputs.forEach(({ portStr, pinStr, comp }) => {
    gpioInits.push(`  // ${comp.label} — Input with pull-up`)
    gpioInits.push(`  GPIO_InitStruct.Pin = ${pinStr};`)
    gpioInits.push(`  GPIO_InitStruct.Mode = GPIO_MODE_INPUT;`)
    gpioInits.push(`  GPIO_InitStruct.Pull = GPIO_PULLUP;`)
    gpioInits.push(`  HAL_GPIO_Init(${portStr}, &GPIO_InitStruct);`)
    gpioInits.push('')
  })

  // Include onboard LED PC13 always
  const hasPC13 = outputs.some(p => p.port === 'C' && p.pin === 13)
  if (!hasPC13) {
    gpioInits.unshift('  // Onboard LED — PC13 (Active LOW)')
    gpioInits.unshift('  __HAL_RCC_GPIOC_CLK_ENABLE();')
    outputs.unshift({ portStr:'GPIOC', pinStr:'GPIO_PIN_13', comp:{ label:'Onboard LED', type:'led' }, port:'C', pin:13 })
  }

  // Build main loop body
  const loopBody = []
  outputs.forEach(({ portStr, pinStr, comp }) => {
    if (comp.type === 'led' || comp.type === 'buzzer') {
      loopBody.push(`    HAL_GPIO_WritePin(${portStr}, ${pinStr}, GPIO_PIN_RESET); // ${comp.label} ON`)
      loopBody.push(`    HAL_Delay(500);`)
      loopBody.push(`    HAL_GPIO_WritePin(${portStr}, ${pinStr}, GPIO_PIN_SET);  // ${comp.label} OFF`)
      loopBody.push(`    HAL_Delay(500);`)
      loopBody.push(`    printf("${comp.label} toggled\\n");`)
    }
  })
  inputs.forEach(({ portStr, pinStr, comp }) => {
    loopBody.push(`    if (HAL_GPIO_ReadPin(${portStr}, ${pinStr}) == GPIO_PIN_RESET) {`)
    loopBody.push(`      printf("${comp.label} pressed!\\n");`)
    loopBody.push(`    }`)
  })
  if (!loopBody.length) loopBody.push('    HAL_Delay(1000);')

  const code = [
    `/**`,
    ` * STM32F103C8 — Auto-generated from Circuit`,
    ` * Components: ${comps.map(c=>c.label).join(', ')}`,
    ` */`,
    ...includes,
    '',
    ...protos,
    '',
    'int main(void)',
    '{',
    '  HAL_Init();',
    '  SystemClock_Config();',
    '  MX_GPIO_Init();',
    '',
    `  printf("Circuit ready!\\n");`,
    '',
    '  while (1)',
    '  {',
    ...loopBody,
    '  }',
    '}',
    '',
    'void SystemClock_Config(void)',
    '{',
    '  RCC_OscInitTypeDef RCC_OscInitStruct = {0};',
    '  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};',
    '  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;',
    '  RCC_OscInitStruct.HSEState = RCC_HSE_ON;',
    '  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;',
    '  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;',
    '  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;',
    '  HAL_RCC_OscConfig(&RCC_OscInitStruct);',
    '  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK|RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;',
    '  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;',
    '  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;',
    '  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;',
    '  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;',
    '  HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2);',
    '}',
    '',
    'static void MX_GPIO_Init(void)',
    '{',
    '  GPIO_InitTypeDef GPIO_InitStruct = {0};',
    ...gpioInits,
    '}',
  ].join('\n')

  return code
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
