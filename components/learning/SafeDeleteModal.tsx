"use client";

// ============================================================================
// Sahil's Shore: Safe Deletion Confirmation Modal
// Prevents accidental one-click deletions of learning tracks, topics,
// sub-topics, projects, and concepts with explicit impact warnings.
// ============================================================================

import React, { useState, useEffect } from "react";
import { AlertTriangle, Trash2, X, ShieldAlert } from "lucide-react";

interface SafeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  itemName: string;
  itemType: "track" | "topic" | "sub-topic" | "project" | "concept" | "question";
  warningText?: string;
  requireTyping?: boolean;
}

export function SafeDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  warningText,
  requireTyping = false,
}: SafeDeleteModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      setTypedConfirmation("");
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled =
    requireTyping && typedConfirmation.trim().toLowerCase() !== "delete";

  const handleConfirm = async () => {
    if (isConfirmDisabled || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("[SafeDeleteModal] Deletion error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getScopeDescription = () => {
    switch (itemType) {
      case "track":
        return "This will permanently remove this learning track, including all roadmap topics, sub-topics, architecture notes, code snippets, and study history.";
      case "topic":
        return "This will permanently delete this curriculum topic, its sub-topics, architecture notes, and code implementations.";
      case "sub-topic":
        return "This will delete this specific sub-topic and all its notes, code snippets, and resource links.";
      case "project":
        return "This will remove this project showcase from your track portfolio.";
      case "concept":
        return "This will remove this breakthrough concept from your learning log.";
      case "question":
        return "This will remove this technical interview question from your practice bank.";
      default:
        return "This action cannot be undone.";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--danger)]/30 bg-[var(--surface)] p-5 sm:p-6 shadow-2xl transition-all space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">{title}</h3>
              <p className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[240px]">
                {itemName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--danger)]">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Permanent Deletion Warning</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {warningText || getScopeDescription()}
          </p>
        </div>

        {/* Type "DELETE" requirement for high-impact entities */}
        {requireTyping && (
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-[var(--text)]">
              Type <span className="font-mono text-[var(--danger)] font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3 py-1.5 text-xs text-[var(--text)] font-mono focus:border-[var(--danger)] focus:outline-none"
              autoFocus
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--danger)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
