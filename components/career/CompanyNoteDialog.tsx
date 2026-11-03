"use client";

// ============================================================================
// Sahil's Shore: Company Research & Notes Dialog
// Culture, Tech Stack, Interview Process, Questions Asked, and Prep Checklist
// ============================================================================

import React, { useState, useEffect } from "react";
import type { CompanyNote, CreateCompanyNoteInput, PrepChecklistItem } from "@/types/career";
import {
  Building2,
  CheckSquare,
  Plus,
  Trash2,
  Layers,
  HelpCircle,
  X,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateCompanyNoteInput, existingId?: string) => Promise<void>;
  initialNote?: CompanyNote | null;
}

export function CompanyNoteDialog({
  isOpen,
  onClose,
  onSave,
  initialNote,
}: CompanyNoteDialogProps) {
  const [company, setCompany] = useState("");
  const [culture, setCulture] = useState("");
  const [techStackText, setTechStackText] = useState("");
  const [interviewProcess, setInterviewProcess] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [checklist, setChecklist] = useState<PrepChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialNote) {
      setCompany(initialNote.company);
      setCulture(initialNote.culture || "");
      setTechStackText((initialNote.tech_stack || []).join(", "));
      setInterviewProcess(initialNote.interview_process || "");
      setQuestionsText((initialNote.questions_asked || []).join("\n"));
      setChecklist(initialNote.prep_checklist || []);
      setNotes(initialNote.notes || "");
    } else {
      setCompany("");
      setCulture("");
      setTechStackText("");
      setInterviewProcess("");
      setQuestionsText("");
      setChecklist([
        { id: `c_${Date.now()}_1`, text: "Review company engineering blog & tech stack", checked: false },
        { id: `c_${Date.now()}_2`, text: "Prepare 3 thoughtful questions for the engineering manager", checked: false },
        { id: `c_${Date.now()}_3`, text: "Review system design for their primary business domain", checked: false },
      ]);
      setNotes("");
    }
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      {
        id: `c_${Date.now()}`,
        text: newChecklistText.trim(),
        checked: false,
      },
    ]);
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    try {
      setIsSubmitting(true);
      const techStack = techStackText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const questions = questionsText
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean);

      const input: CreateCompanyNoteInput = {
        company: company.trim(),
        culture: culture.trim() || null,
        tech_stack: techStack,
        interview_process: interviewProcess.trim() || null,
        questions_asked: questions,
        prep_checklist: checklist,
        notes: notes.trim() || null,
      };

      await onSave(input, initialNote?.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text">
              {initialNote ? `Edit ${initialNote.company} Notes` : "Add Company Research Notes"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, Uber, Zomato, Razorpay"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Known Tech Stack (comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Java, Spring Boot, PostgreSQL, Kafka, Kubernetes, React, Redis"
              value={techStackText}
              onChange={(e) => setTechStackText(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Culture & Values */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Culture, Core Principles & Engineering Values
            </label>
            <textarea
              rows={2}
              placeholder="e.g. High ownership, fast-paced shipping, blameless postmortems, customer obsession..."
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          {/* Interview Process Rounds */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-primary" />
              <span>Interview Process & Stages</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Round 1: Online Assessment -> Round 2: Tech DSA (Trees/Graphs) -> Round 3: Low-Level Machine Coding -> Round 4: Hiring Manager & Values"
              value={interviewProcess}
              onChange={(e) => setInterviewProcess(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          {/* Questions Asked (one per line) */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              <span>Questions Asked / Known Interview Questions (one per line)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Design an idempotent payment webhook&#10;Implement LRU cache with TTL&#10;Explain optimistic locking in Spring Boot JPA"
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono"
            />
          </div>

          {/* Interactive Prep Checklist */}
          <div className="rounded-xl border border-border/70 p-3.5 space-y-2.5">
            <label className="text-xs font-semibold text-text flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Interview Preparation Checklist</span>
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-muted/50 border border-border/40 text-xs"
                >
                  <span className="text-text truncate flex-1">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-text-muted hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add checklist item (e.g. Read Q3 earnings / blog)..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddChecklistItem} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Additional Notes</label>
            <textarea
              rows={2}
              placeholder="Any other details, salary benchmarks, recruiter names, compensation insights..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !company.trim()}>
              {isSubmitting ? "Saving..." : initialNote ? "Update Notes" : "Save Company Notes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
