"use client";

// ============================================================================
// Sahil's Shore: Daily Reflection View
// Mood, Energy, 3 Gratitudes, Wins, Lessons, Free Write & Timeline Auto-fill
// ============================================================================

import React, { useState, useEffect } from "react";
import type { JournalEntry, SaveJournalInput } from "@/lib/journal";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import {
  Smile,
  Zap,
  Heart,
  Trophy,
  Lightbulb,
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  Edit3,
  Calendar,
  Frown,
  Meh,
  Laugh,
  Sun,
  BatteryLow,
  BatteryMedium,
  Battery,
  Flame,
} from "lucide-react";

interface DailyReflectionViewProps {
  currentDate: string;
  entry: JournalEntry | null;
  onSave: (input: SaveJournalInput) => Promise<boolean>;
  onPullTimelineSummary: (date: string) => Promise<string>;
}

const MOOD_OPTIONS = [
  { val: 1, icon: Frown, label: "Rough", color: "text-rose-500" },
  { val: 2, icon: Meh, label: "Meh", color: "text-amber-500" },
  { val: 3, icon: Smile, label: "Good", color: "text-blue-500" },
  { val: 4, icon: Laugh, label: "Great", color: "text-emerald-500" },
  { val: 5, icon: Sun, label: "Wonderful", color: "text-yellow-500" },
];

const ENERGY_OPTIONS = [
  { val: 1, icon: BatteryLow, label: "Drained", color: "text-rose-500" },
  { val: 2, icon: BatteryMedium, label: "Low", color: "text-amber-500" },
  { val: 3, icon: Battery, label: "Balanced", color: "text-blue-500" },
  { val: 4, icon: Zap, label: "High", color: "text-emerald-500" },
  { val: 5, icon: Flame, label: "Peak", color: "text-amber-500" },
];

