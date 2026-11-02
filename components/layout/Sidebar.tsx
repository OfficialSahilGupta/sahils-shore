"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_LABELS, ModuleCategory } from "@/lib/modules";
import { useModules } from "@/lib/modules/ModuleContext";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import { WaveLogo } from "@/components/common/WaveLogo";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { enabledModules } = useModules();

  useEffect(() => {
    setMounted(true);
    const savedState = localStorage.getItem("shore_sidebar_collapsed");
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("shore_sidebar_collapsed", String(newState));
  };

  const categories: ModuleCategory[] = ["core", "growth", "life", "insights"];
  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen select-none flex-col border-r border-border bg-surface transition-all duration-300 ease-in-out md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-3.5">
        <Link
          href="/"
          className={cn(
            "group flex items-center gap-2.5 overflow-hidden transition-all",
            collapsed && "w-full justify-center"
          )}
          title="Sahil's Shore"
        >
          <WaveLogo size={32} animated />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-text transition-colors group-hover:text-primary">
                Shore
                <span className="py-0.2 rounded border border-primary/20 bg-primary-soft/40 px-1.5 font-mono text-[10px] font-medium text-primary">
                  OS
                </span>
              </span>
              <span className="truncate text-[11px] leading-tight text-text-muted">
                Your day, your shore.
              </span>
            </div>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-muted text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* When collapsed, expand button at top */}
      {collapsed && (
        <div className="flex justify-center pt-2">
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-muted text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Module Navigation List driven by ModuleContext */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        {categories.map((cat) => {
          const catModules = enabledModules.filter((m) => m.category === cat);
          if (catModules.length === 0) return null;

          return (
            <div key={cat} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {CATEGORY_LABELS[cat]}
                </div>
              )}

              <div className="space-y-0.5">
                {catModules.map((mod) => {
                  const isActive =
                    mod.route === "/" ? pathname === "/" : pathname.startsWith(mod.route);

                  return (
                    <Link
                      key={mod.id}
                      href={mod.route}
                      title={collapsed ? `${mod.name} (${mod.tagline})` : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all",
                        isActive
                          ? "bg-primary-soft/30 font-medium text-primary"
                          : "text-text-muted hover:bg-surface-muted hover:text-text",
                        collapsed && "mx-auto h-10 w-10 justify-center px-0"
                      )}
                    >
                      <ModuleIcon
                        name={mod.iconName}
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                          isActive
                            ? "text-primary"
                            : "text-text-muted group-hover:text-text"
                        )}
                      />

                      {!collapsed && (
                        <span className="flex-1 truncate text-xs sm:text-sm">
                          {mod.shortName}
                        </span>
                      )}

                      {!collapsed && isActive && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}

                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-text opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                          {mod.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Navigation Link & Footer */}
      <div className="border-t border-border p-2">
        <Link
          href="/settings"
          title={collapsed ? "Settings & Customization" : undefined}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-all",
            isSettingsActive
              ? "bg-primary-soft/30 font-medium text-primary"
              : "text-text-muted hover:bg-surface-muted hover:text-text",
            collapsed && "mx-auto h-10 w-10 justify-center px-0"
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 shrink-0 transition-transform group-hover:rotate-45",
              isSettingsActive ? "text-primary" : "text-text-muted group-hover:text-text"
            )}
          />
          {!collapsed && (
            <span className="flex-1 truncate text-xs sm:text-sm">Settings</span>
          )}
          {collapsed && (
            <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-text opacity-0 shadow-md transition-opacity group-hover:opacity-100">
              Settings & Theme
            </div>
          )}
        </Link>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-border p-3 text-xs text-text-muted">
        {!collapsed ? (
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
              Phase 2 Theme OS
            </span>
            <span className="font-mono text-[10px] text-text-muted">v0.2</span>
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <Sparkles className="h-4 w-4 text-accent-warm" />
          </div>
        )}
      </div>
    </aside>
  );
}
