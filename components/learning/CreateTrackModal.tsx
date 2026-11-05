"use client";

// ============================================================================
// Sahil's Shore: Create Learning Track Modal
// Allows creating custom tracks with preset templates (System Design, DevOps,
// Golang) or blank custom roadmaps with custom icons and theme colors.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Layers,
  Server,
  Cloud,
  Terminal,
  Cpu,
  Globe,
  Database,
  Shield,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  PRESET_TRACK_TEMPLATES,
  type CreateTrackInput,
  type TrackTemplate,
} from "@/lib/learning";

interface CreateTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrack: (input: CreateTrackInput) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { name: "Server", component: Server, label: "Backend / Infra" },
  { name: "Cloud", component: Cloud, label: "Cloud & DevOps" },
  { name: "Terminal", component: Terminal, label: "Systems / CLI" },
  { name: "Database", component: Database, label: "Data Tier" },
  { name: "Cpu", component: Cpu, label: "Core Architecture" },
  { name: "Layers", component: Layers, label: "Full Stack" },
  { name: "Globe", component: Globe, label: "Web / Distributed" },
  { name: "Shield", component: Shield, label: "Security" },
];

const PRESET_COLORS = [
  "#1F7A8C", // Shore teal
  "#E0A458", // Sunset sand
  "#2E9E6B", // Forest emerald
  "#BFDBF7", // Sea foam
  "#9D4EDD", // Royal purple
  "#D1495B", // Rose crimson
];

export function CreateTrackModal({
  isOpen,
  onClose,
  onCreateTrack,
}: CreateTrackModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Server");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
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

  const handleSelectTemplate = (tpl: TrackTemplate | "custom") => {
    if (tpl === "custom") {
      setSelectedTemplate("custom");
      setTitle("");
      setDescription("");
      setSelectedIcon("Layers");
      setSelectedColor(PRESET_COLORS[0]);
    } else {
      setSelectedTemplate(tpl.id);
      setTitle(tpl.title);
      setDescription(tpl.description);
      setSelectedIcon(tpl.icon);
      setSelectedColor(tpl.color);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter a track title.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const template = PRESET_TRACK_TEMPLATES.find((t) => t.id === selectedTemplate);

      await onCreateTrack({
        title: title.trim(),
        description: description.trim() || null,
        icon: selectedIcon,
        color: selectedColor,
        templateId: selectedTemplate !== "custom" ? selectedTemplate : undefined,
        initialRoadmap: template ? template.roadmap : undefined,
      });

      onClose();
    } catch (err: any) {
      console.error("Error creating track:", err);
      setErrorMessage(err?.message || "Failed to create track. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                Create New Learning Track
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Expand your engineering mastery with custom or pre-templated roadmaps
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-xs text-[var(--danger)]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Templates Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>Choose Curriculum Template</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_TRACK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`rounded-xl border p-3 text-left transition-all flex flex-col justify-between ${
                    selectedTemplate === tpl.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20 shadow-2xs"
                      : "border-[var(--border)] bg-[var(--surface-muted)]/20 hover:border-[var(--primary)]/40 hover:bg-[var(--surface-muted)]/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-[var(--text)]">
                      {tpl.title}
                    </span>
                    <span className="rounded-md bg-[var(--surface)] px-1.5 py-0.2 text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
                      {tpl.roadmap.length} topics
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                    {tpl.description}
                  </p>
                </button>
              ))}

              {/* Blank Custom Template Option */}
              <button
                type="button"
                onClick={() => handleSelectTemplate("custom")}
                className={`rounded-xl border p-3 text-left transition-all flex flex-col justify-between ${
                  selectedTemplate === "custom"
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20 shadow-2xs"
                    : "border-[var(--border)] bg-[var(--surface-muted)]/20 hover:border-[var(--primary)]/40 hover:bg-[var(--surface-muted)]/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-[var(--text)]">
                    Blank Custom Track
                  </span>
                  <span className="rounded-md bg-[var(--surface)] px-1.5 py-0.2 text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border)]">
                    Custom
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                  Start with a clean slate and add your own custom curriculum topics.
                </p>
              </button>
            </div>
          </div>

          {/* Track Title */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Track Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. System Design, AI & LLMs, Rust Backend..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Description & Focus Goals
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Distributed algorithms, consensus, and staff-level interview prep"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 px-3.5 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          {/* Icon & Color Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                Track Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_ICONS.map(({ name, component: IconComponent }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${
                      selectedIcon === name
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "border border-[var(--border)] bg-[var(--surface-muted)]/20 text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/60"
                    }`}
                    title={name}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color Picker */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      selectedColor === col
                        ? "scale-110 border-[var(--text)] shadow-xs"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
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
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? "Creating..." : "Create Track"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
