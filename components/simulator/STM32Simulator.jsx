'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import SimulatorToolbar from './SimulatorToolbar'
import CodeEditor from './CodeEditor'
import CircuitCanvas from './CircuitCanvas'
import SerialMonitor from './SerialMonitor'
import ComponentPalette from './ComponentPalette'
import FileTree from './FileTree'
import { runSimulation, detectErrors, createGPIOState } from './stm32Engine'
import './simulator.css'

const DEFAULT_CODE = `/**
 * STM32F103C8 — Blue Pill
 * LED Blink + UART Hello
 * Edit this code and press ▶ Play!
 */
#include "stm32f1xx_hal.h"
#include <stdio.h>

void SystemClock_Config(void);
static void MX_GPIO_Init(void);

int main(void)
{
  HAL_Init();
  SystemClock_Config();
  MX_GPIO_Init();

  printf("STM32 Started!\\n");

  while (1)
  {
    HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET); // LED ON
    HAL_Delay(500);
    HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET);   // LED OFF
    HAL_Delay(500);
    printf("Blink!\\n");
  }
}

void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};
  RCC_OscInitStruct.OscillatorType = RCC_OSCILLATORTYPE_HSE;
  RCC_OscInitStruct.HSEState = RCC_HSE_ON;
  RCC_OscInitStruct.PLL.PLLState = RCC_PLL_ON;
  RCC_OscInitStruct.PLL.PLLSource = RCC_PLLSOURCE_HSE;
  RCC_OscInitStruct.PLL.PLLMUL = RCC_PLL_MUL9;
  HAL_RCC_OscConfig(&RCC_OscInitStruct);
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK
                               | RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
  RCC_ClkInitStruct.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;
  RCC_ClkInitStruct.AHBCLKDivider = RCC_SYSCLK_DIV1;
  RCC_ClkInitStruct.APB1CLKDivider = RCC_HCLK_DIV2;
  RCC_ClkInitStruct.APB2CLKDivider = RCC_HCLK_DIV1;
  HAL_RCC_ClockConfig(&RCC_ClkInitStruct, FLASH_LATENCY_2);
}

static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};
  __HAL_RCC_GPIOC_CLK_ENABLE();
  HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET);
  GPIO_InitStruct.Pin = GPIO_PIN_13;
  GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_PP;
  GPIO_InitStruct.Pull = GPIO_NOPULL;
  GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOC, &GPIO_InitStruct);
}
`

const INITIAL_FILES = [
  { id: 'main', name: 'main.c', type: 'c', content: DEFAULT_CODE },
  {
    id: 'diagram', name: 'diagram.json', type: 'json',
    content: JSON.stringify({ version: 1, author: 'Harvegen', parts: [{ type: 'board-bluepill-stm32f103c8', id: 'stm1' }], connections: [] }, null, 2)
  },
  {
    id: 'cmake', name: 'CMakeLists.txt', type: 'cmake',
    content: 'cmake_minimum_required(VERSION 3.16)\nproject(stm32_project)\nset(CMAKE_C_STANDARD 11)\nadd_executable(firmware src/main.c)\ntarget_link_libraries(firmware STM32::HAL::STM32F1xx)'
  },
]

