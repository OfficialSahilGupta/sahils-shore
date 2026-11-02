"use client";

// ============================================================================
// Sahil's Shore: Theme Engine Context & Provider
// Manages dynamic CSS variables, presets, fonts, density, and persistence
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import type {
  ThemeConfig,
  ThemePresetId,
  ThemeFont,
  ThemeRadius,
  ThemeDensity,
  ThemeMode,
} from "./types";
import { THEME_PRESETS, DEFAULT_THEME_CONFIG } from "./presets";
import { generateAccentTokens, checkWcagContrast } from "./colors";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export const FONT_MAP: Record<ThemeFont, string> = {
  inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  geist: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  "dm-sans": '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lora: '"Lora", Georgia, Cambria, "Times New Roman", serif',
};

const RADIUS_MAP: Record<ThemeRadius, string> = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "18px",
  full: "9999px",
};

interface ThemeContextValue {
  config: ThemeConfig;
  activePresetId: ThemePresetId;
  resolvedMode: "light" | "dark";
  isSaving: boolean;
  mounted: boolean;
  contrastNotice: ReturnType<typeof checkWcagContrast>;
  setPreset: (presetId: ThemePresetId) => void;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (hex: string) => void;
  setFont: (font: ThemeFont) => void;
  setRadius: (radius: ThemeRadius) => void;
  setDensity: (density: ThemeDensity) => void;
  setBackground: (bg: Partial<ThemeConfig["background"]>) => void;
  resetTheme: () => void;
  saveThemeToSupabase: () => Promise<boolean>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "shore_theme_config";

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fallback to "light" during SSR to guarantee deterministic hydration
  const resolvedMode: "light" | "dark" = mounted
    ? (resolvedTheme === "dark" || theme === "dark")
      ? "dark"
      : "light"
    : "light";

  // Load from localStorage and Supabase ONCE on mount
  useEffect(() => {
    setMounted(true);
    let hasLocalConfig = false;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        hasLocalConfig = true;
        const parsed = JSON.parse(cached);
        setConfig((prev) => ({ ...prev, ...parsed }));
        if (parsed.mode) {
          setTheme(parsed.mode);
        }
      }
    } catch (e) {
      console.warn("Failed to load theme from localStorage:", e);
    }

