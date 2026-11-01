"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted ${className}`}
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to Shore Light" : "Switch to Midnight Tide Dark"}
      title={isDark ? "Switch to Shore Light" : "Switch to Midnight Tide Dark"}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text transition-colors hover:bg-surface-muted ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-accent-warm transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-primary transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
