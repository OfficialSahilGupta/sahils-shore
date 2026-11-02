"use client";

// ============================================================================
// Sahil's Shore: Appearance Customizer Component
// Presets, Mode, Accent Color with WCAG AA checker, Fonts, Radius, Density, Backgrounds
// ============================================================================

import React, { useState } from "react";
import { useThemeConfig } from "@/lib/theme/ThemeContext";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { CURATED_SWATCHES } from "@/lib/theme/colors";
import type {
  ThemePresetId,
  ThemeFont,
  ThemeRadius,
  ThemeDensity,
  BackgroundStyle,
  ThemeMode,
} from "@/lib/theme/types";
import {
  Sun,
  Moon,
  Laptop,
  Check,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Sliders,
  Palette,
  Type,
  Maximize2,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

export function AppearanceSettings() {
  const {
    config,
    resolvedMode,
    contrastNotice,
    isSaving,
    setPreset,
    setMode,
    setAccentColor,
    setFont,
    setRadius,
    setDensity,
    setBackground,
    resetTheme,
    saveThemeToSupabase,
  } = useThemeConfig();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customHex, setCustomHex] = useState(config.accentColor || "#1F7A8C");

  const handleSave = async () => {
    const success = await saveThemeToSupabase();
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleCustomHexChange = (hex: string) => {
    setCustomHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      setAccentColor(hex);
    }
  };

  const presetsList = Object.values(THEME_PRESETS);

  const fontOptions: { id: ThemeFont; label: string; sample: string }[] = [
    { id: "inter", label: "Inter", sample: "Clean modern sans-serif" },
    { id: "geist", label: "Geist", sample: "High precision developer UI" },
    { id: "dm-sans", label: "DM Sans", sample: "Geometric and approachable" },
    { id: "lora", label: "Lora (Serif)", sample: "Editorial and literary warmth" },
  ];

  const radiusOptions: { id: ThemeRadius; label: string; desc: string }[] = [
    { id: "none", label: "Sharp", desc: "0px" },
    { id: "sm", label: "Subtle", desc: "6px" },
    { id: "md", label: "Rounded", desc: "12px" },
    { id: "lg", label: "Pill-Soft", desc: "18px" },
    { id: "full", label: "Circular", desc: "Full" },
  ];

  const densityOptions: { id: ThemeDensity; label: string; desc: string }[] = [
    { id: "compact", label: "Compact", desc: "High information density, condensed padding" },
    { id: "comfortable", label: "Comfortable", desc: "Balanced spacing, standard Shore layout" },
    { id: "spacious", label: "Spacious", desc: "Relaxed breathing room, touch-friendly" },
  ];

  const bgStyles: { id: BackgroundStyle; label: string; desc: string }[] = [
    { id: "solid", label: "Solid Color", desc: "Default clean background" },
    { id: "gradient", label: "Coastal Gradient", desc: "Gentle sunrise mesh" },
    { id: "glass", label: "Glassmorphism", desc: "Frosted blur & translucent surface" },
    { id: "image", label: "Custom Image", desc: "Subtle wallpaper overlay" },
  ];

  return (
    <div className="space-y-8">
      {/* Action Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            Appearance & Brand
          </h2>
          <p className="text-xs text-text-muted">
            Customize the theme presets, mode, accent palette, and spatial rhythm.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetTheme}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                <span>Saved to Cloud</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. Theme Mode (Light / Dark / Auto) */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-accent-warm" />
          <h3 className="text-sm font-semibold text-text">Display Mode</h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              { id: "light", label: "Shore Light", icon: Sun },
              { id: "dark", label: "Midnight Dark", icon: Moon },
              { id: "system", label: "System Auto", icon: Laptop },
            ] as const
          ).map((m) => {
            const isSelected = config.mode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-surface-muted/60 text-text hover:bg-surface-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 7 Presets */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">Coastal Presets</h3>
          </div>
          <span className="text-[11px] text-text-muted font-mono">7 Curated</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {presetsList.map((p) => {
            const isSelected = config.preset === p.id;
            const previewColors = resolvedMode === "dark" ? p.dark : p.light;

            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-surface-muted/40 hover:border-border hover:bg-surface-muted"
                }`}
              >
                {/* Preset Color Swatch Stack */}
                <div className="mt-0.5 flex h-9 w-9 shrink-0 flex-col overflow-hidden rounded-xl border border-border shadow-inner">
                  <div
                    className="h-1/2 w-full"
                    style={{ backgroundColor: previewColors.background }}
                  />
                  <div
                    className="h-1/2 w-full flex items-center justify-center"
                    style={{ backgroundColor: previewColors.primary }}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3" style={{ color: previewColors.primaryForeground }} />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text">{p.name}</span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.accentColor }}
                    />
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-text-muted leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Accent Color Picker & WCAG AA Contrast Evaluation */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-warm" />
            <h3 className="text-sm font-semibold text-text">Accent Palette</h3>
          </div>

          <div
            suppressHydrationWarning
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              contrastNotice.passesAA
                ? "bg-success/10 text-success border border-success/30"
                : "bg-danger/10 text-danger border border-danger/30"
            }`}
          >
            <span suppressHydrationWarning>WCAG {contrastNotice.level} ({contrastNotice.ratio}:1)</span>
          </div>
        </div>

        {/* Warning banner if contrast fails */}
        {!contrastNotice.passesAA && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
            <p className="leading-relaxed">
              {contrastNotice.warning ||
                "This accent color has low contrast against the surface background. Consider a deeper or brighter shade."}
            </p>
          </div>
        )}

        {/* Curated Swatches */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-muted">
            Curated Color Swatches
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {CURATED_SWATCHES.map((swatch) => {
              const isSelected = config.accentColor?.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  onClick={() => {
                    setAccentColor(swatch.hex);
                    setCustomHex(swatch.hex);
                  }}
                  title={`${swatch.name} (${swatch.hex})`}
                  className={`group relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-surface scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {isSelected && <Check className="h-4 w-4 text-white drop-shadow-sm" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hex Input & HTML5 Color Input */}
        <div className="flex items-center gap-3 pt-1">
          <div className="relative flex items-center">
            <input
              type="color"
              value={config.accentColor || "#1F7A8C"}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-xl border border-border bg-transparent p-0.5"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-muted">HEX:</span>
            <input
              type="text"
              value={customHex}
              maxLength={7}
              onChange={(e) => handleCustomHexChange(e.target.value)}
              placeholder="#1F7A8C"
              className="h-9 w-28 rounded-xl border border-border bg-surface-muted px-2.5 font-mono text-xs text-text uppercase outline-none focus:border-primary"
            />
          </div>
          <span className="text-[11px] text-text-muted">
            Regenerates primary, soft, and ring CSS tokens dynamically.
          </span>
        </div>
      </section>

      {/* 4. Font Choice */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-text">Typography</h3>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {fontOptions.map((f) => {
            const isSelected = config.font === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                className={`flex items-start justify-between rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-muted/50 text-text hover:bg-surface-muted"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{f.label}</div>
                  <div className="mt-0.5 text-[11px] text-text-muted">{f.sample}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Border Radius & Layout Density */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Border Radius */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">Border Radius</h3>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {radiusOptions.map((r) => {
              const isSelected = config.radius === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRadius(r.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  <span className="text-xs">{r.label}</span>
                  <span className="text-[10px] opacity-75">{r.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Spatial Density */}
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">Spatial Density</h3>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {densityOptions.map((d) => {
              const isSelected = config.density === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDensity(d.id)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted"
                  }`}
                >
                  <span className="text-xs">{d.label}</span>
                  <span className="line-clamp-1 text-[10px] opacity-75">{d.desc}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* 6. Background Style & Glassmorphism */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-text">Background & Atmosphere</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {bgStyles.map((b) => {
            const isSelected = config.background.style === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setBackground({ style: b.id })}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                <span className="text-xs font-semibold">{b.label}</span>
                <span className="mt-0.5 text-[10px] opacity-80">{b.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Glassmorphism Controls */}
        {config.background.style === "glass" && (
          <div className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4">
            <h4 className="text-xs font-semibold text-text">Glassmorphism Settings</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Blur Strength</span>
                  <span className="font-mono text-primary">{config.background.blur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={config.background.blur}
                  onChange={(e) => setBackground({ blur: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Surface Opacity</span>
                  <span className="font-mono text-primary">{config.background.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={config.background.opacity}
                  onChange={(e) => setBackground({ opacity: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Custom Image URL input */}
        {config.background.style === "image" && (
          <div className="space-y-2 rounded-xl border border-border bg-surface-muted/40 p-4">
            <h4 className="text-xs font-semibold text-text">Wallpaper Image URL</h4>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-text-muted" />
              <input
                type="url"
                value={config.background.imageUrl || ""}
                onChange={(e) => setBackground({ imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-primary"
              />
            </div>
            <p className="text-[11px] text-text-muted">
              Use a subtle texture or coastal background. Stored in local settings and synced with Supabase.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