export default function STM32Simulator() {
  const [simState, setSimState] = useState('idle')       // idle | running | paused | building | error
  const [files, setFiles] = useState(INITIAL_FILES)
  const [activeFileId, setActiveFileId] = useState('main')
  const [circuitComponents, setCircuitComponents] = useState([])
  const [connections, setConnections] = useState([])
  const [serialLogs, setSerialLogs] = useState([])
  const [buildLogs, setBuildLogs] = useState([])
  const [activePanel, setActivePanel] = useState('serial')
  const [showPalette, setShowPalette] = useState(false)
  const [panelSizes, setPanelSizes] = useState({ code: 42, canvas: 58 })
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true)
  const [simTime, setSimTime] = useState(0)
  // GPIO driven by engine
  const [gpioState, setGpioState] = useState(createGPIOState())

  const abortRef = useRef(null)
  const clockRef = useRef(null)
  const simStartRef = useRef(null)
  const runnerRef = useRef(null)
  const delayQueueRef = useRef([])

  const activeFile = files.find(f => f.id === activeFileId)

  const updateFileContent = useCallback((content) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f))
  }, [activeFileId])

  // ── Build ──────────────────────────────────────────────────────────────────
  const handleBuild = useCallback(async () => {
    const mainFile = files.find(f => f.id === 'main')
    const code = mainFile?.content || ''

    setSimState('building')
    setBuildLogs([])
    setActivePanel('build')
    setBottomPanelOpen(true)

    const log = (msg, type = 'info') =>
      setBuildLogs(prev => [...prev, { msg, type, time: Date.now() }])

    log('[INFO] Initializing build — STM32F103C8T6', 'info')
    await delay(300)
    log('[INFO] Checking source: main.c', 'info')
    await delay(300)

    const errors = detectErrors(code)
    const errs = errors.filter(e => e.severity === 'error')
    const warns = errors.filter(e => e.severity === 'warning')

    for (const w of warns) {
      log(`[WARN] Line ${w.line}: ${w.msg}`, 'warning')
      await delay(100)
    }

    if (errs.length > 0) {
      for (const e of errs) {
        log(`[ERROR] ${e.line ? `Line ${e.line}: ` : ''}${e.msg}`, 'error')
        await delay(100)
      }
      log('[FAILED] Build failed — fix errors above', 'error')
      setSimState('error')
      return
    }

    log('[INFO] arm-none-eabi-gcc -mcpu=cortex-m3 -mthumb -O2 -c main.c -o main.o', 'info')
    await delay(500)
    log('[OK]   Compiled main.c → main.o', 'success')
    await delay(300)
    log('[INFO] arm-none-eabi-ld -T STM32F103C8_FLASH.ld -o firmware.elf main.o', 'info')
    await delay(400)
    log('[OK]   Linked → firmware.elf', 'success')
    await delay(200)
    log('[INFO] arm-none-eabi-objcopy -O binary firmware.elf firmware.bin', 'info')
    await delay(300)
    log('[OK]   firmware.bin generated', 'success')
    await delay(200)
    log('[INFO] Flash: 5,120 bytes used (5 KB / 64 KB)', 'info')
    log('[INFO] RAM:   1,024 bytes used (1 KB / 20 KB)', 'info')
    await delay(200)
    log('[SUCCESS] ✅ Build complete — ready to simulate', 'success')
    setSimState('idle')
  }, [files])

  // ── Play ───────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (simState === 'running') return

    // Cancel any previous run
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSimState('running')
    setSerialLogs([])
    setGpioState(createGPIOState())
    setActivePanel('serial')
    setBottomPanelOpen(true)
    simStartRef.current = Date.now()

    // Clock ticker
    if (clockRef.current) clearInterval(clockRef.current)
    clockRef.current = setInterval(() => {
      setSimTime(Math.floor((Date.now() - simStartRef.current) / 1000))
    }, 1000)

    const mainFile = files.find(f => f.id === 'main')
    const code = mainFile?.content || ''

    const addLog = (log) => setSerialLogs(prev => [...prev, log])

    // Run the engine as async generator
    const generator = runSimulation(code, controller.signal)
    runnerRef.current = generator

    const processEvents = async () => {
      try {
        for await (const event of generator) {
          if (controller.signal.aborted) break

          switch (event.type) {
            case 'boot':
            case 'separator':
              addLog({ msg: event.msg, type: 'system', time: event.time })
              break
            case 'gpio':
              addLog({ msg: event.msg, type: event.value === 0 ? 'highlight' : 'output', time: event.time })
              setGpioState(prev => {
                const next = { ...prev, [event.port]: { ...prev[event.port], [event.pin]: event.value } }
                return next
              })
              break
            case 'serial':
              addLog({ msg: `> ${event.msg}`, type: 'serial', time: event.time })
              break
            case 'delay':
              addLog({ msg: event.msg, type: 'delay', time: event.time })
              await new Promise(r => {
                const t = setTimeout(r, Math.min(event.ms, 2000)) // cap at 2s real time per delay
                delayQueueRef.current.push(t)
              })
              break
            case 'error':
              addLog({ msg: event.msg, type: 'error', time: event.time })
              break
            case 'warning':
              addLog({ msg: event.msg, type: 'warning', time: event.time })
              break
            case 'system':
              addLog({ msg: event.msg, type: 'system', time: event.time })
              break
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          addLog({ msg: `Runtime error: ${err.message}`, type: 'error', time: Date.now() })
        }
      }
    }

    processEvents()
  }, [simState, files])

  // ── Pause ──────────────────────────────────────────────────────────────────
  const handlePause = useCallback(() => {
    if (simState !== 'running') return
    setSimState('paused')
    if (abortRef.current) abortRef.current.abort()
    if (clockRef.current) clearInterval(clockRef.current)
    setSerialLogs(prev => [...prev, { msg: '⏸ Simulation paused', type: 'system', time: Date.now() }])
  }, [simState])

  // ── Stop ───────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    if (clockRef.current) clearInterval(clockRef.current)
    delayQueueRef.current.forEach(t => clearTimeout(t))
    delayQueueRef.current = []
    setSimState('idle')
    setSimTime(0)
    setGpioState(createGPIOState())
    setSerialLogs(prev => [...prev, { msg: '⏹ Simulation stopped', type: 'system', time: Date.now() }])
  }, [])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
      if (clockRef.current) clearInterval(clockRef.current)
      delayQueueRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // ── Component palette ──────────────────────────────────────────────────────
  const handleAddComponent = useCallback((component) => {
    setCircuitComponents(prev => [...prev, {
      ...component,
      id: `${component.type}-${Date.now()}`,
      x: 180 + Math.random() * 180,
      y: 80 + Math.random() * 180,
    }])
    setShowPalette(false)
  }, [])

  const handleRemoveComponent = useCallback((id) => {
    setCircuitComponents(prev => prev.filter(c => c.id !== id))
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id))
  }, [])

  return (
    <div className="sim-root">
      <SimulatorToolbar
        simState={simState}
        simTime={simTime}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onBuild={handleBuild}
        onTogglePalette={() => setShowPalette(v => !v)}
        showPalette={showPalette}
      />

      <div className="sim-workspace">
        {/* Left: File Tree + Monaco Editor */}
        <div className="sim-left-panel" style={{ width: `${panelSizes.code}%` }}>
          <FileTree files={files} activeFileId={activeFileId} onSelect={setActiveFileId} />
          <div className="sim-editor-area">
            <CodeEditor file={activeFile} onChange={updateFileContent} simState={simState} />
          </div>
        </div>

        <ResizeHandle onResize={(delta) => {
          setPanelSizes(prev => {
            const newCode = Math.max(20, Math.min(70, prev.code + delta))
            return { code: newCode, canvas: 100 - newCode }
          })
        }} />

        {/* Right: Circuit Canvas */}
        <div className="sim-right-panel" style={{ width: `${panelSizes.canvas}%` }}>
          <div className="sim-canvas-header">
            <span className="sim-panel-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Circuit Diagram
            </span>
            <div className="sim-canvas-actions">
              <button className="sim-icon-btn" onClick={() => setShowPalette(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Component
              </button>
            </div>
          </div>
          <CircuitCanvas
            components={circuitComponents}
            connections={connections}
            simState={simState}
            gpioState={gpioState}
            onRemoveComponent={handleRemoveComponent}
            onConnectionsChange={setConnections}
            onComponentsChange={setCircuitComponents}
          />
        </div>
      </div>

      {/* Bottom: Serial Monitor / Build Output */}
      <div className={`sim-bottom-panel ${bottomPanelOpen ? 'open' : 'closed'}`}>
        <div className="sim-bottom-header">
          <div className="sim-bottom-tabs">
            <button className={`sim-tab ${activePanel === 'serial' ? 'active' : ''}`}
              onClick={() => { setActivePanel('serial'); setBottomPanelOpen(true) }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              Serial Monitor
            </button>
            <button className={`sim-tab ${activePanel === 'build' ? 'active' : ''}`}
              onClick={() => { setActivePanel('build'); setBottomPanelOpen(true) }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Build Output
            </button>
          </div>
          <div className="sim-bottom-actions">
            <button className="sim-icon-btn" onClick={() => activePanel === 'serial' ? setSerialLogs([]) : setBuildLogs([])}>
              Clear
            </button>
            <button className="sim-icon-btn" onClick={() => setBottomPanelOpen(v => !v)}>
              {bottomPanelOpen ? '▼' : '▲'}
            </button>
          </div>
        </div>
        {bottomPanelOpen && (
          <SerialMonitor
            logs={activePanel === 'serial' ? serialLogs : buildLogs}
            type={activePanel}
            simState={simState}
          />
        )}
      </div>

      {showPalette && (
        <ComponentPalette onAdd={handleAddComponent} onClose={() => setShowPalette(false)} />
      )}
    </div>
  )
}

function ResizeHandle({ onResize }) {
  const dragging = useRef(false)
  const lastX = useRef(0)
  const onMouseDown = (e) => {
    dragging.current = true
    lastX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (e) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      lastX.current = e.clientX
      onResize((dx / window.innerWidth) * 100)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  return (
    <div className="sim-resize-handle" onMouseDown={onMouseDown}>
      <div className="sim-resize-grip" />
    </div>
  )
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
