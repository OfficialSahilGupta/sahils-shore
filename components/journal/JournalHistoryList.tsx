"use client";

// ============================================================================
// Sahil's Shore: Journal History & Entry Search
// Searchable directory of past reflections with mood badges and gratitude preview
// ============================================================================

import React, { useState } from "react";
import type { JournalEntry } from "@/lib/journal";
import { formatFriendlyISTDate } from "@/lib/date-utils";
import { Search, Calendar, Smile, Zap, Tag, ArrowRight, Heart } from "lucide-react";

interface JournalHistoryListProps {
  entries: JournalEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const MOOD_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Meh",
  3: "Good",
  4: "Great",
  5: "Wonderful",
};

export function JournalHistoryList({
  entries,
  selectedDate,
  onSelectDate,
}: JournalHistoryListProps) {
  const [query, setQuery] = useState("");

  const filtered = entries.filter((entry) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchDate = entry.entry_date.includes(q);
    const matchContent = entry.content?.toLowerCase().includes(q);
    const matchGratitude = entry.gratitude.some((g) => g.toLowerCase().includes(q));
    const matchWins = entry.wins.some((w) => w.toLowerCase().includes(q));
    const matchLessons = entry.lessons.some((l) => l.toLowerCase().includes(q));
    const matchTags = entry.tags.some((t) => t.toLowerCase().includes(q));
    return matchDate || matchContent || matchGratitude || matchWins || matchLessons || matchTags;
  });

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
      {/* Header and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Past Reflections Archive ({entries.length})</span>
          </h3>
          <p className="text-xs text-text-muted">
            Search past gratitude, wins, thoughts, or dates
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries or #tags..."
            className="w-full rounded-xl border border-border bg-surface-muted/30 pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted/60 outline-none focus:border-primary focus:bg-surface transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/60 max-h-[500px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-muted">
            No reflections matching your search.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.entry_date === selectedDate;
            return (
              <div
                key={item.id}
                onClick={() => onSelectDate(item.entry_date)}
                className={`group flex cursor-pointer flex-col gap-2 p-3.5 transition-all rounded-2xl hover:bg-surface-muted/40 ${
                  isSelected ? "bg-primary/5 border border-primary/20" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text">
                      {formatFriendlyISTDate(item.entry_date)}
                    </span>
                    <span className="text-[10px] text-text-muted">({item.entry_date})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.mood && (
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {MOOD_LABELS[item.mood] || `Mood ${item.mood}`}
                      </span>
                    )}
                    {item.energy && (
                      <span className="rounded-md bg-accent-warm/10 px-2 py-0.5 text-[10px] font-medium text-accent-warm inline-flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{item.energy}/5</span>
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Gratitude / Wins preview */}
                {item.gratitude?.length > 0 && (
                  <p className="text-[11px] text-text-muted line-clamp-1 inline-flex items-center gap-1.5">
                    <Heart className="h-3 w-3 text-rose-500 shrink-0" />
                    <span className="italic">{item.gratitude.join(" • ")}</span>
                  </p>
                )}

                {/* Content snippet */}
                {item.content && (
                  <p className="text-[11px] text-text-muted/80 line-clamp-2">
                    {item.content.slice(0, 150)}
                  </p>
                )}

                {/* Tags */}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-surface-muted px-1.5 py-0.5 text-[10px] text-text-muted font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
