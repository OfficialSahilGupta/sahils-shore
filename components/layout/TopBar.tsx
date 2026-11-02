"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WaveLogo } from "@/components/common/WaveLogo";
import { getEnabledModules, getModuleByRoute, AppModule } from "@/lib/modules";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Plus,
  User,
  X,
  Command,
  CheckSquare,
  Wallet,
  Utensils,
  Activity,
  FileText,
  BookOpen,
  ArrowRight,
  Sparkles,
  CornerDownLeft,
  LogOut,
} from "lucide-react";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Sahil");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUserEmail(data.user.email || null);
          const metaName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.email?.split("@")[0];
          if (metaName) setUserName(metaName);
        }
      });
    } catch {
      // Ignored if client isn't configured yet
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign-out error:", err);
    }
    setUserMenuOpen(false);
    router.push("/login");
    router.refresh();
  };

  const currentModule = getModuleByRoute(pathname);
  const allModules = getEnabledModules();

  // Filter modules based on search query
  const filteredModules = allModules.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.route.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Global keyboard shortcuts (Cmd+K / Ctrl+K, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setQuickAddOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset selected index when query changes or dialog opens
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen) {
      setSelectedIndex(0);
      setSearchQuery("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  // Scroll selected item into view in list
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleSelectModule = (mod: AppModule) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(mod.route);
  };

  // Handle keyboard navigation inside search input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredModules.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredModules.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredModules.length > 0) {
        setSelectedIndex(
          (prev) => (prev - 1 + filteredModules.length) % filteredModules.length,
        );
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        filteredModules.length > 0 &&
        selectedIndex >= 0 &&
        selectedIndex < filteredModules.length
      ) {
        handleSelectModule(filteredModules[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchOpen(false);
    }
  };

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
      desc: "Paise-accurate INR expense",
    },
    {
      label: "Log Meal",
      route: "/food",
      icon: Utensils,
      desc: "Breakfast, lunch, dinner, snack",
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
      desc: "Thought or snippet for Second Brain",
    },
    {
      label: "Journal Entry",
      route: "/journal",
      icon: BookOpen,
      desc: "Daily mood, gratitude, win",
    },
  ];

  return (
    <>
      <header className="bg-surface/80 sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border px-4 backdrop-blur-md sm:px-6">
        {/* Mobile Brand / Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <WaveLogo size={28} />
            <span className="text-base font-semibold text-text">Shore</span>
          </div>

          <div className="hidden items-center gap-2 text-sm md:flex">
            <span className="font-normal text-text-muted">Sahil&apos;s Shore</span>
            <span className="text-border">/</span>
            <span className="font-medium text-text">
              {currentModule ? currentModule.name : "Dashboard"}
            </span>
          </div>
        </div>

        {/* Global Search Bar Trigger */}
        <div className="mx-2 hidden max-w-md flex-1 sm:block">
          <button
            onClick={() => setSearchOpen(true)}
            className="bg-surface-muted/60 flex h-9 w-full items-center justify-between rounded-xl border border-border px-3 text-xs text-text-muted shadow-sm transition-colors hover:bg-surface-muted hover:text-text"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span>Search modules, actions, notes...</span>
            </span>
            <kbd className="hidden items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted lg:inline-flex">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text sm:hidden"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Quick-Add Button (+) */}
          <div className="relative">
            <button
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              aria-label="Quick Add"
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add</span>
            </button>

            {/* Quick Add Dropdown */}
            {quickAddOpen && (
              <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-surface p-2 shadow-xl duration-150">
                <div className="mb-1 flex items-center justify-between border-b border-border px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <span>Quick Add</span>
                  <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
                </div>
                <div className="space-y-1">
                  {quickAddOptions.map((opt) => (
                    <button
                      key={opt.route}
                      onClick={() => {
                        setQuickAddOpen(false);
                        router.push(opt.route);
                      }}
                      className="group flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-surface-muted"
                    >
                      <div className="shrink-0 rounded-lg border border-border bg-surface-muted p-1.5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <opt.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-text transition-colors group-hover:text-primary">
                          {opt.label}
                        </div>
                        <div className="truncate text-[11px] text-text-muted">
                          {opt.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="Sahil Profile Menu"
              className="hover:border-primary/50 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-muted text-xs font-semibold tracking-tight text-text shadow-sm transition-all"
            >
              {userName ? userName.charAt(0).toUpperCase() : "S"}
            </button>

            {userMenuOpen && (
              <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-border bg-surface p-3 shadow-xl duration-150">
                <div className="flex items-center gap-2.5 border-b border-border pb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                    {userName ? userName.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{userName}</p>
                    <p className="truncate text-[11px] text-text-muted">
                      {userEmail || "Full-Stack Dev • IST"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 py-2 text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-surface-muted px-2 py-1.5 text-text">
                    <span className="text-text-muted">App Version</span>
                    <span className="font-mono font-medium text-primary">
                      Phase 1 Auth & DB
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-surface-muted px-2 py-1.5 text-text">
                    <span className="text-text-muted">Currency</span>
                    <span className="font-medium">INR (Paise)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-surface-muted px-2 py-1.5 text-text">
                    <span className="text-text-muted">Timezone</span>
                    <span className="font-medium">Asia/Kolkata</span>
                  </div>
                </div>

                <div className="space-y-1 border-t border-border pt-2">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/");
                    }}
                    className="hover:bg-primary-soft/30 w-full rounded-lg py-1.5 text-center text-xs font-medium text-primary transition-colors"
                  >
                    View Shore Home
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-center text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSearchOpen(false)}
          className="animate-in fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-16 backdrop-blur-sm duration-150 sm:pt-24"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-in zoom-in-95 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl duration-150"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Jump to any module or feature..."
                className="flex-1 border-0 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-80 space-y-1 overflow-y-auto p-2">
              {filteredModules.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No modules found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredModules.map((mod, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={mod.id}
                      ref={(el) => {
                        itemRefs.current[idx] = el;
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelectModule(mod)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-primary-soft/35 border-primary/30 text-primary"
                          : "border-transparent text-text hover:bg-surface-muted",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-surface-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                          )}
                        >
                          <ModuleIcon name={mod.iconName} className="h-4 w-4" />
                        </div>
                        <div>
                          <div
                            className={cn(
                              "text-xs font-semibold transition-colors",
                              isSelected
                                ? "text-primary"
                                : "text-text group-hover:text-primary",
                            )}
                          >
                            {mod.name}
                          </div>
                          <div className="text-[11px] text-text-muted">{mod.tagline}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                          Phase {mod.phase}
                        </span>
                        {isSelected ? (
                          <span className="bg-primary-soft/40 border-primary/20 flex items-center gap-0.5 rounded border px-1 py-0.5 font-mono text-[10px] text-primary">
                            ↵ Enter
                          </span>
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Search Footer with Navigation Hints */}
            <div className="bg-surface-muted/50 flex items-center justify-between border-t border-border px-4 py-2.5 text-[11px] text-text-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text">
                    ↓
                  </kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text">
                    ↵
                  </kbd>
                  <span>select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text">
                    esc
                  </kbd>
                  <span>close</span>
                </span>
              </div>
              <span className="font-mono">
                {filteredModules.length} module{filteredModules.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
