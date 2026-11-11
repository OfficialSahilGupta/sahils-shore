"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeConfig } from "@/lib/theme/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedMode, setMode, mounted } = useThemeConfig();

  if (!mounted) {
    return (
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted ${className}`}
        aria-hidden="true"
      >
        <span className="h-4 w-4" />
      </div>
    );
  }

  const isDark = resolvedMode === "dark";

  const handleToggle = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={handleToggle}
      aria-label={isDark ? "Switch to Shore Light" : "Switch to Midnight Tide Dark"}
      title={isDark ? "Switch to Shore Light" : "Switch to Midnight Tide Dark"}
      className={`group relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${
        isDark
          ? "border-accent-warm/40 bg-accent-warm/15 text-accent-warm shadow-[0_0_16px_rgba(232,178,106,0.35)] hover:border-accent-warm/70 hover:bg-accent-warm/25 hover:shadow-[0_0_22px_rgba(232,178,106,0.55)]"
          : "border-primary/30 bg-primary/10 text-primary shadow-[0_0_14px_rgba(31,122,140,0.22)] hover:border-primary/60 hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(31,122,140,0.38)]"
      } ${className}`}
    >
      {/* Radiant Atmosphere Halo */}
      <span
        className={`pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          isDark
            ? "bg-accent-warm/15 blur-sm"
            : "bg-primary/15 blur-sm"
        }`}
        aria-hidden="true"
      />

      {/* Animated Glowing Theme Icon */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark-sun" : "light-moon"}
          initial={{ rotate: -60, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 60, scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative z-10 flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-accent-warm drop-shadow-[0_0_8px_rgba(232,178,106,0.9)] transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <Moon className="h-4 w-4 text-primary drop-shadow-[0_0_8px_rgba(31,122,140,0.8)] transition-transform duration-300 group-hover:-rotate-12" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
