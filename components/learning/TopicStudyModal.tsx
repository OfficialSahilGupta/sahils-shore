"use client";

// ============================================================================
// Sahil's Shore: Topic Study & Engineering Notes Workspace Modal
// Deep-dive topic study environment with rich markdown architecture notes,
// code snippets, gotchas, interview insights, and attached documentation links.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Code2,
  ExternalLink,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Circle,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Layers,
  Link as LinkIcon,
  Plus,
  Trash2,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { CodeEditor } from "../dsa/CodeEditor";

interface TopicStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LearningItem | null;
  trackTitle: string;
  onSave: (
    itemId: string,
    updates: {
      topic?: string;
      category?: string | null;
      status?: "planned" | "in_progress" | "completed";
      notes?: string | null;
      resources?: Json;
    }
  ) => Promise<void>;
  onDeleteTopic?: (itemId: string) => Promise<void>;
}

export function TopicStudyModal({
  isOpen,
  onClose,
  item,
  trackTitle,
  onSave,
  onDeleteTopic,
}: TopicStudyModalProps) {
  const [topicTitle, setTopicTitle] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");
  const [notes, setNotes] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("java");
  const [resourceUrls, setResourceUrls] = useState<Array<{ title: string; url: string }>>([]);
  const [newUrlTitle, setNewUrlTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "code" | "resources">("notes");

  useEffect(() => {
    if (item) {
      setTopicTitle(item.topic || "");
      setCategory(item.category || "General");
      setStatus(item.status || "planned");
      setNotes(item.notes || "");

      // Parse resources JSON if it contains code or custom links
      let parsedLinks: Array<{ title: string; url: string }> = [];
      let parsedSnippet = "";
      let parsedLang = "java";

      if (Array.isArray(item.resources)) {
        item.resources.forEach((r: any) => {
          if (r && r.url) {
            parsedLinks.push({ title: r.title || r.category || "Docs", url: r.url });
          } else if (r && r.code_snippet) {
            parsedSnippet = r.code_snippet;
            parsedLang = r.language || "java";
          }
        });
      }
      setResourceUrls(parsedLinks);
      setCodeSnippet(parsedSnippet);
      setCodeLanguage(parsedLang);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const insertTemplate = (template: string) => {
    setNotes((prev) => (prev ? `${prev.trim()}\n\n${template}` : template));
  };

  const handleAddLink = () => {
    if (!newUrl.trim()) return;
    const itemToAdd = {
      title: newUrlTitle.trim() || "Documentation",
      url: newUrl.trim().startsWith("http") ? newUrl.trim() : `https://${newUrl.trim()}`,
    };
    setResourceUrls((prev) => [...prev, itemToAdd]);
    setNewUrlTitle("");
    setNewUrl("");
  };

  const handleRemoveLink = (index: number) => {
    setResourceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCopyCode = async () => {
    if (!codeSnippet) return;
    try {
      await navigator.clipboard.writeText(codeSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn("Failed to copy code snippet:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Pack resources JSON with links and code
      const packedResources: any[] = [...resourceUrls];
      if (codeSnippet.trim()) {
        packedResources.push({
          code_snippet: codeSnippet.trim(),
          language: codeLanguage,
        });
      }

      await onSave(item.id, {
        topic: topicTitle.trim(),
        category: category.trim() || null,
        status,
        notes: notes.trim() || null,
        resources: packedResources as unknown as Json,
      });

      onClose();
    } catch (err) {
      console.error("Error saving topic study notes:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl transition-all flex flex-col ${
          isFullscreen
            ? "max-w-[98vw] h-[95vh] overflow-y-auto"
            : "max-w-5xl max-h-[92vh] overflow-y-auto"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                  {topicTitle || "Topic Study Workspace"}
                </h2>
                <span className="rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] shrink-0">
                  {trackTitle}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">
                Architecture mental model, implementation code, edge cases, and documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors hidden sm:flex"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status & Category Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3 shrink-0">
          <div className="sm:col-span-6 flex flex-col justify-center">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Topic Name & Category
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] font-semibold focus:border-[var(--primary)] focus:outline-none"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-32 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Mastery Status Selector */}
          <div className="sm:col-span-6 flex flex-col justify-center">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Mastery Stage
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setStatus("planned")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
                  status === "planned"
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Circle className="h-3.5 w-3.5" />
                <span>Planned</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("in_progress")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
                  status === "in_progress"
                    ? "bg-[var(--warning)]/15 border border-[var(--warning)]/30 text-[var(--warning)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>In Progress</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus("completed")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold transition-all ${
                  status === "completed"
                    ? "bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mastered</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher on mobile/desktop */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "notes"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Architecture & Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "code"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code Implementation</span>
            {codeSnippet.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "resources"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]/50"
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Doc & Resource Links ({resourceUrls.length})</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
          {/* Tab 1: Architecture Notes */}
          {activeTab === "notes" && (
            <div className="flex-1 flex flex-col space-y-2.5 min-h-[300px]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Deep-Dive Engineering Notes</span>
                </span>

                {/* Quick Template Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplate(
                        "### Core Architecture & Invariant\n- Principle: \n- Why this design is chosen: \n- Trade-offs considered: "
                      )
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    + Architecture
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplate(
                        "### Concurrency & Performance Gotchas\n- Deadlocks / Race conditions:\n- Memory leak / connection leak hazards:\n- Caching invalidation subtleties:"
                      )
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    + Gotchas
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplate(
                        "### Staff Engineer Interview Summary\n- 2-Sentence Pitch:\n- Failure Modes to Discuss:\n- Production Monitoring Metrics (RED/USE):"
                      )
                    }
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/30 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
                  >
                    + Interview Summary
                  </button>
                </div>
              </div>

              <textarea
                rows={14}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your comprehensive technical notes, design patterns, failure modes, and code walkthroughs here..."
                className="w-full flex-1 min-h-[280px] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3.5 text-xs text-[var(--text)] font-sans leading-relaxed placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Tab 2: Code Implementation */}
          {activeTab === "code" && (
            <div className="flex-1 flex flex-col space-y-2.5 min-h-[300px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                  <span>Hands-on Code Implementation</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!codeSnippet}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40"
                  >
                    {copiedCode ? (
                      <Check className="h-3 w-3 text-[var(--success)]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>

                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value="java">Java</option>
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 min-h-[280px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <CodeEditor
                  value={codeSnippet}
                  onChange={(val) => setCodeSnippet(val)}
                  language={codeLanguage as any}
                  minHeight="280px"
                  maxHeight={isFullscreen ? "65vh" : "380px"}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Resource Links */}
          {activeTab === "resources" && (
            <div className="flex-1 flex flex-col space-y-3 min-h-[300px]">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5 text-[var(--primary)]" />
                <span>Reference Links & Official Documentation</span>
              </span>

              {/* Add New Link Row */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={newUrlTitle}
                  onChange={(e) => setNewUrlTitle(e.target.value)}
                  placeholder="Link Title (e.g. Spring Docs, RFC 7519)"
                  className="w-full sm:w-1/3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full sm:flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="w-full sm:w-auto flex items-center justify-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Link</span>
                </button>
              </div>

              {/* Links List */}
              <div className="space-y-2 pt-2">
                {resourceUrls.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic text-center py-6">
                    No reference links attached yet. Add official docs, deep-dive articles, or repos above.
                  </p>
                ) : (
                  resourceUrls.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ExternalLink className="h-3.5 w-3.5 text-[var(--primary)] shrink-0" />
                        <span className="font-semibold text-[var(--text)] truncate">
                          {r.title}
                        </span>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--primary)] truncate underline"
                        >
                          {r.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(i)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1"
                        title="Remove link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 shrink-0">
            {onDeleteTopic ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete topic "${item.topic}" from this roadmap?`)) {
                    onDeleteTopic(item.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/10 px-3 py-2 text-xs font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Topic</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save Notes & Progress"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
