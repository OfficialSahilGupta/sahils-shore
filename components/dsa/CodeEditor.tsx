"use client";

// ============================================================================
// Sahil's Shore: CodeEditor Component
// CodeMirror editor supporting Java, JavaScript, TypeScript, and Python
// ============================================================================

import React, { useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { Check, Copy } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange?: (val: string) => void;
  language?: string;
  readOnly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "java",
  readOnly = false,
  minHeight = "200px",
  maxHeight = "500px",
  className = "",
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const extensions = useMemo(() => {
    const lang = (language || "java").toLowerCase();
    switch (lang) {
      case "javascript":
      case "js":
        return [javascript({ jsx: true })];
      case "typescript":
      case "ts":
        return [javascript({ jsx: true, typescript: true })];
      case "python":
      case "py":
        return [python()];
      case "java":
      default:
        return [java()];
    }
  }, [language]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[var(--surface-muted)] bg-[var(--surface)] text-[var(--text)] transition-colors focus-within:border-[var(--primary)] ${className}`}
    >
      {/* Top Bar for Copy & Language indicator */}
      <div className="flex items-center justify-between border-b border-[var(--surface-muted)] bg-[var(--surface-muted)]/40 px-3 py-1.5 text-xs font-mono text-[var(--text-muted)]">
        <span className="uppercase tracking-wider font-semibold">
          {language || "code"}
        </span>
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs hover:bg-[var(--surface-muted)] transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                <span className="text-[var(--success)]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>

      <CodeMirror
        value={value}
        height={minHeight}
        minHeight={minHeight}
        maxHeight={maxHeight}
        extensions={extensions}
        editable={!readOnly}
        readOnly={readOnly}
        onChange={onChange}
        theme="dark"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          autocompletion: !readOnly,
        }}
        className="text-sm font-mono"
      />
    </div>
  );
}
