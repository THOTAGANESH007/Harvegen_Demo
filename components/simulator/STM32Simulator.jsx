'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import SimulatorToolbar from './SimulatorToolbar'
import CodeEditor from './CodeEditor'
import CircuitCanvas from './CircuitCanvas'
import SerialMonitor from './SerialMonitor'
import ComponentPalette from './ComponentPalette'
import FileTree from './FileTree'
import LibraryPalette from './LibraryPalette'
import { runSimulation, detectErrors, createGPIOState, generateCodeFromCircuit } from './stm32Engine'
import './simulator.css'

const DEFAULT_CODE = `/**
 * STM32F103C8
 * Blink + Serial Example
 * ▶ Press Play to simulate!
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

  printf("STM32 Ready!\\n");

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
  RCC_ClkInitStruct.ClockType = RCC_CLOCKTYPE_HCLK|RCC_CLOCKTYPE_SYSCLK|RCC_CLOCKTYPE_PCLK1|RCC_CLOCKTYPE_PCLK2;
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

const INIT_FILES = [
  { id: 'main', name: 'main.c', type: 'c', content: DEFAULT_CODE },
  { id: 'diagram', name: 'diagram.json', type: 'json', content: JSON.stringify({ version: 1, parts: [{ type: 'board-bluepill-stm32f103c8', id: 'stm1' }], connections: [] }, null, 2) },
  { id: 'cmake', name: 'CMakeLists.txt', type: 'cmake', content: 'cmake_minimum_required(VERSION 3.16)\nproject(stm32_project)\nset(CMAKE_C_STANDARD 11)\nadd_executable(firmware src/main.c)\ntarget_link_libraries(firmware STM32::HAL::STM32F1xx)' },
]

export default function STM32Simulator() {
  const [simState, setSimState] = useState('idle')
  const [files, setFiles] = useState(INIT_FILES)
  const [activeFileId, setActiveFileId] = useState('main')
  const [circuitComponents, setCircuitComponents] = useState([])
  const [connections, setConnections] = useState([])
  const [serialLogs, setSerialLogs] = useState([])
  const [buildLogs, setBuildLogs] = useState([])
  const [activePanel, setActivePanel] = useState('serial')
  const [showPalette, setShowPalette] = useState(false)
  const [panelSizes, setPanelSizes] = useState({ code: 42, canvas: 58 })
  const [bottomOpen, setBottomOpen] = useState(true)
  const [simTime, setSimTime] = useState(0)
  const [gpioState, setGpioState] = useState(createGPIOState())
  const [errorLines, setErrorLines] = useState([])  // lines to highlight in editor
  const [codeGenBanner, setCodeGenBanner] = useState(null) // flash notification
  const [libraries, setLibraries] = useState(['STM32 HAL Driver', 'CMSIS Core', 'LL USB Driver'])
  const [fileTreeCollapsed, setFileTreeCollapsed] = useState(false)
  const [showLibPalette, setShowLibPalette] = useState(false)

  const abortRef = useRef(null)
  const clockRef = useRef(null)
  const simStart = useRef(null)
  const delayTimers = useRef([])

  const activeFile = files.find(f => f.id === activeFileId)
  const mainCode = files.find(f => f.id === 'main')?.content || ''

  const updateFileContent = useCallback((content) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f))
    // Clear error highlights when code changes
    if (activeFileId === 'main') setErrorLines([])
  }, [activeFileId])

  const overwriteMainCode = useCallback((code) => {
    setFiles(prev => prev.map(f => f.id === 'main' ? { ...f, content: code } : f))
    setErrorLines([])
  }, [])

  const handleAddLibrary = useCallback((libName) => {
    setLibraries(prev => {
      if (prev.includes(libName)) return prev
      return [...prev, libName]
    })
    setShowLibPalette(false)
    setActivePanel('build')
    setBottomOpen(true)
    setBuildLogs(prev => [
      ...prev,
      { msg: `[INFO] Downloading package library "${libName}"...`, type: 'info', time: Date.now() },
      { msg: `[INFO] Extracting headers & compiling source...`, type: 'info', time: Date.now() },
      { msg: `[OK]   Linked "${libName}" successfully to target "firmware.elf"`, type: 'success', time: Date.now() }
    ])
  }, [])

  // ─── Build (validate only) ────────────────────────────────────────────────
  const handleBuild = useCallback(async () => {
    setSimState('building')
    setBuildLogs([])
    setActivePanel('build')
    setBottomOpen(true)
    setErrorLines([])

    const log = (msg, type = 'info') => setBuildLogs(prev => [...prev, { msg, type, time: Date.now() }])

    log('[INFO] STM32F103C8T6 · ARM Cortex-M3 · 72MHz', 'info')
    await sleep(200)
    log('[INFO] Compiling main.c...', 'info')
    await sleep(300)

    const errors = detectErrors(mainCode)
    const fatal = errors.filter(e => e.severity === 'error')
    const warns = errors.filter(e => e.severity === 'warning')

    for (const w of warns) {
      await sleep(80)
      log(`[WARN]  line ${w.line}: ${w.msg}`, 'warning')
    }
    for (const e of fatal) {
      await sleep(80)
      log(`[ERROR] line ${e.line}: ${e.msg}`, 'error')
    }

    if (fatal.length > 0) {
      setErrorLines(fatal.filter(e => e.line > 0).map(e => e.line))
      await sleep(200)
      log(`[FAILED] Build failed — ${fatal.length} error(s)`, 'error')
      setSimState('error')
      return
    }

    await sleep(300)
    log('[OK]   arm-none-eabi-gcc → main.o', 'success')
    await sleep(200)
    log('[OK]   Linking → firmware.elf', 'success')
    await sleep(150)
    log('[OK]   Flash: ~5 KB / 64 KB', 'success')
    await sleep(100)
    log('[SUCCESS] ✅ Build complete', 'success')
    setSimState('idle')
  }, [mainCode])

  // ─── Play ─────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (simState === 'running') return
    if (abortRef.current) abortRef.current.abort()

    const ctrl = new AbortController()
    abortRef.current = ctrl

    setSimState('running')
    setSerialLogs([])
    setGpioState(createGPIOState())
    setActivePanel('serial')
    setBottomOpen(true)
    setErrorLines([])
    simStart.current = Date.now()

    if (clockRef.current) clearInterval(clockRef.current)
    clockRef.current = setInterval(() => setSimTime(Math.floor((Date.now() - simStart.current) / 1000)), 1000)

    const addLog = (log) => setSerialLogs(prev => [...prev, log])

    const gen = runSimulation(mainCode, ctrl.signal)
      ; (async () => {
        try {
          for await (const ev of gen) {
            if (ctrl.signal.aborted) break
            switch (ev.type) {
              case 'boot': case 'separator': case 'system':
                addLog({ msg: ev.msg, type: 'system', time: ev.time }); break
              case 'success':
                addLog({ msg: ev.msg, type: 'success', time: ev.time }); break
              case 'gpio':
                addLog({ msg: ev.msg, type: ev.value === 0 ? 'highlight' : 'output', time: ev.time })
                setGpioState(prev => ({ ...prev, [ev.port]: { ...prev[ev.port], [ev.pin]: ev.value } }))
                break
              case 'serial':
                addLog({ msg: `> ${ev.msg}`, type: 'serial', time: ev.time }); break
              case 'delay':
                addLog({ msg: ev.msg, type: 'delay', time: ev.time })
                await new Promise(r => { const t = setTimeout(r, Math.min(ev.ms, 1500)); delayTimers.current.push(t) })
                break
              case 'error':
                addLog({ msg: ev.msg, type: 'error', time: ev.time })
                if (ev.line) setErrorLines(prev => [...new Set([...prev, ev.line])])
                break
              case 'warning':
                addLog({ msg: ev.msg, type: 'warning', time: ev.time }); break
            }
          }
        } catch (err) {
          if (!ctrl.signal.aborted) addLog({ msg: `Runtime error: ${err.message}`, type: 'error', time: Date.now() })
        }
        // When generator ends naturally (error/stop), update state
        if (!ctrl.signal.aborted) {
          setSimState(prev => prev === 'running' ? 'idle' : prev)
          if (clockRef.current) clearInterval(clockRef.current)
        }
      })()
  }, [simState, mainCode])

  // ─── Pause ────────────────────────────────────────────────────────────────
  const handlePause = useCallback(() => {
    if (simState !== 'running') return
    if (abortRef.current) abortRef.current.abort()
    if (clockRef.current) clearInterval(clockRef.current)
    setSimState('paused')
    setSerialLogs(prev => [...prev, { msg: '⏸ Paused', type: 'system', time: Date.now() }])
  }, [simState])

  // ─── Stop ─────────────────────────────────────────────────────────────────
  const handleStop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort()
    if (clockRef.current) clearInterval(clockRef.current)
    delayTimers.current.forEach(t => clearTimeout(t))
    delayTimers.current = []
    setSimState('idle')
    setSimTime(0)
    setGpioState(createGPIOState())
    setSerialLogs(prev => [...prev, { msg: '⏹ Stopped', type: 'system', time: Date.now() }])
  }, [])

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort()
    if (clockRef.current) clearInterval(clockRef.current)
    delayTimers.current.forEach(clearTimeout)
  }, [])

  // ─── Circuit state handlers (No automatic code-gen) ───────────────────────
  const handleCircuitChanged = useCallback((newComponents, newConnections) => {
    setCircuitComponents(newComponents)
    setConnections(newConnections)
  }, [])

  const handleAddComponent = useCallback((comp) => {
    const newComponents = [...circuitComponents, {
      ...comp,
      id: `${comp.type}-${Date.now()}`,
      x: 180 + Math.random() * 160,
      y: 80 + Math.random() * 160,
    }]
    handleCircuitChanged(newComponents, connections)
    setShowPalette(false)
  }, [circuitComponents, connections, handleCircuitChanged])

  const handleRemoveComponent = useCallback((id) => {
    const newComponents = circuitComponents.filter(c => c.id !== id)
    const newConnections = connections.filter(c => c.from !== id && c.to !== id)
    handleCircuitChanged(newComponents, newConnections)
  }, [circuitComponents, connections, handleCircuitChanged])

  const handleConnectionsChange = useCallback((newConns) => {
    handleCircuitChanged(circuitComponents, newConns)
  }, [circuitComponents, handleCircuitChanged])

  // ─── Manual Code & Diagram Generator ─────────────────────────────────────
  const handleGenerateCode = useCallback(() => {
    const generatedCode = generateCodeFromCircuit(circuitComponents, connections)

    const diagramObj = {
      version: 1,
      parts: [
        { type: 'board-bluepill-stm32f103c8', id: 'stm1' },
        ...circuitComponents.map(c => ({
          type: c.type === 'led' ? `wokwi-led-${c.color || 'red'}` : c.type,
          id: c.id,
          top: c.y,
          left: c.x,
          attrs: { color: c.color || 'red' }
        }))
      ],
      connections: connections.map(conn => [
        `${conn.from.startsWith('P') ? 'stm1' : conn.from.split(':')[0]}:${conn.from.startsWith('P') ? conn.from : conn.from.split(':')[1]}`,
        `${conn.to.startsWith('P') ? 'stm1' : conn.to.split(':')[0]}:${conn.to.startsWith('P') ? conn.to : conn.to.split(':')[1]}`,
        conn.color || 'green',
        []
      ])
    }
    const diagramJson = JSON.stringify(diagramObj, null, 2)

    setFiles(prev => prev.map(f => {
      if (f.id === 'main' && generatedCode) {
        return { ...f, content: generatedCode }
      }
      if (f.id === 'diagram') {
        return { ...f, content: diagramJson }
      }
      return f
    }))

    setCodeGenBanner('✨ Code & diagram.json generated successfully!')
    setActiveFileId('main')
    setTimeout(() => setCodeGenBanner(null), 3000)
  }, [circuitComponents, connections])

  return (
    <div className="sim-root">
      <SimulatorToolbar
        simState={simState} simTime={simTime}
        onPlay={handlePlay} onPause={handlePause} onStop={handleStop} onBuild={handleBuild}
        onTogglePalette={() => setShowPalette(v => !v)}
      />

      {/* Code-gen flash banner */}
      {codeGenBanner && (
        <div className="sim-codegen-banner">{codeGenBanner}</div>
      )}

      <div className="sim-workspace">
        {/* Left: File Tree + Editor */}
        <div className="sim-left-panel" style={{ width: `${panelSizes.code}%` }}>
          <FileTree
            files={files}
            activeFileId={activeFileId}
            onSelect={setActiveFileId}
            collapsed={fileTreeCollapsed}
            onToggleCollapse={() => setFileTreeCollapsed(v => !v)}
            libraries={libraries}
            onAddLibraryClick={() => setShowLibPalette(true)}
          />
          <div className="sim-editor-area">
            <CodeEditor file={activeFile} onChange={updateFileContent} simState={simState} errorLines={errorLines} />
          </div>
        </div>

        <ResizeHandle onResize={d => setPanelSizes(prev => {
          const c = Math.max(20, Math.min(70, prev.code + d))
          return { code: c, canvas: 100 - c }
        })} />

        {/* Right: Circuit Canvas */}
        <div className="sim-right-panel" style={{ width: `${panelSizes.canvas}%` }}>
          <div className="sim-canvas-header">
            <span className="sim-panel-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Diagram
            </span>
            <div className="sim-canvas-actions" style={{ display: 'flex', gap: '6px' }}>
              <button
                className="sim-add-comp-btn"
                style={{ background: '#1b5e20', borderColor: '#2e7d32', color: '#69f0ae' }}
                onClick={handleGenerateCode}
                title="Generate main.c and diagram.json from circuit"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                Generate Code
              </button>
              <button className="sim-add-comp-btn" onClick={() => setShowPalette(v => !v)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
            onConnectionsChange={handleConnectionsChange}
            onComponentsChange={updaterOrArray => {
              // CircuitCanvas may pass a functional updater (prev => ...) or a plain array
              const resolved = typeof updaterOrArray === 'function'
                ? updaterOrArray(circuitComponents)
                : updaterOrArray
              handleCircuitChanged(resolved, connections)
            }}
          />
        </div>
      </div>

      {/* Bottom: Serial / Build */}
      <div className={`sim-bottom-panel ${bottomOpen ? 'open' : 'closed'}`}>
        <div className="sim-bottom-header">
          <div className="sim-bottom-tabs">
            {[
              { id: 'serial', icon: '> _', label: 'Serial Monitor' },
              { id: 'build', icon: '⚙', label: 'Build Output' },
            ].map(t => (
              <button key={t.id} className={`sim-tab ${activePanel === t.id ? 'active' : ''}`}
                onClick={() => { setActivePanel(t.id); setBottomOpen(true) }}>
                <span className="sim-tab-icon">{t.icon}</span>{t.label}
                {t.id === 'build' && simState === 'error' && <span className="sim-tab-error-dot" />}
              </button>
            ))}
          </div>
          <div className="sim-bottom-actions">
            <button className="sim-icon-btn" onClick={() => activePanel === 'serial' ? setSerialLogs([]) : setBuildLogs([])}>Clear</button>
            <button className="sim-icon-btn" onClick={() => setBottomOpen(v => !v)}>{bottomOpen ? '▾' : '▴'}</button>
          </div>
        </div>
        {bottomOpen && (
          <SerialMonitor
            logs={activePanel === 'serial' ? serialLogs : buildLogs}
            type={activePanel} simState={simState}
          />
        )}
      </div>

      {showPalette && <ComponentPalette onAdd={handleAddComponent} onClose={() => setShowPalette(false)} />}
      {showLibPalette && <LibraryPalette onAdd={handleAddLibrary} onClose={() => setShowLibPalette(false)} existing={libraries} />}
    </div>
  )
}

function ResizeHandle({ onResize }) {
  const dragging = useRef(false), lastX = useRef(0)
  const onMouseDown = (e) => {
    dragging.current = true; lastX.current = e.clientX
    document.body.style.cssText = 'cursor:col-resize;user-select:none'
    const onMove = (e) => { if (!dragging.current) return; const dx = e.clientX - lastX.current; lastX.current = e.clientX; onResize((dx / window.innerWidth) * 100) }
    const onUp = () => { dragging.current = false; document.body.style.cssText = ''; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
  }
  return <div className="sim-resize-handle" onMouseDown={onMouseDown}><div className="sim-resize-grip" /></div>
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
