"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppModule, CATEGORY_LABELS } from "@/lib/modules";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import { WaveLogo } from "@/components/common/WaveLogo";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Clock,
} from "lucide-react";

interface PlaceholderModuleProps {
  module: AppModule;
  plannedFeatures?: string[];
}

const DEFAULT_FEATURES: Record<string, string[]> = {
  today: [
    "Unified 'What I did today' timeline combining all logs",
    "Top 3 daily priorities & quick todo completion",
    "Habit checklist with live streaks",
    "Integrated Pomodoro focus timer with ambient sound",
    "Real-time expense & meal tracker widgets",
  ],
  todos: [
    "Priority levels, tags, due dates, and nested subtasks",
    "List, Kanban (drag-and-drop), and Calendar views",
    "Time-blocking day planner matching IST hours",
    "Automated recurring task schedules",
    "Timeline event integration on task completion",
  ],
  tracker: [
    "Custom activity tracking (DSA, Spring Boot, German, Gym)",
    "GitHub-style annual consistency heatmap",
    "Built-in Pomodoro timer with auto-logging",
    "Weekly and monthly hours breakdown charts",
    "Streak protection and milestone celebration",
  ],
  dsa: [
    "Problem repository with platform, difficulty, and links",
    "Approach notes, time complexity, and clean code snippets",
    "SM-2 spaced-repetition revision queue",
    "Weak-topic detection and algorithmic topic progress",
    "LeetCode / Codeforces practice log",
  ],
  learning: [
    "Java/Spring Boot track (Hibernate, Security, Microservices)",
    "MERN / Next.js track (Node, Express, MongoDB, TS)",
    "Concept learned log with code examples and references",
    "Projects portfolio tracker with repos and deployed URLs",
    "Curated interview Q&A bank per technology stack",
  ],
  german: [
    "SM-2 algorithm spaced repetition vocab flashcards",
    "Daily German word with pronunciation and example sentences",
    "Pronunciation Lab: browser microphone recorder & waveforms",
    "Reference audio playback vs. self recording & shadowing",
    "CEFR progress milestones from A1 through B2",
  ],
  career: [
    "Multiple tailored resume versions and export options",
    "Bullet-point achievement bank tagged by skill",
    "Job application Kanban: Wishlist, Applied, Interview, Offer",
    "STAR format interview story bank",
    "Company research notes and follow-up reminders",
  ],
  expenses: [
    "Strict integer paise storage (Rs 10.50 = 1050 paise)",
    "Quick expense entry under 5 seconds on mobile",
    "Monthly budgets per category with progress bars",
    "Income tracking and category breakdown charts",
    "Receipt photo attachments and CSV export",
  ],
  food: [
    "Breakfast, lunch, snacks, and dinner logs",
    "Home-cooked vs. restaurant dining notes",
    "Auto-creates linked expense entry in integer paise",
    "Photo capture, taste rating, and health score",
    "Favorites and 'places to eat again' list",
  ],
  places: [
    "OpenStreetMap + Leaflet interactive pin map (no paid keys)",
    "Current location capture or manual map picker",
    "Linked photos, videos, and dining expenses",
    "Pin clusters and 'places this month' travel log",
    "Coordinates and address metadata",
  ],
  media: [
    "Google Drive OAuth sync (Shore/ subfolders)",
    "Photos and videos masonry gallery with lightbox",
    "'On This Day' nostalgic memory highlights",
    "Two-way Google Drive resumable upload queue",
    "Linked to places, meals, expenses, and journal entries",
  ],
  journal: [
    "Daily journal entry with mood and energy level rating",
    "Gratitude prompts, daily wins, and lessons learned",
    "Weekly review and reflection template",
    "Optional PIN/biometric privacy protection",
    "Timeline event creation for every journal reflection",
  ],
  notes: [
    "Markdown note editor with syntax highlighting",
    "Bi-directional [[backlinks]] and tag network",
    "Lightning-fast client-side search & quick pinning",
    "Seamless embedding of code snippets and formulas",
    "Automatic auto-save and revision history",
  ],
  goals: [
    "Hierarchical long-term life and career goals",
    "Quarterly and monthly milestone progress trackers",
    "Direct linkage to daily tasks and habit streaks",
    "Visual completion rings and progress metrics",
    "Reflective check-in logs per milestone",
  ],
  health: [
    "Daily water hydration intake tracker",
    "Sleep duration and sleep quality score",
    "Workout logs (weight training, cardio, sets)",
    "Weight tracking with moving average trendline",
    "Toggleable modules to keep your view distraction-free",
  ],
  analytics: [
    "Overall daily productivity score calculation",
    "Hours spent per skill (DSA, Spring, German, MERN)",
    "Spending trends and category budget analysis",
    "Cross-correlations: mood vs. productivity vs. spending",
    "Weekly and monthly summary reports",
  ],
};