export function DailyReflectionView({
  currentDate,
  entry,
  onSave,
  onPullTimelineSummary,
}: DailyReflectionViewProps) {
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(entry?.energy ?? null);
  const [gratitude, setGratitude] = useState<string[]>([
    entry?.gratitude?.[0] || "",
    entry?.gratitude?.[1] || "",
    entry?.gratitude?.[2] || "",
  ]);
  const [wins, setWins] = useState<string[]>(entry?.wins?.length ? entry.wins : [""]);
  const [lessons, setLessons] = useState<string[]>(entry?.lessons?.length ? entry.lessons : [""]);
  const [content, setContent] = useState<string>(entry?.content || "");
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState<string>("");
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isPullingTimeline, setIsPullingTimeline] = useState<boolean>(false);

  // Sync state whenever entry or date changes
  useEffect(() => {
    setMood(entry?.mood ?? null);
    setEnergy(entry?.energy ?? null);
    setGratitude([
      entry?.gratitude?.[0] || "",
      entry?.gratitude?.[1] || "",
      entry?.gratitude?.[2] || "",
    ]);
    setWins(entry?.wins?.length ? entry.wins : [""]);
    setLessons(entry?.lessons?.length ? entry.lessons : [""]);
    setContent(entry?.content || "");
    setTags(entry?.tags || []);
  }, [entry, currentDate]);

  const handleSave = async () => {
    setIsSaving(true);
    const cleanedGratitude = gratitude.map((g) => g.trim()).filter(Boolean);
    const cleanedWins = wins.map((w) => w.trim()).filter(Boolean);
    const cleanedLessons = lessons.map((l) => l.trim()).filter(Boolean);

    const success = await onSave({
      entry_date: currentDate,
      mood,
      energy,
      gratitude: cleanedGratitude,
      wins: cleanedWins,
      lessons: cleanedLessons,
      content,
      tags,
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleAutoFillTimeline = async () => {
    setIsPullingTimeline(true);
    try {
      const summary = await onPullTimelineSummary(currentDate);
      if (summary) {
        setContent((prev) => (prev ? `${summary}\n\n${prev}` : summary));
      }
    } finally {
      setIsPullingTimeline(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, "");
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Calendar className="h-3.5 w-3.5" />
            <span>Daily Reflection</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            {formatFriendlyISTDate(currentDate)}
          </h2>
          <p className="text-xs text-text-muted">
            Pause, check in with yourself, and capture the day&apos;s highlights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoFillTimeline}
            disabled={isPullingTimeline}
            className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 active:scale-95 disabled:opacity-50 transition-all"
            title="Auto-fill summary of tasks, study, expenses from today's timeline"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isPullingTimeline ? "Pulling..." : "Timeline Summary"}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Entry"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mood & Energy Sliders */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Mood Card */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-text">
              <Smile className="h-4 w-4 text-primary" />
              <span>How are you feeling today? (Mood)</span>
            </span>
            {mood && (
              <span className="text-xs font-bold text-primary">
                {mood} / 5 • {MOOD_OPTIONS.find((o) => o.val === mood)?.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {MOOD_OPTIONS.map((opt) => {
              const isSelected = mood === opt.val;
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setMood(opt.val)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs scale-105"
                      : "border-border bg-surface-muted/30 hover:bg-surface-muted/70 opacity-80"
                  }`}
                >
                  <IconComp className={`h-6 w-6 ${isSelected ? "text-primary" : opt.color}`} />
                  <span className={`text-[10px] mt-1 font-medium ${isSelected ? "text-primary font-bold" : "text-text-muted"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy Card */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-text">
              <Zap className="h-4 w-4 text-accent-warm" />
              <span>Physical & Mental Energy</span>
            </span>
            {energy && (
              <span className="text-xs font-bold text-accent-warm">
                {energy} / 5 • {ENERGY_OPTIONS.find((o) => o.val === energy)?.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {ENERGY_OPTIONS.map((opt) => {
              const isSelected = energy === opt.val;
              const IconComp = opt.icon;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setEnergy(opt.val)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all ${
                    isSelected
                      ? "border-accent-warm bg-accent-warm/10 shadow-xs scale-105"
                      : "border-border bg-surface-muted/30 hover:bg-surface-muted/70 opacity-80"
                  }`}
                >
                  <IconComp className={`h-6 w-6 ${isSelected ? "text-accent-warm" : opt.color}`} />
                  <span className={`text-[10px] mt-1 font-medium ${isSelected ? "text-accent-warm font-bold" : "text-text-muted"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 Things I'm Grateful For */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500" />
          <h3 className="text-xs font-semibold text-text">
            Three Things I&apos;m Grateful For Today
          </h3>
        </div>
        <div className="space-y-2">
          {["What made you smile or feel calm?", "A person, conversation, or connection", "A small luxury, meal, or moment"].map(
            (placeholder, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-xs font-bold text-rose-500">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={gratitude[idx] || ""}
                  onChange={(e) => {
                    const next = [...gratitude];
                    next[idx] = e.target.value;
                    setGratitude(next);
                  }}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-border bg-surface-muted/30 px-3 py-2 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-rose-400 focus:bg-surface transition-all"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Wins & Lessons Dual Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Wins */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-text">
              <Trophy className="h-4 w-4 text-emerald-500" />
              <span>Today&apos;s Wins &amp; Accomplishments</span>
            </span>
            <button
              type="button"
              onClick={() => setWins([...wins, ""])}
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {wins.map((win, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={win}
                  onChange={(e) => {
                    const next = [...wins];
                    next[idx] = e.target.value;
                    setWins(next);
                  }}
                  placeholder="e.g. Solved 3 graph problems, shipped feature..."
                  className="w-full rounded-xl border border-border bg-surface-muted/30 px-3 py-2 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-emerald-500 focus:bg-surface"
                />
                {wins.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setWins(wins.filter((_, i) => i !== idx))}
                    className="p-1 text-text-muted hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lessons */}
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold text-text">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>Lessons & What Could Improve</span>
            </span>
            <button
              type="button"
              onClick={() => setLessons([...lessons, ""])}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-700"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="space-y-2">
            {lessons.map((lesson, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={lesson}
                  onChange={(e) => {
                    const next = [...lessons];
                    next[idx] = e.target.value;
                    setLessons(next);
                  }}
                  placeholder="e.g. Don't check phone before noon, take breaks..."
                  className="w-full rounded-xl border border-border bg-surface-muted/30 px-3 py-2 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-amber-500 focus:bg-surface"
                />
                {lessons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLessons(lessons.filter((_, i) => i !== idx))}
                    className="p-1 text-text-muted hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Free Write Markdown Editor */}
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold text-text">
              Free Write & Thoughts (Markdown)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1 rounded-lg border border-border bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-text-muted hover:text-text"
          >
            {previewMode ? (
              <>
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </>
            )}
          </button>
        </div>

        {previewMode ? (
          <div className="min-h-[160px] rounded-2xl border border-border/80 bg-surface-muted/20 p-4 text-xs text-text leading-relaxed whitespace-pre-wrap font-sans">
            {content ? content : <span className="text-text-muted italic">Nothing written yet. Click &apos;Edit&apos; to add your thoughts.</span>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={7}
            placeholder="Write freely about today... thoughts, ideas, reflections, feelings, or paste excerpts."
            className="w-full rounded-2xl border border-border bg-surface-muted/20 p-3.5 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-primary focus:bg-surface leading-relaxed resize-y font-sans transition-all"
          />
        )}

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
          <span className="text-[11px] text-text-muted font-medium mr-1">Tags:</span>
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-rose-500"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ Add tag (Press Enter)"
            className="rounded-lg border border-border/60 bg-transparent px-2 py-0.5 text-[11px] text-text placeholder:text-text-muted/60 outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