    // Attempt to load from Supabase for logged-in user ONLY IF no local settings exist
    // to prevent asynchronous overwriting of active user choices
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user && !hasLocalConfig) {
          supabase
            .from("settings")
            .select("theme")
            .eq("user_id", data.user.id)
            .single()
            .then(({ data: settingsData }) => {
              if (settingsData?.theme && typeof settingsData.theme === "object") {
                const sbTheme = settingsData.theme as Partial<ThemeConfig>;
                setConfig((prev) => {
                  const merged = { ...prev, ...sbTheme };
                  try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                  } catch {}
                  return merged;
                });
                if (sbTheme.mode) {
                  setTheme(sbTheme.mode);
                }
              }
            });
        }
      });
    } catch {
      // Ignored if supabase is not initialized
    }
  }, [setTheme]);

  // Apply CSS Variables to Document
  const applyCssVariables = useCallback(
    (cfg: ThemeConfig, mode: "light" | "dark") => {
      if (typeof document === "undefined") return;

      const root = document.documentElement;
      const preset = THEME_PRESETS[cfg.preset] || THEME_PRESETS.shore;
      const colors = mode === "dark" ? preset.dark : preset.light;

      // Base Palette from preset
      root.style.setProperty("--background", colors.background);
      root.style.setProperty("--surface", colors.surface);
      root.style.setProperty("--surface-muted", colors.surfaceMuted);
      root.style.setProperty("--text", colors.text);
      root.style.setProperty("--text-muted", colors.textMuted);
      root.style.setProperty("--border", colors.border);
      root.style.setProperty("--accent-warm", colors.accentWarm);
      root.style.setProperty("--success", colors.success);
      root.style.setProperty("--warning", colors.warning);
      root.style.setProperty("--danger", colors.danger);

      // Custom or Preset Accent Color
      const activeAccent = cfg.accentColor || preset.accentColor;
      const accentTokens = generateAccentTokens(activeAccent, mode === "dark");

      root.style.setProperty("--primary", accentTokens.primary);
      root.style.setProperty("--primary-soft", accentTokens.primarySoft);
      root.style.setProperty("--primary-foreground", accentTokens.primaryForeground);
      root.style.setProperty("--ring", accentTokens.ring);
      root.style.setProperty("--accent", accentTokens.primarySoft);
      root.style.setProperty("--accent-foreground", colors.text);

      // Border Radius
      const radiusVal = RADIUS_MAP[cfg.radius] || "12px";
      root.style.setProperty("--radius", radiusVal);
      root.setAttribute("data-radius", cfg.radius);

      // Font Family: set on :root and directly on body
      const fontStack = FONT_MAP[cfg.font] || FONT_MAP.inter;
      root.style.setProperty("--font-sans", fontStack);
      root.setAttribute("data-font", cfg.font);
      if (document.body) {
        document.body.style.fontFamily = fontStack;
        document.body.setAttribute("data-font", cfg.font);
      }

      // Density attribute
      root.setAttribute("data-density", cfg.density);
      if (document.body) {
        document.body.setAttribute("data-density", cfg.density);
      }

      // Background Style & Glassmorphism variables
      root.style.setProperty("--glass-blur", `${cfg.background.blur}px`);
      root.style.setProperty("--glass-opacity", `${cfg.background.opacity / 100}`);

      if (cfg.background.style === "glass") {
        root.setAttribute("data-bg-style", "glass");
      } else if (cfg.background.style === "gradient") {
        root.setAttribute("data-bg-style", "gradient");
      } else if (cfg.background.style === "image" && cfg.background.imageUrl) {
        root.setAttribute("data-bg-style", "image");
        root.style.setProperty("--bg-image-url", `url('${cfg.background.imageUrl}')`);
      } else {
        root.setAttribute("data-bg-style", "solid");
        root.style.removeProperty("--bg-image-url");
      }
    },
    []
  );

  // Sync to DOM whenever config or mode changes
  useEffect(() => {
    if (mounted) {
      applyCssVariables(config, resolvedMode);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (e) {
        console.warn("Failed to persist theme to localStorage:", e);
      }
    }
  }, [config, resolvedMode, mounted, applyCssVariables]);

  // Actions
  const setPreset = useCallback((presetId: ThemePresetId) => {
    const preset = THEME_PRESETS[presetId];
    if (!preset) return;
    setConfig((prev) => {
      const next = {
        ...prev,
        preset: presetId,
        accentColor: preset.accentColor,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setMode = useCallback(
    (mode: ThemeMode) => {
      setTheme(mode);
      try {
        localStorage.setItem("theme", mode);
      } catch {}
      setConfig((prev) => {
        const next = { ...prev, mode };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [setTheme]
  );

  const setAccentColor = useCallback((hex: string) => {
    setConfig((prev) => {
      const next = { ...prev, accentColor: hex };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setFont = useCallback((font: ThemeFont) => {
    setConfig((prev) => {
      const next = { ...prev, font };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setRadius = useCallback((radius: ThemeRadius) => {
    setConfig((prev) => {
      const next = { ...prev, radius };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setDensity = useCallback((density: ThemeDensity) => {
    setConfig((prev) => {
      const next = { ...prev, density };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setBackground = useCallback((bg: Partial<ThemeConfig["background"]>) => {
    setConfig((prev) => {
      const next = {
        ...prev,
        background: { ...prev.background, ...bg },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const resetTheme = useCallback(() => {
    setConfig(DEFAULT_THEME_CONFIG);
    setTheme("system");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [setTheme]);

  const saveThemeToSupabase = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsSaving(false);
        return false;
      }

      const { error } = await supabase
        .from("settings")
        .update({
          theme: config as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      setIsSaving(false);
      return !error;
    } catch (err) {
      console.error("Failed to save theme to Supabase:", err);
      setIsSaving(false);
      return false;
    }
  }, [config]);

  // Compute WCAG AA contrast check against the current surface background
  const activePreset = THEME_PRESETS[config.preset] || THEME_PRESETS.shore;
  const currentColors = resolvedMode === "dark" ? activePreset.dark : activePreset.light;
  const contrastNotice = checkWcagContrast(
    config.accentColor || activePreset.accentColor,
    currentColors.surface
  );

  return (
    <ThemeContext.Provider
      value={{
        config,
        activePresetId: config.preset,
        resolvedMode,
        isSaving,
        mounted,
        contrastNotice,
        setPreset,
        setMode,
        setAccentColor,
        setFont,
        setRadius,
        setDensity,
        setBackground,
        resetTheme,
        saveThemeToSupabase,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeConfig must be used within a ThemeConfigProvider");
  }
  return ctx;
}
