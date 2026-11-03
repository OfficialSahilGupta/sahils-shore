"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { WaveLogo } from "@/components/common/WaveLogo";
import { getEnabledModules, getModuleByRoute, AppModule } from "@/lib/modules";
import { useModules } from "@/lib/modules/ModuleContext";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import { ModuleIcon } from "@/components/common/ModuleIcon";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { CommandPalette } from "@/components/common/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/common/KeyboardShortcutsModal";
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
  Settings,
} from "lucide-react";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Sahil");

  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTimeRef = useRef<number>(0);

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
  const { enabledModules } = useModules();
  const { open: openQuickCapture } = useQuickCapture();

  // Enhanced keyboard shortcuts (Cmd+K, /, ?, n, e, m, and g+key navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Meta / Ctrl shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
        setShortcutsOpen(false);
        setQuickAddOpen(false);
        setUserMenuOpen(false);
        return;
      }

      // Ignore single-key shortcuts when typing in inputs
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Two-key navigation sequence ("g" then target key)
      if (lastKeyRef.current === "g" && now - lastKeyTimeRef.current < 1200) {
        lastKeyRef.current = null;
        e.preventDefault();
        switch (key) {
          case "t": router.push("/"); return;
          case "d": router.push("/dsa"); return;
          case "e": router.push("/expenses"); return;
          case "l": router.push("/learning"); return;
          case "g": router.push("/german"); return;
          case "c": router.push("/career"); return;
          case "j": router.push("/journal"); return;
          case "n": router.push("/notes"); return;
          case "m": router.push("/media"); return;
          case "p": router.push("/places"); return;
          case "s": router.push("/settings"); return;
        }
      }

      if (key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        lastKeyRef.current = "g";
        lastKeyTimeRef.current = now;
        return;
      }

      // Single-key global shortcuts
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (key === "/") {
          e.preventDefault();
          setSearchOpen(true);
        } else if (key === "?") {
          e.preventDefault();
          setShortcutsOpen(true);
        } else if (key === "n") {
          e.preventDefault();
          openQuickCapture("task");
        } else if (key === "e") {
          e.preventDefault();
          openQuickCapture("expense");
        } else if (key === "m") {
          e.preventDefault();
          openQuickCapture("meal");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openQuickCapture, router]);

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
              onClick={() => openQuickCapture()}
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

          {/* Offline Queue Status Pill */}
          <OfflineBadge />

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
                      Phase 2 Theme OS
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
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/settings");
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-center text-xs font-medium text-text transition-colors hover:bg-surface-muted"
                  >
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    <span>Settings & Customization</span>
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

      {/* Global Command Palette (cmdk) & Search Modal */}
      <CommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Keyboard Shortcuts Reference Modal */}
      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </>
  );
}
