"use client";

// ============================================================================
// Sahil's Shore: Add Topic to Roadmap Modal
// ============================================================================

import React, { useState, useEffect } from "react";
import { X, Plus, BookOpen } from "lucide-react";
import { Select } from "@/components/ui/select";

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  onAddTopic: (input: {
    topic: string;
    category: string;
    notes?: string;
    status: "planned" | "in_progress" | "completed";
  }) => Promise<void>;
}

export function AddTopicModal({
  isOpen,
  onClose,
  trackTitle,
  onAddTopic,
}: AddTopicModalProps) {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Core Principles");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"planned" | "in_progress" | "completed">("planned");
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage("Please enter a topic title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onAddTopic({
        topic: topic.trim(),
        category: category.trim() || "Core",
        notes: notes.trim() || undefined,
        status,
      });
      onClose();
    } catch (err: any) {
      console.error("Error adding roadmap topic:", err);
      setErrorMessage(err?.message || "Failed to add topic.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Add Topic to Roadmap
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

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Topic Title *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Kafka Consumer Groups & Partition Rebalancing"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Messaging, Security"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Initial Status
              </label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                options={[
                  { value: "planned", label: "Planned (To Learn)" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Mastered" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Initial Notes or Key Question (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document the mental model or problem this topic solves..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1 rounded-xl bg-[var(--primary)] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Adding..." : "Add Topic"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
