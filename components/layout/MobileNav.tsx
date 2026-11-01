"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AppModule,
  CATEGORY_LABELS,
  getEnabledModules,
  ModuleCategory,
} from "@/lib/modules";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import { WaveLogo } from "@/components/common/WaveLogo";
import { cn } from "@/lib/utils";
import {
  Compass,
  CheckSquare,
  Activity,
  Wallet,
  LayoutGrid,
  Plus,
  X,
  Sparkles,
  Utensils,
  FileText,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const enabledModules = getEnabledModules();
  const categories: ModuleCategory[] = ["core", "growth", "life", "insights"];

  const mainTabs = [
    { name: "Today", route: "/", icon: Compass },
    { name: "Tasks", route: "/todos", icon: CheckSquare },
    { name: "Track", route: "/tracker", icon: Activity },
    { name: "Money", route: "/expenses", icon: Wallet },
  ];

  const quickAddOptions = [
    {
      label: "Add Todo / Task",
      route: "/todos",
      icon: CheckSquare,
      desc: "Priority action or reminder",
    },
    {
      label: "Log Expense",
      route: "/expenses",
      icon: Wallet,
      desc: "Paise-accurate INR entry",
    },
    {
      label: "Log Meal",
      route: "/food",
      icon: Utensils,
      desc: "Breakfast, lunch, or dinner",
    },
    {
      label: "Track Activity",
      route: "/tracker",
      icon: Activity,
      desc: "DSA, Spring Boot, German, Gym",
    },
    {
      label: "Quick Note",
      route: "/notes",
      icon: FileText,
      desc: "Thought or reference snippet",
    },
    {
      label: "Journal Entry",
      route: "/journal",
      icon: BookOpen,
      desc: "Daily mood & gratitude",
    },
  ];

  return (
    <>
      {/* Floating Quick-Add Button (Mobile) */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          onClick={() => setQuickAddOpen(!quickAddOpen)}
          aria-label="Quick Add"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:opacity-95 active:scale-95"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick Add Bottom Sheet / Modal (Mobile) */}
      {quickAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm duration-200 md:hidden"
          onClick={() => setQuickAddOpen(false)}
        >
          <div
            className="animate-in slide-in-from-bottom max-h-[80vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 pb-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent-warm" />
                <h3 className="text-base font-semibold text-text">Quick Add Action</h3>
              </div>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickAddOptions.map((opt) => (
                <button
                  key={opt.route}
                  onClick={() => {
                    setQuickAddOpen(false);
                    router.push(opt.route);
                  }}
                  className="bg-surface-muted/60 hover:border-primary/50 flex flex-col items-start rounded-2xl border border-border p-3 text-left transition-colors"
                >
                  <div className="shadow-xs mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-primary">
                    <opt.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-text">{opt.label}</span>
                  <span className="mt-0.5 line-clamp-1 text-[10px] text-text-muted">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="bg-surface/95 fixed bottom-0 left-0 right-0 z-30 flex h-16 select-none items-center justify-around border-t border-border px-2 backdrop-blur-lg md:hidden"
      >
        {mainTabs.map((tab) => {
          const isActive =
            tab.route === "/" ? pathname === "/" : pathname.startsWith(tab.route);

          return (
            <Link
              key={tab.route}
              href={tab.route}
              className={cn(
                "relative flex h-full w-14 flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "font-semibold text-primary"
                  : "text-text-muted hover:text-text",
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.2]")} />
              <span className="text-[10px] tracking-tight">{tab.name}</span>
              {isActive && (
                <span className="absolute top-1.5 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* More Tab Trigger */}
        <button
          onClick={() => setMoreSheetOpen(true)}
          className={cn(
            "relative flex h-full w-14 flex-col items-center justify-center gap-1 transition-colors",
            moreSheetOpen
              ? "font-semibold text-primary"
              : "text-text-muted hover:text-text",
          )}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* "More" Sheet displaying all 16 modules */}
      {moreSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm duration-200 md:hidden"
          onClick={() => setMoreSheetOpen(false)}
        >
          <div
            className="animate-in slide-in-from-bottom max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 pb-10 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <WaveLogo size={28} />
                <div>
                  <h3 className="text-base font-semibold text-text">All Shore Modules</h3>
                  <p className="text-[11px] text-text-muted">16 core Life OS areas</p>
                </div>
              </div>
              <button
                onClick={() => setMoreSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Categorized Modules Grid */}
            <div className="space-y-5">
              {categories.map((cat) => {
                const catMods = enabledModules.filter((m) => m.category === cat);
                if (catMods.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {catMods.map((mod) => {
                        const isActive =
                          mod.route === "/"
                            ? pathname === "/"
                            : pathname.startsWith(mod.route);

                        return (
                          <button
                            key={mod.id}
                            onClick={() => {
                              setMoreSheetOpen(false);
                              router.push(mod.route);
                            }}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
                              isActive
                                ? "bg-primary-soft/30 border-primary/40 text-primary"
                                : "bg-surface-muted/50 border-border text-text hover:bg-surface-muted",
                            )}
                          >
                            <div className="shrink-0 rounded-lg border border-border bg-surface p-1.5 text-primary">
                              <ModuleIcon name={mod.iconName} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">
                                {mod.name}
                              </div>
                              <div className="font-mono text-[10px] text-text-muted">
                                Phase {mod.phase}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
