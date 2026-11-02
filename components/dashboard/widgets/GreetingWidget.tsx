"use client";

// ============================================================================
// Sahil's Shore: Greeting & Horizon Banner Widget
// Dynamic IST greeting, date, and weather-free quote of the day
// ============================================================================

import React, { useState, useEffect } from "react";
import { WidgetContainer } from "../WidgetContainer";
import { WaveLogo } from "@/components/common/WaveLogo";
import { getQuoteOfTheDay, Quote } from "@/lib/dashboard/quotes";
import { todayIST, formatFriendlyISTDate } from "@/lib/date-utils";
import { Sparkles, Compass, Quote as QuoteIcon } from "lucide-react";
import type { WidgetId } from "@/lib/dashboard/types";

interface GreetingWidgetProps {
  isEditMode?: boolean;
  onRemove?: (id: WidgetId) => void;
}

export function GreetingWidget({ isEditMode, onRemove }: GreetingWidgetProps) {
  const [greeting, setGreeting] = useState("Welcome to your shore, Sahil.");
  const [dateDisplay, setDateDisplay] = useState("");
  const [quote, setQuote] = useState<Quote>(getQuoteOfTheDay());

  useEffect(() => {
    const now = new Date();
    // Compute current IST hour using Intl
    const hourStr = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(now);
    const hour = parseInt(hourStr, 10);

    let timeOfDay = "day";
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    else timeOfDay = "night";

    setGreeting(`Good ${timeOfDay}, Sahil. Welcome back to your shore.`);

    const formattedDate = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    setDateDisplay(formattedDate);

    setQuote(getQuoteOfTheDay(todayIST()));
  }, []);

  return (
    <WidgetContainer
      id="greeting"
      title="Greeting & Horizon"
      icon={Compass}
      isEditMode={isEditMode}
      onRemove={onRemove}
      className="bg-gradient-to-br from-surface via-surface to-surface-muted/50"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-full">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
              {dateDisplay || "Today"}
            </span>
            <span className="text-border">•</span>
            <span className="text-[11px] text-text-muted">IST Timezone</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-text tracking-tight truncate">
            {greeting}
          </h2>

          {/* Quote of the Day */}
          <div className="flex items-start gap-2 pt-1 text-xs text-text-muted italic max-w-2xl">
            <QuoteIcon className="w-3.5 h-3.5 text-accent-warm shrink-0 mt-0.5 fill-accent-warm/20" />
            <p className="line-clamp-2">
              &ldquo;{quote.text}&rdquo;{" "}
              <span className="font-semibold text-text not-italic text-[11px]">
                — {quote.author}
              </span>
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 shrink-0 pl-4 border-l border-border/60">
          <div className="p-2.5 rounded-2xl bg-surface-muted/60 border border-border">
            <WaveLogo size={36} animated />
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
