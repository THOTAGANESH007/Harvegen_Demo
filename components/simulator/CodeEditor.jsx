'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const LANG = { c:'cpp', h:'cpp', cpp:'cpp', json:'json', cmake:'plaintext', txt:'plaintext' }

export default function CodeEditor({ file, onChange, simState, errorLines = [] }) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const decorRef  = useRef([])

  // Apply error line decorations whenever errorLines changes
  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return

    // Clear old decorations
    decorRef.current = editor.deltaDecorations(decorRef.current, [])

    if (!errorLines.length) return

    const newDecors = errorLines.map(ln => ({
      range: new monaco.Range(ln, 1, ln, 1),
      options: {
        isWholeLine: true,
        className: 'sim-error-line-bg',
        glyphMarginClassName: 'sim-error-glyph',
        overviewRuler: { color: '#ef4444', position: 1 },
        minimap: { color: '#ef4444', position: 1 },
      }
    }))

    decorRef.current = editor.deltaDecorations([], newDecors)

    // Scroll to first error
    editor.revealLineInCenter(errorLines[0])
  }, [errorLines])

  const handleMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // STM32 HAL completions
    const disp = monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: () => ({
        suggestions: [
          ['HAL_GPIO_WritePin(${1:GPIOA}, ${2:GPIO_PIN_5}, ${3:GPIO_PIN_SET});', 'Write GPIO pin HIGH/LOW'],
          ['HAL_GPIO_ReadPin(${1:GPIOA}, ${2:GPIO_PIN_5})', 'Read GPIO pin state'],
          ['HAL_GPIO_TogglePin(${1:GPIOA}, ${2:GPIO_PIN_5});', 'Toggle GPIO pin'],
          ['HAL_Delay(${1:500});', 'Delay in milliseconds'],
          ['HAL_Init();', 'Initialize HAL library'],
          ['HAL_GetTick()', 'Get millisecond tick count'],
          ['HAL_UART_Transmit(&${1:huart1}, (uint8_t*)"${2:msg}", ${3:3}, ${4:100});', 'UART transmit'],
          ['printf("${1:Hello}\\n");', 'Print to serial'],
          ['GPIO_PIN_SET', 'GPIO High'], ['GPIO_PIN_RESET', 'GPIO Low'],
          ['GPIOA', 'GPIO Port A'], ['GPIOB', 'GPIO Port B'], ['GPIOC', 'GPIO Port C'],
          ['GPIO_PIN_0','Pin 0'],['GPIO_PIN_1','Pin 1'],['GPIO_PIN_5','Pin 5'],
          ['GPIO_PIN_13','Pin 13 (onboard LED)'],
        ].map(([snippet, detail]) => ({
          label: snippet.split('(')[0].trim(),
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: snippet,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail,
        }))
      })
    })

    // Wokwi-accurate dark theme
    monaco.editor.defineTheme('wokwi-dark', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'comment',    foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword',    foreground: 'c792ea' },
        { token: 'string',     foreground: 'c3e88d' },
        { token: 'number',     foreground: 'f78c6c' },
        { token: 'type',       foreground: '82aaff' },
        { token: 'delimiter',  foreground: '89ddff' },
        { token: 'identifier', foreground: 'eeffff' },
        { token: 'function',   foreground: '82aaff' },
        { token: 'macro',      foreground: 'ffcb6b' },
      ],
      colors: {
        'editor.background':              '#1a1a2e',
        'editor.foreground':              '#eeffff',
        'editor.lineHighlightBackground': '#1f2041',
        'editor.selectionBackground':     '#3d4266',
        'editorLineNumber.foreground':    '#3b3f5c',
        'editorLineNumber.activeForeground': '#7986cb',
        'editorCursor.foreground':        '#7986cb',
        'editor.inactiveSelectionBackground': '#2a2d4a',
        'editorGutter.background':        '#16172a',
        'editorGutter.addedBackground':   '#1a472a',
        'editorSuggestWidget.background': '#1a1a2e',
        'editorSuggestWidget.border':     '#2a2d4a',
        'editorSuggestWidget.selectedBackground': '#2a2d4a',
        'editorGlyphMargin.background':   '#16172a',
        'scrollbarSlider.background':     '#2a2d4a',
        'scrollbarSlider.hoverBackground':'#3d4266',
        'minimap.background':             '#16172a',
      }
    })
    monaco.editor.setTheme('wokwi-dark')

    // Error line CSS injection
    const style = document.createElement('style')
    style.textContent = `
      .sim-error-line-bg { background: rgba(239,68,68,0.12) !important; border-left: 3px solid #ef4444 !important; }
      .sim-error-glyph::before { content: '●'; color: #ef4444; font-size: 10px; margin-left: 2px; }
    `
    document.head.appendChild(style)

    return () => { disp.dispose(); if (style.parentNode) style.parentNode.removeChild(style) }
  }

  return (
    <div className="sim-editor-wrapper">
      <div className="sim-editor-tab-bar">
        <div className="sim-editor-tab active">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#82aaff" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>{file?.name}</span>
          {errorLines.length > 0 && <span className="sim-error-badge">{errorLines.length} error{errorLines.length!==1?'s':''}</span>}
        </div>
        <div className="sim-editor-actions">
          {simState === 'running' && (
            <div className="sim-running-badge"><span className="sim-running-dot"/>Live</div>
          )}
          {simState === 'error' && (
            <div className="sim-error-badge-toolbar">⚠ Errors found</div>
          )}
        </div>
      </div>
      <MonacoEditor
        height="100%"
        language={LANG[file?.type] || 'cpp'}
        value={file?.content || ''}
        theme="wokwi-dark"
        onChange={onChange}
        onMount={handleMount}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
          fontLigatures: true,
          lineHeight: 21,
          minimap: { enabled: true, maxColumn: 60 },
          scrollBeyondLastLine: false,
          padding: { top: 10 },
          folding: true,
          glyphMargin: true,
          renderLineHighlight: 'gutter',
          smoothScrolling: true,
          cursorBlinking: 'phase',
          cursorSmoothCaretAnimation: 'on',
          tabSize: 2,
          readOnly: simState === 'running',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          parameterHints: { enabled: true },
          renderValidationDecorations: 'on',
          overviewRulerLanes: 3,
        }}
      />
    </div>
  )
}
