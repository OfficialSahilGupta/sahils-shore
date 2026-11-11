"use client";

// ============================================================================
// Sahil's Shore: Edit Topic Modal
// Edit previous roadmap topics (title, category, status, overview architecture notes)
// with direct link to deep study workspace, zero emojis, custom selects,
// and full-screen ModalPortal backdrop blur.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Edit3,
  BookOpen,
  Sparkles,
  Save,
  Trash2,
  ExternalLink,
  Code2,
} from "lucide-react";
import type { LearningItem, Json } from "@/types";
import { Select } from "@/components/ui/select";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  parseTopicSubSections,
  packTopicSubSections,
} from "@/lib/learning";

interface EditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LearningItem | null;
  trackTitle: string;
  totalTopics?: number;
  currentPosition?: number;
  onSave: (
    itemId: string,
    updates: {
      topic?: string;
      category?: string | null;
      status?: "planned" | "in_progress" | "completed";
      notes?: string | null;
      resources?: Json;
      targetPosition?: number;
    }
  ) => Promise<void>;
  onOpenStudyWorkspace?: (item: LearningItem) => void;
  onDeleteTopic?: (itemId: string) => void;
}

const COMMON_CATEGORIES = [
  "Core Principles",
  "Language Basics",
  "Core Java",
  "Spring Framework",
  "Web Services",
  "Persistence & Database",
  "Security",
  "Microservices",
  "Distributed Systems",
  "DevOps & Tooling",
  "Quality Assurance",
  "Frontend Architecture",
];

export function EditTopicModal({
  isOpen,
  onClose,
  item,
  trackTitle,
  totalTopics = 1,
  currentPosition = 1,
  onSave,
  onOpenStudyWorkspace,
  onDeleteTopic,
}: EditTopicModalProps) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Core Principles");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");
  const [selectedPosition, setSelectedPosition] = useState<number>(currentPosition || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Background scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Hydrate form with topic item values
  useEffect(() => {
    if (item && isOpen) {
      setTopic(item.topic || "");
      const itemCat =
        item.category ||
        (Array.isArray(item.resources) && (item.resources[0] as { category?: string })?.category) ||
        "Core Principles";
      setCategory(itemCat);
      setStatus(item.status || "planned");
      setSelectedPosition(currentPosition || 1);

      // Extract overview notes from subsections or legacy notes
      const subSections = parseTopicSubSections(item);
      const overviewNote =
        subSections[0]?.notes || item.notes || "";
      setNotes(overviewNote);
      setErrorMessage(null);
    }
  }, [item, isOpen, currentPosition]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage("Topic title cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const trimmedTopic = topic.trim();
      const trimmedCategory = category.trim() || "Core";

      // Parse existing sub-sections and update the primary overview note
      const subSections = parseTopicSubSections(item);
      if (subSections.length > 0) {
        subSections[0].notes = notes.trim();
      } else {
        subSections.push({
          id: `sub-init-${Date.now()}`,
          title: "Overview & Core Architecture",
          notes: notes.trim(),
          codeSnippet: "",
          codeLanguage: "java",
          resources: [],
          isCompleted: status === "completed",
        });
      }

      // Pack updated sections preserving all code snippets & links
      const { notes: synthesizedNotes, resources: packedResources } =
        packTopicSubSections(subSections, trimmedCategory);

      await onSave(item.id, {
        topic: trimmedTopic,
        category: trimmedCategory,
        status,
        notes: synthesizedNotes || null,
        resources: packedResources,
        targetPosition: selectedPosition !== currentPosition ? selectedPosition : undefined,
      });

      onClose();
    } catch (err: any) {
      console.error("Error editing topic:", err);
      setErrorMessage(err?.message || "Failed to update topic.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)]">
                  Edit Curriculum Topic
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {trackTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="mb-3 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-2.5 text-xs text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Topic Title */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Topic Title *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Core Java, JPA / Hibernate & Spring Data JPA"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            {/* Category and Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Core Java, Security"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Learning Status
                </label>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  options={[
                    { value: "planned", label: "Planned (To Learn)" },
                    { value: "in_progress", label: "In Progress (Studying)" },
                    { value: "completed", label: "Mastered (Completed)" },
                  ]}
                />
              </div>
            </div>

            {/* Curriculum Position & Order */}
            {totalTopics > 1 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/15 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text)]">
                    Curriculum Position & Order
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    Currently #{currentPosition} of {totalTopics}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={String(selectedPosition)}
                      onChange={(e) => setSelectedPosition(Number(e.target.value))}
                      options={Array.from({ length: totalTopics }, (_, i) => ({
                        value: String(i + 1),
                        label:
                          i === 0
                            ? `Position #1 (Top of Curriculum — shifts others down)`
                            : i === totalTopics - 1
                              ? `Position #${i + 1} (End of Curriculum)`
                              : `Position #${i + 1}`,
                      }))}
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPosition(1)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        selectedPosition === 1
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      }`}
                      title="Set to Position #1"
                    >
                      Top (#1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPosition(totalTopics)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        selectedPosition === totalTopics
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]"
                      }`}
                      title={`Set to Position #${totalTopics}`}
                    >
                      Bottom
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Changing position shifts other topics automatically to accommodate this order.
                </p>
              </div>
            )}

            {/* Quick Category Chips */}
            <div>
              <span className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
                Suggested Categories:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-all ${
                      category === cat
                        ? "bg-[var(--primary)] text-white shadow-2xs"
                        : "bg-[var(--surface-muted)]/70 text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Architecture Overview Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  Architecture Overview & Key Notes
                </label>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  Markdown supported
                </span>
              </div>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="High-level engineering takeaways, JVM internals, design tradeoffs..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-y font-sans"
              />
            </div>

            {/* Link to Deep Study Workspace */}
            {onOpenStudyWorkspace && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[var(--primary)] shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-[var(--text)]">
                      Need deeper editing?
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Add sub-sections, CodeMirror syntax blocks, or documentation links.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStudyWorkspace(item);
                  }}
                  className="flex items-center gap-1 rounded-xl bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/10 transition-colors shrink-0"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Open Workspace</span>
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              {onDeleteTopic ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteTopic(item.id);
                  }}
                  className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Topic</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !topic.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
