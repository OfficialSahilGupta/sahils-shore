import React from "react";
import Link from "next/link";
import { Greeting } from "@/components/common/Greeting";
import { WaveLogo } from "@/components/common/WaveLogo";
import { getEnabledModules, CATEGORY_LABELS, ModuleCategory } from "@/lib/modules";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Layers,
  HeartHandshake,
} from "lucide-react";

export default function TodayDashboardPage() {
  const modules = getEnabledModules();
  const todayModule = modules.find((m) => m.id === "today")!;
  const otherModules = modules.filter((m) => m.id !== "today");

  const categories: ModuleCategory[] = ["core", "growth", "life", "insights"];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16">
      {/* Top Welcome Header with Dynamic IST Greeting */}
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center">
        <div className="bg-primary-soft/20 pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full blur-3xl" />
        <div className="bg-accent-warm/15 pointer-events-none absolute -bottom-12 -left-12 h-64 w-64 rounded-full blur-3xl" />

        <div className="relative z-10 flex-1">
          <Greeting />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-3">
          <div className="shadow-xs rounded-2xl border border-border bg-surface-muted p-3">
            <WaveLogo size={44} animated />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Phase 0 Complete
            </div>
            <div className="text-sm font-semibold text-text">App Shell & Foundations</div>
            <div className="text-[11px] text-text-muted">16 modules configured</div>
          </div>
        </div>
      </div>

      {/* Preview Stat Cards for Today */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="shadow-xs rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>Priorities Today</span>
            <span className="rounded bg-surface-muted p-1 text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-text sm:text-2xl">0 / 3</div>
          <p className="mt-1 text-[11px] text-text-muted">Ready for Phase 3</p>
        </div>

        <div className="shadow-xs rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>Focus Timer</span>
            <span className="rounded bg-surface-muted p-1 text-accent-warm">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-text sm:text-2xl">00:00</div>
          <p className="mt-1 text-[11px] text-text-muted">Pomodoro built-in</p>
        </div>

        <div className="shadow-xs rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>Today&apos;s Spend</span>
            <span className="rounded bg-surface-muted p-1 text-success">₹</span>
          </div>
          <div className="text-xl font-bold text-text sm:text-2xl">₹0.00</div>
          <p className="mt-1 text-[11px] text-text-muted">Paise-accurate integer</p>
        </div>

        <div className="shadow-xs rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
            <span>Habits Streak</span>
            <span className="rounded bg-surface-muted p-1 text-warning">
              <Zap className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-text sm:text-2xl">Day 1</div>
          <p className="mt-1 text-[11px] text-text-muted">Consistency engine</p>
        </div>
      </div>

      {/* Signature Feature: Unified Timeline Preview */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-text">
                Signature Feature: Unified Timeline
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">
              Every action writes to a single shared table (
              <code className="font-mono text-primary">timeline_events</code>).
            </p>
          </div>
          <span className="bg-primary-soft/30 border-primary/20 self-start rounded-full border px-2.5 py-1 text-xs font-medium text-primary sm:self-auto">
            Arrives in Phase 5
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="bg-surface-muted/50 rounded-xl border border-border p-3.5">
            <span className="mb-1 block text-xs font-semibold text-text">
              What I Did Today
            </span>
            <p className="text-xs leading-relaxed text-text-muted">
              Chronological log of tasks completed, DSA problems solved, German phrases
              reviewed, and expenses logged.
            </p>
          </div>
          <div className="bg-surface-muted/50 rounded-xl border border-border p-3.5">
            <span className="mb-1 block text-xs font-semibold text-text">
              Day View for Any Date
            </span>
            <p className="text-xs leading-relaxed text-text-muted">
              Step back into any past IST day to see what you studied, spent, ate, and
              where you traveled.
            </p>
          </div>
          <div className="bg-surface-muted/50 rounded-xl border border-border p-3.5">
            <span className="mb-1 block text-xs font-semibold text-text">
              Full-Text Cross Search
            </span>
            <p className="text-xs leading-relaxed text-text-muted">
              One search bar across all notes, meals, expenses, places, and code commits.
            </p>
          </div>
        </div>
      </div>

      {/* Explore All 16 Modules Directory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text">Shore Modules Explorer</h2>
            <p className="text-xs text-text-muted">
              Click any module to inspect its architecture and planned specifications
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => {
            const catMods = otherModules.filter((m) => m.category === cat);
            if (catMods.length === 0) return null;

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {CATEGORY_LABELS[cat]}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {catMods.map((mod) => (
                    <Link
                      key={mod.id}
                      href={mod.route}
                      className="hover:border-primary/50 shadow-xs group flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:shadow-md"
                    >
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <ModuleIcon name={mod.iconName} className="h-5 w-5" />
                          </div>
                          <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 font-mono text-[10px] text-text-muted">
                            Phase {mod.phase}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-text transition-colors group-hover:text-primary">
                          {mod.name}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                          {mod.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted">
                        <span className="font-mono text-[11px]">{mod.route}</span>
                        <span className="flex items-center gap-1 font-medium text-primary transition-transform group-hover:translate-x-0.5">
                          Inspect <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
