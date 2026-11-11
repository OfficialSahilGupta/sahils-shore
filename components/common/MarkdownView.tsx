"use client";

// ============================================================================
// Sahil's Shore: MarkdownView Component
// Clean, theme-aware, zero-dependency Markdown renderer for engineering notes,
// architecture trade-offs, code blocks, checklists, and interview guides.
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized colors, and WCAG AA contrast.
// ============================================================================

import React, { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Code2,
  CheckCircle2,
  Circle,
  Quote,
  Table as TableIcon,
  FileText,
} from "lucide-react";

interface MarkdownViewProps {
  content?: string | null;
  className?: string;
  compact?: boolean;
}

// ----------------------------------------------------------------------------
// Inline Formatter: parses bold, italic, inline code, links, and strikethroughs
// ----------------------------------------------------------------------------
function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Token regex for inline styles:
  // 1: links [text](url)
  // 2: inline code `code`
  // 3: bold-italic ***text***
  // 4: bold **text**
  // 5: italic *text*
  // 6: strikethrough ~~text~~
  const tokenRegex =
    /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={`link-${idx}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--primary)] hover:underline inline-flex items-center gap-0.5 font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="h-2.5 w-2.5 inline shrink-0" />
        </a>
      );
    }

    // Inline code: `code`
    const codeMatch = part.match(/^`([^`]+)`$/);
    if (codeMatch) {
      return (
        <code
          key={`code-${idx}`}
          className="rounded-md bg-[var(--surface-muted)]/80 px-1.5 py-0.5 font-mono text-[11px] text-[var(--primary)] border border-[var(--border)] font-semibold"
        >
          {codeMatch[1]}
        </code>
      );
    }

    // Bold + Italic: ***text***
    const boldItalicMatch = part.match(/^\*\*\*([^*]+)\*\*\*$/);
    if (boldItalicMatch) {
      return (
        <strong key={`bi-${idx}`} className="font-bold italic text-[var(--text)]">
          {boldItalicMatch[1]}
        </strong>
      );
    }

    // Bold: **text**
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={`bold-${idx}`} className="font-bold text-[var(--text)]">
          {boldMatch[1]}
        </strong>
      );
    }

    // Italic: *text*
    const italicMatch = part.match(/^\*([^*]+)\*$/);
    if (italicMatch) {
      return (
        <em key={`italic-${idx}`} className="italic text-[var(--text)]">
          {italicMatch[1]}
        </em>
      );
    }

    // Strikethrough: ~~text~~
    const strikeMatch = part.match(/^~~([^~]+)~~$/);
    if (strikeMatch) {
      return (
        <del key={`strike-${idx}`} className="line-through text-[var(--text-muted)]">
          {strikeMatch[1]}
        </del>
      );
    }

    return <React.Fragment key={`text-${idx}`}>{part}</React.Fragment>;
  });
}

