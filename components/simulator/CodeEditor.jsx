'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const LANGUAGE_MAP = {
  c: 'cpp',
  h: 'cpp',
  cpp: 'cpp',
  json: 'json',
  cmake: 'cmake',
  txt: 'plaintext',
}

export default function CodeEditor({ file, onChange, simState }) {
  const editorRef = useRef(null)

  const language = LANGUAGE_MAP[file?.type] || 'cpp'

  const handleMount = (editor, monaco) => {
    editorRef.current = editor

    // STM32 HAL autocomplete tokens
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model, position) => {
        const stm32Tokens = [
          { label: 'HAL_GPIO_WritePin', detail: 'HAL GPIO Write Pin', insertText: 'HAL_GPIO_WritePin(${1:GPIOx}, ${2:GPIO_Pin}, ${3:PinState});', documentation: 'Write to a GPIO pin' },
          { label: 'HAL_GPIO_ReadPin', detail: 'HAL GPIO Read Pin', insertText: 'HAL_GPIO_ReadPin(${1:GPIOx}, ${2:GPIO_Pin})', documentation: 'Read a GPIO pin state' },
          { label: 'HAL_GPIO_TogglePin', detail: 'HAL GPIO Toggle Pin', insertText: 'HAL_GPIO_TogglePin(${1:GPIOx}, ${2:GPIO_Pin});', documentation: 'Toggle GPIO pin' },
          { label: 'HAL_Delay', detail: 'HAL Delay (ms)', insertText: 'HAL_Delay(${1:ms});', documentation: 'Delay in milliseconds' },
          { label: 'HAL_Init', detail: 'Initialize HAL', insertText: 'HAL_Init();' },
          { label: 'HAL_GetTick', detail: 'Get tick count', insertText: 'HAL_GetTick()' },
          { label: 'GPIO_PIN_SET', detail: 'GPIO Pin Set (HIGH)', insertText: 'GPIO_PIN_SET' },
          { label: 'GPIO_PIN_RESET', detail: 'GPIO Pin Reset (LOW)', insertText: 'GPIO_PIN_RESET' },
          { label: 'GPIOA', detail: 'GPIO Port A', insertText: 'GPIOA' },
          { label: 'GPIOB', detail: 'GPIO Port B', insertText: 'GPIOB' },
          { label: 'GPIOC', detail: 'GPIO Port C', insertText: 'GPIOC' },
          { label: 'GPIO_PIN_13', detail: 'GPIO Pin 13 (PC13 LED)', insertText: 'GPIO_PIN_13' },
        ].map(item => ({
          label: item.label,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: item.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: item.detail,
          documentation: item.documentation,
        }))
        return { suggestions: stm32Tokens }
      }
    })

    // Configure editor theme
    monaco.editor.defineTheme('harvegen-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'a78bfa' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fb923c' },
        { token: 'type', foreground: '60a5fa' },
        { token: 'function', foreground: 'fbbf24' },
        { token: 'identifier', foreground: 'e2e8f0' },
      ],
      colors: {
        'editor.background': '#0f1117',
        'editor.foreground': '#e2e8f0',
        'editor.lineHighlightBackground': '#1a1d2e',
        'editor.selectionBackground': '#312e81',
        'editorLineNumber.foreground': '#374151',
        'editorLineNumber.activeForeground': '#6366f1',
        'editorCursor.foreground': '#6366f1',
        'editor.inactiveSelectionBackground': '#1e2030',
        'editorIndentGuide.background': '#1e2030',
        'editorIndentGuide.activeBackground': '#374151',
        'editorSuggestWidget.background': '#141827',
        'editorSuggestWidget.border': '#1e2030',
        'editorSuggestWidget.selectedBackground': '#1e2748',
        'scrollbarSlider.background': '#1e2030',
        'scrollbarSlider.hoverBackground': '#2d3561',
      }
    })
    monaco.editor.setTheme('harvegen-dark')
  }

  return (
    <div className="sim-editor-wrapper">
      <div className="sim-editor-tab-bar">
        <div className="sim-editor-tab active">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>{file?.name}</span>
          <div className="sim-editor-tab-dot" />
        </div>
        <div className="sim-editor-actions">
          {simState === 'running' && (
            <div className="sim-running-badge">
              <span className="sim-running-dot" />
              Live
            </div>
          )}
        </div>
      </div>
      <MonacoEditor
        height="100%"
        language={language}
        value={file?.content || ''}
        theme="harvegen-dark"
        onChange={onChange}
        onMount={handleMount}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontLigatures: true,
          lineHeight: 20,
          minimap: { enabled: true, maxColumn: 60 },
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          folding: true,
          renderLineHighlight: 'all',
          smoothScrolling: true,
          cursorBlinking: 'phase',
          cursorSmoothCaretAnimation: 'on',
          wordWrap: 'off',
          tabSize: 2,
          detectIndentation: true,
          readOnly: simState === 'running',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          parameterHints: { enabled: true },
        }}
      />
    </div>
  )
}
