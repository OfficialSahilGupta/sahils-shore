"use client";

// ============================================================================
// Sahil's Shore: Bullet Point Analyzer & Composer Modal
// Real-time Action-Verb checker + Metric / Number recommendation engine
// ============================================================================

import React, { useState, useEffect } from "react";
import type { BulletPoint, CreateBulletInput } from "@/types/career";
import { analyzeBulletPoint } from "@/lib/career";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Tag,
  Wand2,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BulletAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateBulletInput, existingId?: string) => Promise<void>;
  initialBullet?: BulletPoint | null;
}

const SAMPLE_POWER_VERBS = [
  "Architected",
  "Engineered",
  "Optimized",
  "Spearheaded",
  "Reduced",
  "Automated",
  "Scaled",
  "Accelerated",
  "Streamlined",
  "Refactored",
];

const PRESET_CATEGORIES = [
  "Backend & APIs",
  "Frontend & UI",
  "Database & Caching",
  "Performance & Scale",
  "DevOps & Cloud",
  "System Design",
];

export function BulletAnalyzerModal({
  isOpen,
  onClose,
  onSave,
  initialBullet,
}: BulletAnalyzerModalProps) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Backend & APIs");
  const [project, setProject] = useState("");
  const [role, setRole] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialBullet) {
      setContent(initialBullet.content || "");
      setCategory(initialBullet.category || "Backend & APIs");
      setProject(initialBullet.project || "");
      setRole(initialBullet.role || "");
      setSkillsText((initialBullet.skills || []).join(", "));
    } else {
      setContent("");
      setCategory("Backend & APIs");
      setProject("");
      setRole("");
      setSkillsText("");
    }
  }, [initialBullet, isOpen]);

  if (!isOpen) return null;

  const analysis = analyzeBulletPoint(content);

  const handleInsertVerb = (verb: string) => {
    if (!content.trim()) {
      setContent(`${verb} `);
    } else {
      // Replace first word or prepend
      const words = content.trim().split(/\s+/);
      words[0] = verb;
      setContent(words.join(" "));
    }
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const input: CreateBulletInput = {
        content: content.trim(),
        category: category.trim() || null,
        project: project.trim() || null,
        role: role.trim() || null,
        skills,
        metrics: analysis.metricsFound.join(", ") || null,
      };

      await onSave(input, initialBullet?.id);
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
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text">
              {initialBullet ? "Edit Achievement Bullet" : "Achievement Bullet Composer"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text">
                Achievement Bullet Point <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted">
                  {analysis.wordCount} words
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    analysis.strength === "strong"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : analysis.strength === "good"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {analysis.strength === "strong"
                    ? "★ Strong Bullet"
                    : analysis.strength === "good"
                    ? "Good (Can Improve)"
                    : "Needs Metric or Action Verb"}
                </span>
              </div>
            </div>

            <textarea
              rows={3}
              required
              placeholder="e.g. Architected a distributed Kafka event streaming pipeline handling 15k events/sec, reducing end-to-end sync latency by 45% across 4 microservices."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-y"
            />
          </div>

          {/* Quick Power Verb Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-text-muted">
              Quick power verb starters:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_POWER_VERBS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleInsertVerb(v)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Quality Checker Diagnostics Panel */}
          <div className="rounded-xl border border-border/80 bg-surface-muted/30 p-3.5 space-y-2.5">
            <span className="text-xs font-bold text-text flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
              Live Impact Analyzer
            </span>

            {/* Check 1: Action Verb */}
            <div className="flex items-start gap-2 text-xs">
              {analysis.hasActionVerb ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-text">
                  Action Verb:{" "}
                </span>
                {analysis.hasActionVerb ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Strong past-tense power verb detected (<strong>&ldquo;{analysis.actionVerb}&rdquo;</strong>).
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Does not start with an identified power action verb. Avoid weak phrases like &ldquo;Worked on&rdquo; or &ldquo;Helped with&rdquo;.
                  </span>
                )}
              </div>
            </div>

            {/* Check 2: Metric / Number */}
            <div className="flex items-start gap-2 text-xs">
              {analysis.hasMetric ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold text-text">
                  Quantifiable Metric:{" "}
                </span>
                {analysis.hasMetric ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Measurable impact found:{" "}
                    <strong>{analysis.metricsFound.join(", ")}</strong>.
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Add a number to this bullet (e.g. latency reduced by 40%, supported 10k users, saved 5 hrs/week).
                  </span>
                )}
              </div>
            </div>

            {/* Recommendations / Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="pt-2 border-t border-border/50 text-[11px] text-text-muted space-y-1">
                {analysis.suggestions.map((s, idx) => (
                  <p key={idx} className="flex items-center gap-1.5">
                    <span className="text-primary font-bold">›</span> {s}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Metadata: Category, Project, Role */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PRESET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Project / System</label>
              <input
                type="text"
                placeholder="e.g. Order Processing Engine"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Role / Context</label>
              <input
                type="text"
                placeholder="e.g. Backend Lead"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Skills Tags */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Skills Tagged (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Java, Spring Boot, Kafka, Redis, PostgreSQL"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Bullet"}</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
                {isSubmitting ? "Saving..." : initialBullet ? "Update Bullet" : "Save to Bank"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
