"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Calendar, Clock } from "lucide-react";

interface GreetingProps {
  className?: string;
}

export function Greeting({ className = "" }: GreetingProps) {
  const [greeting, setGreeting] = useState(
    "Good day, Sahil. Welcome back to your shore.",
  );
  const [dateString, setDateString] = useState("");
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Format time in Asia/Kolkata
      const istHourString = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      }).format(now);

      const hour = parseInt(istHourString, 10);

      if (hour >= 4 && hour < 12) {
        setGreeting("Good morning, Sahil. Welcome back to your shore.");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon, Sahil. Welcome back to your shore.");
      } else if (hour >= 17 && hour < 22) {
        setGreeting("Good evening, Sahil. Welcome back to your shore.");
      } else {
        setGreeting("Good night, Sahil. Resting by your shore.");
      }

      // Format full date in IST
      const formattedDate = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);

      // Format short time in IST
      const formattedTime = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(now);

      setDateString(formattedDate);
      setTimeString(formattedTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <span className="flex items-center gap-1" suppressHydrationWarning>
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {dateString || "Loading date..."}
        </span>
        <span className="text-border">•</span>
        <span className="flex items-center gap-1" suppressHydrationWarning>
          <Clock className="h-3.5 w-3.5 text-accent-warm" />
          {timeString ? `${timeString} IST` : "IST"}
        </span>
      </div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
        <span suppressHydrationWarning>{greeting}</span>
        <Sparkles className="hidden h-5 w-5 shrink-0 animate-pulse text-accent-warm sm:inline-block" />
      </h1>
      <p className="text-sm text-text-muted">
        Your day, your shore. Here is your personal headquarters.
      </p>
    </div>
  );
}