export function PlaceholderModule({ module, plannedFeatures }: PlaceholderModuleProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const features = plannedFeatures ||
    DEFAULT_FEATURES[module.id] || [
      "Full database schema with Row Level Security",
      "Unified timeline events recording",
      "Offline-first mobile support and sync",
      "Keyboard shortcuts and command palette integration",
    ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="transition-colors hover:text-primary">
            Shore
          </Link>
          <span>/</span>
          <span className="capitalize">{CATEGORY_LABELS[module.category]}</span>
          <span>/</span>
          <span className="font-medium text-text">{module.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-primary-soft/40 border-primary/20 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-primary">
            <Clock className="h-3.5 w-3.5" />
            Phase {module.phase} Planned
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
            Order #{module.order}
          </span>
        </div>
      </div>

      {/* Module Title Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted text-primary">
            <ModuleIcon name={module.iconName} className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text">
                {module.name}
              </h1>
              <span className="rounded border border-border bg-surface-muted px-2 py-0.5 font-mono text-xs text-text-muted">
                {module.route}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">{module.description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted"
          >
            <Info className="h-3.5 w-3.5 text-primary" />
            {detailsOpen ? "Hide Spec" : "Module Spec"}
          </button>
        </div>
      </div>

      {/* Architecture Spec Callout (collapsible) */}
      {detailsOpen && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-4 text-xs text-text">
          <p className="flex items-center gap-1.5 font-semibold text-primary">
            <Layers className="h-4 w-4" />
            Module Architecture & Conventions
          </p>
          <div className="grid grid-cols-1 gap-2 text-text-muted md:grid-cols-2">
            <div>
              <strong className="text-text">Data Access Layer:</strong>{" "}
              <code className="rounded border border-border bg-surface px-1.5 py-0.5">
                lib/{module.id}/
              </code>{" "}
              (No raw Supabase in UI)
            </div>
            <div>
              <strong className="text-text">Component Directory:</strong>{" "}
              <code className="rounded border border-border bg-surface px-1.5 py-0.5">
                components/{module.id}/
              </code>
            </div>
            <div>
              <strong className="text-text">Timeline Integration:</strong> Writes to{" "}
              <code className="rounded border border-border bg-surface px-1.5 py-0.5">
                timeline_events
              </code>{" "}
              on all record mutations
            </div>
            <div>
              <strong className="text-text">Security:</strong> Postgres Row-Level Security
              (RLS) enforcing{" "}
              <code className="font-mono text-primary">auth.uid() = user_id</code>
            </div>
          </div>
        </div>
      )}

      {/* Main Empty State & Features Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Planned Features List */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm lg:col-span-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-warm" />
              <h2 className="text-base font-semibold text-text">
                Planned Features & Roadmap
              </h2>
            </div>
            <ul className="space-y-3">
              {features.map((feature, idx) => (
                <li
                  key={idx}
                  className="bg-surface-muted/50 border-border/60 hover:border-primary/40 flex items-start gap-3 rounded-xl border p-3 transition-colors"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed text-text">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-text-muted">
            <span>Implementation scheduled for Phase {module.phase}</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Back to Shore <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Coastal Aesthetic Preview Card */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
          <div className="from-primary-soft/10 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-surface" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 rounded-2xl border border-border bg-surface-muted p-4">
              <WaveLogo size={48} animated />
            </div>

            <h3 className="mb-1 text-base font-semibold text-text">
              {module.shortName} Canvas
            </h3>
            <p className="mb-5 max-w-xs text-xs text-text-muted">
              &quot;{module.tagline}&quot;
            </p>

            <div className="w-full space-y-2 text-left">
              <div className="bg-surface-muted/70 flex items-center justify-between rounded-lg border border-border p-2.5 text-xs">
                <span className="text-text-muted">Route</span>
                <span className="font-mono text-text">{module.route}</span>
              </div>
              <div className="bg-surface-muted/70 flex items-center justify-between rounded-lg border border-border p-2.5 text-xs">
                <span className="text-text-muted">Category</span>
                <span className="capitalize text-text">{module.category}</span>
              </div>
              <div className="bg-surface-muted/70 flex items-center justify-between rounded-lg border border-border p-2.5 text-xs">
                <span className="text-text-muted">Status</span>
                <span className="font-medium text-primary">
                  Ready for Phase {module.phase}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
