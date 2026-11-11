"use client";

// ============================================================================
// Sahil's Shore: Command Palette & Global Search (cmdk)
// Raycast / Linear style command bar triggered by Cmd+K, Ctrl+K, or "/"
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useQuickCapture } from "@/lib/quick-capture/QuickCaptureContext";
import { useThemeConfig } from "@/lib/theme/ThemeContext";
import { SearchResultItem } from "@/app/api/search/route";
import {
  Search,
  CheckSquare,
  Wallet,
  Utensils,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  HardDrive,
  Download,
  BookOpen,
  Code2,
  Languages,
  Briefcase,
  Compass,
  Image,
  Target,
  HeartPulse,
  BarChart3,
  Settings,
  HelpCircle,
  Calendar,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcuts?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenShortcuts,
}: CommandPaletteProps) {
  const router = useRouter();
  const { open: openQuickCapture } = useQuickCapture();
  const { resolvedMode, setMode } = useThemeConfig();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced API search when query changes
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.warn("[CommandPalette] Search query error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const runAction = useCallback(
    (action: () => void) => {
      onOpenChange(false);
      setSearchQuery("");
      action();
    },
    [onOpenChange]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 p-4 pt-[12vh] backdrop-blur-md animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl transition-all">
        <Command
          label="Global Command Palette"
          className="w-full flex flex-col"
          shouldFilter={searchQuery.length < 2}
        >
          {/* Search Input Bar */}
          <div className="flex items-center border-b border-border px-4 py-3">
            <Search className="mr-3 h-4 w-4 shrink-0 text-text-muted" />
            <Command.Input
              autoFocus
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Type a command or search across tasks, notes, DSA, vocab, expenses..."
              className="flex-1 bg-transparent text-sm font-medium text-text placeholder:text-text-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-text-muted hover:text-text ml-2"
              >
                Clear
              </button>
            )}
            <kbd className="ml-3 hidden sm:inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
            <Command.Empty className="py-6 text-center text-xs text-text-muted">
              {isSearching ? (
                <span>Searching across your shore...</span>
              ) : searchQuery ? (
                <span>No results found for &quot;{searchQuery}&quot;</span>
              ) : (
                <span>No commands available</span>
              )}
            </Command.Empty>

            {/* Global Search Results Section */}
            {searchResults.length > 0 && (
              <Command.Group
                heading="Global Search Results"
                className="text-[11px] font-semibold text-primary uppercase tracking-wider px-2 py-1.5"
              >
                {searchResults.map((item) => (
                  <Command.Item
                    key={`${item.type}-${item.id}`}
                    value={`${item.title} ${item.subtitle}`}
                    onSelect={() => runAction(() => router.push(item.url))}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {item.tag}
                      </span>
                      <div className="truncate">
                        <div className="font-medium text-text truncate">{item.title}</div>
                        <div className="text-[11px] text-text-muted truncate">{item.subtitle}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-muted ml-2" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Quick Actions */}
            <Command.Group
              heading="Quick Actions"
              className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 py-1.5"
            >
              <Command.Item
                value="New Task Todo"
                onSelect={() => runAction(() => openQuickCapture("task"))}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium text-text">New Task / Todo</span>
                </div>
                <kbd className="text-[10px] font-mono text-text-muted">n</kbd>
              </Command.Item>

              <Command.Item
                value="Log Expense Paise INR"
                onSelect={() => runAction(() => openQuickCapture("expense"))}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-text">Log Expense (INR)</span>
                </div>
                <kbd className="text-[10px] font-mono text-text-muted">e</kbd>
              </Command.Item>

              <Command.Item
                value="Log Meal Food Breakfast Lunch Dinner"
                onSelect={() => runAction(() => openQuickCapture("meal"))}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  <Utensils className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-text">Log Meal</span>
                </div>
                <kbd className="text-[10px] font-mono text-text-muted">m</kbd>
              </Command.Item>

              <Command.Item
                value="Quick Note Second Brain"
                onSelect={() => runAction(() => openQuickCapture("note"))}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-sky-500" />
                  <span className="font-medium text-text">Quick Note (Second Brain)</span>
                </div>
              </Command.Item>

              <Command.Item
                value="Focus Timer Pomodoro"
                onSelect={() => runAction(() => openQuickCapture("timer"))}
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium text-text">Start Focus Timer / Pomodoro</span>
                </div>
              </Command.Item>

              <Command.Item
                value="Toggle Theme Dark Light Mode"
                onSelect={() =>
                  runAction(() => setMode(resolvedMode === "dark" ? "light" : "dark"))
                }
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  {resolvedMode === "dark" ? (
                    <Sun className="h-4 w-4 text-accent-warm drop-shadow-[0_0_6px_rgba(232,178,106,0.6)]" />
                  ) : (
                    <Moon className="h-4 w-4 text-primary drop-shadow-[0_0_6px_rgba(31,122,140,0.6)]" />
                  )}
                  <span className="font-medium text-text">Toggle Theme Mode</span>
                </div>
              </Command.Item>

              <Command.Item
                value="Download Backup ZIP Export"
                onSelect={() =>
                  runAction(() => {
                    window.location.href = "/api/backup/download-zip";
                  })
                }
                className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-primary" />
                  <span className="font-medium text-text">Download Full Backup (.zip)</span>
                </div>
              </Command.Item>

              {onOpenShortcuts && (
                <Command.Item
                  value="Keyboard Shortcuts Cheatsheet"
                  onSelect={() => runAction(() => onOpenShortcuts())}
                  className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-text-muted" />
                    <span className="font-medium text-text">Keyboard Shortcuts</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-text-muted">?</kbd>
                </Command.Item>
              )}
            </Command.Group>

            {/* Navigation Modules */}
            <Command.Group
              heading="Navigate to Module"
              className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-2 py-1.5"
            >
              {[
                { label: "Today Dashboard", route: "/", shortcut: "g t", icon: Calendar },
                { label: "Todos & Planner", route: "/todos", icon: CheckSquare },
                { label: "Daily Tracker & Timer", route: "/tracker", icon: Clock },
                { label: "DSA Tracker", route: "/dsa", shortcut: "g d", icon: Code2 },
                { label: "Full-Stack Learning Hub", route: "/learning", shortcut: "g l", icon: BookOpen },
                { label: "German Hub & Pronunciation Lab", route: "/german", shortcut: "g g", icon: Languages },
                { label: "Resume & Career Hub", route: "/career", shortcut: "g c", icon: Briefcase },
                { label: "Expense Tracker", route: "/expenses", shortcut: "g e", icon: Wallet },
                { label: "Food Diary", route: "/food", icon: Utensils },
                { label: "Places & Map", route: "/places", shortcut: "g p", icon: Compass },
                { label: "Media Vault & Memories", route: "/media", shortcut: "g m", icon: Image },
                { label: "Journal & Reflection", route: "/journal", shortcut: "g j", icon: BookOpen },
                { label: "Notes / Second Brain", route: "/notes", shortcut: "g n", icon: FileText },
                { label: "Long-Term Goals", route: "/goals", icon: Target },
                { label: "Health Mini-Trackers", route: "/health", icon: HeartPulse },
                { label: "Analytics & Productivity", route: "/analytics", icon: BarChart3 },
                { label: "Settings & Backups", route: "/settings", shortcut: "g s", icon: Settings },
              ].map((mod) => {
                const Icon = mod.icon;
                return (
                  <Command.Item
                    key={mod.route}
                    value={`Go to ${mod.label} ${mod.route}`}
                    onSelect={() => runAction(() => router.push(mod.route))}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors hover:bg-surface-muted aria-selected:bg-surface-muted"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-text-muted" />
                      <span className="font-medium text-text">{mod.label}</span>
                    </div>
                    {mod.shortcut && (
                      <kbd className="text-[10px] font-mono text-text-muted">
                        {mod.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>

          {/* Footer Helper */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-text-muted bg-surface-muted/30">
            <div className="flex items-center gap-3">
              <span>Use ↑ ↓ to navigate</span>
              <span>↵ to select</span>
              <span>ESC to close</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Sahil&apos;s Shore</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
