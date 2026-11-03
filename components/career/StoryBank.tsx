"use client";

// ============================================================================
// Sahil's Shore: STAR Interview Story Bank Component
// Situation, Task, Action, Result structured bank with practice mode & tags
// ============================================================================

import React, { useState, useMemo } from "react";
import type { CreateStoryInput, InterviewStory } from "@/types/career";
import { StarPracticeModal } from "./StarPracticeModal";
import {
  Sparkles,
  Plus,
  Play,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tag,
  Timer,
  ChevronDown,
  ChevronUp,
  X,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoryBankProps {
  stories: InterviewStory[];
  onSaveStory: (input: CreateStoryInput, existingId?: string) => Promise<void>;
  onDeleteStory: (id: string) => Promise<void>;
  onSavePracticeSession: (
    title: string,
    durationSeconds: number,
    rating: number,
    notes?: string
  ) => Promise<void>;
}

const PRESET_TAGS = [
  "Leadership",
  "Conflict",
  "Failure",
  "Impact",
  "Technical",
  "Teamwork",
  "Tight Deadlines",
];

export function StoryBank({
  stories,
  onSaveStory,
  onDeleteStory,
  onSavePracticeSession,
}: StoryBankProps) {
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [practiceStory, setPracticeStory] = useState<InterviewStory | null>(null);
  const [editingStory, setEditingStory] = useState<InterviewStory | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [skillsText, setSkillsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract all tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => {
      (s.tags || []).forEach((t) => set.add(t));
    });
    return ["All", ...Array.from(set)];
  }, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      if (selectedTag !== "All" && !s.tags?.includes(selectedTag)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesContent =
          s.situation.toLowerCase().includes(q) ||
          s.action.toLowerCase().includes(q) ||
          s.result.toLowerCase().includes(q);
        const matchesSkills = s.skills.some((sk) => sk.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesSkills) return false;
      }
      return true;
    });
  }, [stories, selectedTag, search]);

  const handleOpenAdd = () => {
    setEditingStory(null);
    setTitle("");
    setSituation("");
    setTask("");
    setAction("");
    setResult("");
    setTags(["Impact"]);
    setSkillsText("");
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (story: InterviewStory) => {
    setEditingStory(story);
    setTitle(story.title);
    setSituation(story.situation);
    setTask(story.task);
    setAction(story.action);
    setResult(story.result);
    setTags(story.tags || []);
    setSkillsText((story.skills || []).join(", "));
    setIsEditModalOpen(true);
  };

  const handleLaunchPractice = (story?: InterviewStory) => {
    setPracticeStory(story || null);
    setIsPracticeModalOpen(true);
  };

  const handleCopyFullStory = async (story: InterviewStory) => {
    const formatted = `**${story.title}**\n\n**Situation:** ${story.situation}\n\n**Task:** ${story.task}\n\n**Action:** ${story.action}\n\n**Result:** ${story.result}`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedId(story.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !situation.trim() || !action.trim() || !result.trim()) return;

    try {
      setIsSubmitting(true);
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const input: CreateStoryInput = {
        title: title.trim(),
        situation: situation.trim(),
        task: task.trim() || situation.trim(),
        action: action.trim(),
        result: result.trim(),
        tags,
        skills,
      };

      await onSaveStory(input, editingStory?.id);
      setIsEditModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Practice Launch Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
        <div>
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>STAR Behavioral Story Bank</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Structured answers in Situation, Task, Action, and Result format, ready for behavioral and cultural rounds.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => handleLaunchPractice()}
            className="inline-flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Timer className="w-4 h-4" />
            <span>Practice Mode</span>
          </Button>

          <Button onClick={handleOpenAdd} className="inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Add Story</span>
          </Button>
        </div>
      </div>

      {/* Tag Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", ...PRESET_TAGS].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === t
                  ? "bg-primary text-white shadow-2xs"
                  : "bg-surface-muted text-text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search stories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
        />
      </div>

      {/* Stories List */}
      {filteredStories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-8 text-center flex flex-col items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary/40 mb-2" />
          <h4 className="text-sm font-bold text-text mb-1">No STAR stories found</h4>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            Prepare impactful behavioral answers before interviews by structuring key projects into Situation, Task, Action, and Result.
          </p>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add First STAR Story
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStories.map((story) => {
            const isCopied = copiedId === story.id;

            return (
              <div
                key={story.id}
                className="rounded-2xl border border-border/80 bg-surface p-5 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all space-y-3.5"
              >
                {/* Title & Tag bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-bold text-text">{story.title}</h4>
                      {story.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] py-0 px-2 h-5 bg-primary/10 text-primary border-primary/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLaunchPractice(story)}
                      className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 inline-flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Rehearse
                    </Button>
                    <button
                      onClick={() => handleCopyFullStory(story)}
                      className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-muted transition-colors"
                      title="Copy full STAR text"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(story)}
                      className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-muted transition-colors"
                      title="Edit story"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteStory(story.id)}
                      className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg hover:bg-surface-muted transition-colors"
                      title="Delete story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Structured STAR blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Situation */}
                  <div className="p-3 rounded-xl bg-surface-muted/40 border border-border/50 space-y-1">
                    <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">
                      Situation (Context & Problem)
                    </span>
                    <p className="text-text leading-relaxed">{story.situation}</p>
                  </div>

                  {/* Task */}
                  <div className="p-3 rounded-xl bg-surface-muted/40 border border-border/50 space-y-1">
                    <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">
                      Task (Specific Responsibility)
                    </span>
                    <p className="text-text leading-relaxed">{story.task}</p>
                  </div>

                  {/* Action */}
                  <div className="p-3 rounded-xl bg-surface-muted/40 border border-border/50 space-y-1">
                    <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">
                      Action (Engineering & Execution)
                    </span>
                    <p className="text-text leading-relaxed">{story.action}</p>
                  </div>

                  {/* Result */}
                  <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px] uppercase tracking-wider">
                      Result (Impact & Numbers)
                    </span>
                    <p className="text-text leading-relaxed font-medium">{story.result}</p>
                  </div>
                </div>

                {/* Skills tags */}
                {story.skills && story.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-text-muted mr-1">Skills:</span>
                    {story.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-medium text-text bg-surface-muted px-2 py-0.5 rounded-md border border-border/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Story Modal */}
      {isEditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-text">
                  {editingStory ? "Edit STAR Story" : "Compose STAR Story"}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Story Title / Scenario <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resolving Redis cluster memory leak under 20k QPS flash sale"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Tag Chips */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Behavioral Categories / Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        tags.includes(tag)
                          ? "bg-primary text-white shadow-2xs"
                          : "bg-surface-muted text-text-muted hover:text-text border border-border/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* S: Situation */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Situation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What was the background, company context, and business challenge?"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {/* T: Task */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Task</label>
                <textarea
                  rows={2}
                  placeholder="What was your specific responsibility or objective?"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {/* A: Action */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Action <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What concrete actions did you personally take? Highlight technical decisions, debugging steps, and leadership."
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {/* R: Result */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Result (Include Numbers & Impact) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What was the measurable outcome? (e.g. 0% downtime, 40% memory reduction, saved $25k/yr)"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Skills Tagged (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Java, Redis, Memory Profiling, Distributed Systems"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingStory ? "Update Story" : "Save STAR Story"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Practice Modal */}
      <StarPracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => setIsPracticeModalOpen(false)}
        stories={stories}
        initialStory={practiceStory}
        onSavePracticeSession={onSavePracticeSession}
      />
    </div>
  );
}