// ----------------------------------------------------------------------------
// Code Block with 1-click Copy & Language Tag
// ----------------------------------------------------------------------------
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const cleanLang = (language || "code").trim().toUpperCase();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 overflow-hidden my-3 shadow-2xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]/70 bg-[var(--surface-muted)]/50">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[var(--primary)]">
          <Code2 className="h-3 w-3" />
          <span>{cleanLang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[var(--success)]" />
              <span className="text-[var(--success)] font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono leading-relaxed overflow-x-auto text-[var(--text)] scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Table Renderer
// ----------------------------------------------------------------------------
function MarkdownTable({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  const headerCells = rows[0]
    .split("|")
    .map((c) => c.trim())
    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

  // Filter out divider line (e.g. |---|---|)
  const bodyRows = rows.slice(1).filter((r) => !r.match(/^\|?(\s*:?-+:?\s*\|)+\s*$/));

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]/50">
            {headerCells.map((header, idx) => (
              <th
                key={idx}
                className="px-3.5 py-2 font-bold text-[var(--text)] text-[11px] uppercase tracking-wider"
              >
                {renderInline(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]/60">
          {bodyRows.map((row, rIdx) => {
            const cells = row
              .split("|")
              .map((c) => c.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            return (
              <tr
                key={rIdx}
                className="hover:bg-[var(--surface-muted)]/20 transition-colors"
              >
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 text-[var(--text)] leading-relaxed">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main MarkdownView Component
// ----------------------------------------------------------------------------
export function MarkdownView({ content, className = "", compact = false }: MarkdownViewProps) {
  if (!content || !content.trim()) {
    return (
      <div className={`text-xs text-[var(--text-muted)] italic py-1 ${className}`}>
        No notes or architecture details documented yet.
      </div>
    );
  }

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = "";

  let inTable = false;
  let tableBuffer: string[] = [];

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      elements.push(
        <CodeBlock
          key={`code-block-${elements.length}`}
          code={codeBuffer.join("\n")}
          language={codeLanguage}
        />
      );
      codeBuffer = [];
      codeLanguage = "";
      inCodeBlock = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableBuffer.length > 0) {
      elements.push(
        <MarkdownTable key={`table-${elements.length}`} rows={[...tableBuffer]} />
      );
      tableBuffer = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Fenced Code Block delimiters
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushTable();
        inCodeBlock = true;
        codeLanguage = trimmed.slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Table lines (starts and ends with | or contains |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushCodeBlock();
      inTable = true;
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 3. Empty lines / Spacing
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // 4. Horizontal Rules: ---, ***, ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${i}`} className="my-3 border-[var(--border)]" />
      );
      continue;
    }

    // 5. Headings: #, ##, ###, ####
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-base sm:text-lg font-bold text-[var(--text)] pb-1.5 border-b border-[var(--border)] mt-3 mb-1.5 tracking-tight"
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-sm sm:text-base font-bold text-[var(--text)] pb-1 border-b border-[var(--border)]/60 mt-2.5 mb-1 tracking-tight"
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xs sm:text-sm font-bold text-[var(--text)] mt-2 mb-1 flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          <span>{renderInline(trimmed.slice(4))}</span>
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1.5 mb-0.5"
        >
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // 6. Blockquote / Callout: > note
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/, "");
      elements.push(
        <div
          key={`quote-${i}`}
          className="my-2 rounded-xl border-l-4 border-[var(--primary)] bg-[var(--primary)]/5 p-3 text-xs text-[var(--text)] flex items-start gap-2.5 shadow-2xs"
        >
          <Quote className="h-4 w-4 text-[var(--primary)] shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed font-sans">{renderInline(quoteText)}</div>
        </div>
      );
      continue;
    }

    // 7. Task list item: - [ ] or - [x]
    const taskMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.*)$/);
    if (taskMatch) {
      const isChecked = taskMatch[1].toLowerCase() === "x";
      const itemText = taskMatch[2];
      elements.push(
        <div
          key={`task-${i}`}
          className="flex items-start gap-2 text-xs py-0.5 my-0.5 font-sans"
        >
          <div className="mt-0.5 shrink-0">
            {isChecked ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            )}
          </div>
          <span
            className={`flex-1 leading-relaxed ${
              isChecked ? "line-through text-[var(--text-muted)]" : "text-[var(--text)]"
            }`}
          >
            {renderInline(itemText)}
          </span>
        </div>
      );
      continue;
    }

    // 8. Unordered list: - or *
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div
          key={`bullet-${i}`}
          className="flex items-start gap-2 text-xs py-0.5 my-0.5 pl-1.5 font-sans"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
          <span className="flex-1 text-[var(--text)] leading-relaxed">
            {renderInline(bulletMatch[1])}
          </span>
        </div>
      );
      continue;
    }

    // 9. Ordered list: 1. 2. 3.
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      elements.push(
        <div
          key={`ord-${i}`}
          className="flex items-start gap-2 text-xs py-0.5 my-0.5 pl-1 font-sans"
        >
          <span className="font-mono font-bold text-[10px] text-[var(--text-muted)] shrink-0 mt-0.5 min-w-[16px]">
            {orderedMatch[1]}.
          </span>
          <span className="flex-1 text-[var(--text)] leading-relaxed">
            {renderInline(orderedMatch[2])}
          </span>
        </div>
      );
      continue;
    }

    // 10. Standard Paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className={`text-xs text-[var(--text)] leading-relaxed font-sans ${
          compact ? "my-0.5" : "my-1"
        }`}
      >
        {renderInline(trimmed)}
      </p>
    );
  }

  // Ensure trailing code block or table is flushed
  if (inCodeBlock) flushCodeBlock();
  if (inTable) flushTable();

  return (
    <div
      className={`w-full prose-invert max-w-none text-xs text-[var(--text)] space-y-1 ${className}`}
    >
      {elements}
    </div>
  );
}
