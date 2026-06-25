"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Upload, GitCompare, Trash2, Copy, Check } from "lucide-react"

const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false, loading: () => <EditorSkeleton /> }
)

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-[#858585] text-sm font-mono gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-[#858585] animate-pulse" />
      Loading editor…
    </div>
  )
}

const PLACEHOLDER_ORIGINAL = `// Paste your original text here
// Or open a file using the button above

function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("world"));
`

const PLACEHOLDER_MODIFIED = `// Paste your changed text here
// Or open a file using the button above

function greet(name, greeting = "Hello") {
  return \`\${greeting}, \${name}!\`;
}

console.log(greet("world", "Hi"));
console.log(greet("Alice"));
`

export default function DiffChecker() {
  const [original, setOriginal] = useState(PLACEHOLDER_ORIGINAL)
  const [modified, setModified] = useState(PLACEHOLDER_MODIFIED)
  const [copied, setCopied] = useState<"original" | "modified" | null>(null)
  const originalInputRef = useRef<HTMLInputElement>(null)
  const modifiedInputRef = useRef<HTMLInputElement>(null)
  const originalEditorRef = useRef<any>(null)

  const handleFileOpen = useCallback(
    (side: "original" | "modified") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        if (side === "original") {
          setOriginal(text)
          originalEditorRef.current?.setValue(text)
        } else setModified(text)
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    []
  )

  const handleCopy = useCallback(
    (side: "original" | "modified") => async () => {
      const text = side === "original" ? originalEditorRef.current?.getValue() ?? original : modified
      await navigator.clipboard.writeText(text)
      setCopied(side)
      setTimeout(() => setCopied(null), 1500)
    },
    [original, modified]
  )

  const handleClear = useCallback(
    (side: "original" | "modified") => () => {
      if (side === "original") {
        originalEditorRef.current?.setValue("")
        setOriginal("")
      } else setModified("")
    },
    []
  )

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-10 shrink-0 bg-[#323233] border-b border-[#3e3e42]">
        <div className="flex items-center gap-2 text-[#d4d4d4]">
          <GitCompare size={15} className="text-[#4ec9b0]" />
          <span className="text-xs font-semibold tracking-wide uppercase text-[#cccccc]">
            Diff Checker
          </span>
        </div>
        <span className="text-[10px] text-[#858585] font-mono">
          Monaco Editor · VS Code Dark+
        </span>
      </header>

      {/* Panel Labels Bar */}
      <div className="flex shrink-0 bg-[#252526] border-b border-[#3e3e42]">
        {/* Left panel label */}
        <div className="flex-1 flex items-center justify-between px-3 h-9 border-r border-[#3e3e42]">
          <span className="text-[11px] font-semibold text-[#9cdcfe] tracking-wide uppercase">
            Original
          </span>
          <div className="flex items-center gap-1">
            <input
              ref={originalInputRef}
              type="file"
              className="hidden"
              onChange={handleFileOpen("original")}
            />
            <button
              onClick={() => originalInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3e3e42] rounded transition-colors"
            >
              <Upload size={11} />
              Open file
            </button>
            <button
              onClick={handleCopy("original")}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3e3e42] rounded transition-colors"
              title="Copy to clipboard"
            >
              {copied === "original" ? <Check size={11} className="text-[#4ec9b0]" /> : <Copy size={11} />}
            </button>
            <button
              onClick={handleClear("original")}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#858585] hover:text-[#f44747] hover:bg-[#3e3e42] rounded transition-colors"
              title="Clear"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Right panel label */}
        <div className="flex-1 flex items-center justify-between px-3 h-9">
          <span className="text-[11px] font-semibold text-[#ce9178] tracking-wide uppercase">
            Changed
          </span>
          <div className="flex items-center gap-1">
            <input
              ref={modifiedInputRef}
              type="file"
              className="hidden"
              onChange={handleFileOpen("modified")}
            />
            <button
              onClick={() => modifiedInputRef.current?.click()}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3e3e42] rounded transition-colors"
            >
              <Upload size={11} />
              Open file
            </button>
            <button
              onClick={handleCopy("modified")}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3e3e42] rounded transition-colors"
              title="Copy to clipboard"
            >
              {copied === "modified" ? <Check size={11} className="text-[#4ec9b0]" /> : <Copy size={11} />}
            </button>
            <button
              onClick={handleClear("modified")}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[#858585] hover:text-[#f44747] hover:bg-[#3e3e42] rounded transition-colors"
              title="Clear"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Monaco Diff Editor — fills remaining height */}
      <div className="flex-1 min-h-0">
        <DiffEditor
          height="100%"
          theme="vs-dark"
          original={original}
          modified={modified}
          onMount={(editor) => {
            originalEditorRef.current = editor.getOriginalEditor()
            const modifiedModel = editor.getModifiedEditor()
            modifiedModel.onDidChangeModelContent(() => {
              setModified(modifiedModel.getValue())
            })
          }}
          options={{
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'Geist Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            originalEditable: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            lineNumbers: "on",
            wordWrap: "off",
            renderWhitespace: "selection",
            diffWordWrap: "off",
            padding: { top: 8, bottom: 8 },
            renderOverviewRuler: true,
            overviewRulerLanes: 3,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            renderLineHighlight: "line",
            ignoreTrimWhitespace: false,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 h-6 shrink-0 bg-[#007acc] text-white text-[10px] font-mono">
        <span className="flex items-center gap-3">
          <span className="opacity-80">Diff Checker</span>
        </span>
        <span className="flex items-center gap-3 opacity-80">
          <span>UTF-8</span>
          <span>LF</span>
        </span>
      </div>
    </div>
  )
}

