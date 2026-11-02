"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CATEGORY_LABELS, ModuleCategory } from "@/lib/modules";
import { useModules } from "@/lib/modules/ModuleContext";
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
  Settings,
} from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { enabledModules, mobileNavModules } = useModules();
  const categories: ModuleCategory[] = ["core", "growth", "life", "insights"];

  // Use configured mobile nav modules or top 4 enabled modules
  const activeTabs =
    mobileNavModules.length >= 3
      ? mobileNavModules.slice(0, 4)
      : enabledModules.slice(0, 4);

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
            className="animate-in slide-in-from-bottom w-full rounded-t-3xl border-t border-border bg-surface p-5 pb-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text">
                <Sparkles className="h-4 w-4 text-accent-warm" />
                <span>Quick Log / Add Action</span>
              </div>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {quickAddOptions.map((opt) => (
                <button
                  key={opt.route}
                  onClick={() => {
                    setQuickAddOpen(false);
                    router.push(opt.route);
                  }}
                  className="flex flex-col items-start gap-1 rounded-2xl border border-border bg-surface-muted/60 p-3 text-left transition-colors hover:bg-surface-muted"
                >
                  <div className="rounded-xl border border-border bg-surface p-2 text-primary shadow-sm">
                    <opt.icon className="h-4 w-4" />
                  </div>
                  <span className="mt-1 text-xs font-semibold text-text">{opt.label}</span>
                  <span className="line-clamp-1 text-[10px] text-text-muted">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Tab Bar (Mobile) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface/90 px-2 backdrop-blur-lg md:hidden"
      >
        {activeTabs.map((tab) => {
          const isActive =
            tab.route === "/" ? pathname === "/" : pathname.startsWith(tab.route);

          return (
            <Link
              key={tab.id}
              href={tab.route}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-text-muted hover:text-text"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  isActive && "bg-primary-soft/40"
                )}
              >
                <ModuleIcon
                  name={tab.iconName}
                  className={cn("h-4 w-4", isActive ? "text-primary" : "text-text-muted")}
                />
              </div>
              <span className="truncate max-w-[64px]">{tab.shortName}</span>
            </Link>
          );
        })}

        {/* 5th Tab: "More" Drawer Trigger */}
        <button
          onClick={() => setMoreSheetOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
            moreSheetOpen || pathname.startsWith("/settings")
              ? "text-primary"
              : "text-text-muted hover:text-text"
          )}
        >
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              (moreSheetOpen || pathname.startsWith("/settings")) && "bg-primary-soft/40"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </div>
          <span>More</span>
        </button>
      </nav>

      {/* "More" Sheet displaying all modules + Settings */}
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
                  <h3 className="text-base font-semibold text-text">Shore Modules</h3>
                  <p className="text-[11px] text-text-muted">Personal Life OS Workspace</p>
                </div>
              </div>
              <button
                onClick={() => setMoreSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Settings Quick Link */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setMoreSheetOpen(false);
                  router.push("/settings");
                }}
                className="flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3 text-left text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4" />
                  <div>
                    <div className="text-xs font-semibold">Settings & Customization</div>
                    <div className="text-[10px] text-text-muted">
                      Theme presets, modules, and privacy
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
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
                                ? "border-primary/40 bg-primary-soft/30 text-primary"
                                : "border-border bg-surface-muted/50 text-text hover:bg-surface-muted"
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
                                {mod.shortName}
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
