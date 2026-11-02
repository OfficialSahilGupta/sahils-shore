"use client";

// ============================================================================
// Sahil's Shore: Theme Live Preview Panel
// Real-time preview of cards, buttons, badges, typography, and Recharts charts
// ============================================================================

import React from "react";
import { useThemeConfig } from "@/lib/theme/ThemeContext";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { WaveLogo } from "@/components/common/WaveLogo";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Compass,
} from "lucide-react";

const SAMPLE_CHART_DATA = [
  { day: "Mon", focus: 3.5, spend: 450 },
  { day: "Tue", focus: 5.0, spend: 320 },
  { day: "Wed", focus: 4.2, spend: 890 },
  { day: "Thu", focus: 6.5, spend: 210 },
  { day: "Fri", focus: 5.8, spend: 540 },
  { day: "Sat", focus: 7.2, spend: 1200 },
  { day: "Sun", focus: 4.8, spend: 680 },
];

export function ThemePreviewPanel() {
  const { config, activePresetId, resolvedMode, contrastNotice } = useThemeConfig();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const preset = THEME_PRESETS[activePresetId] || THEME_PRESETS.shore;

  return (
    <div className="sticky top-20 space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <WaveLogo size={28} />
          <div>
            <h3 className="text-sm font-semibold text-text">Live Preview</h3>
            <p className="text-[11px] text-text-muted" suppressHydrationWarning>
              {preset.name} • {mounted ? resolvedMode.toUpperCase() : "THEME"}
            </p>
          </div>
        </div>

        {/* WCAG AA Badge */}
        <div
          suppressHydrationWarning
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
            contrastNotice.passesAA
              ? "bg-success/10 text-success border border-success/30"
              : "bg-danger/10 text-danger border border-danger/30"
          }`}
          title={`Contrast ratio: ${contrastNotice.ratio}:1`}
        >
          <ShieldCheck className="h-3 w-3" />
          <span suppressHydrationWarning>
            WCAG {contrastNotice.level} ({contrastNotice.ratio}:1)
          </span>
        </div>
      </div>

      {/* Sample Shore Card */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface-muted/50 p-4 transition-all">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
              <Sparkles className="h-2.5 w-2.5" />
              DSA Tracker • Active Sprint
            </span>
            <h4 className="text-sm font-semibold text-text">
              Dynamic Programming & Graphs
            </h4>
            <p className="text-xs text-text-muted">
              3 problems solved today • 7-day streak maintained
            </p>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>

        {/* Mini Recharts Metric Visualizer */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-medium text-text-muted">
              <TrendingUp className="h-3 w-3 text-primary" />
              Weekly Focus Rhythm (Hours)
            </span>
            <span className="font-mono font-semibold text-primary">37.0 hrs total</span>
          </div>

          <div className="h-28 w-full rounded-xl border border-border bg-surface p-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SAMPLE_CHART_DATA}>
                  <defs>
                    <linearGradient id="preview-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-muted)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={[0, 8]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "11px",
                      color: "var(--text)",
                    }}
                    formatter={(value: number) => [`${value} hrs`, "Focus Time"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="focus"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#preview-gradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                Loading chart rhythm...
              </div>
            )}
          </div>
        </div>

        {/* Interactive Elements / Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-95">
            <span>Primary Action</span>
            <ArrowRight className="h-3 w-3" />
          </button>

          <button className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition-colors hover:bg-surface-muted">
            Secondary
          </button>

          <span className="flex items-center gap-1 rounded-xl bg-surface px-2.5 py-1.5 text-[11px] text-text-muted">
            <Clock className="h-3 w-3 text-accent-warm" />
            <span>IST 10:30 AM</span>
          </span>
        </div>
      </div>

      {/* Applied Variables Summary */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted">
        <div className="rounded-xl bg-surface-muted p-2">
          <span className="block text-[10px] uppercase tracking-wider">Font Family</span>
          <span className="font-medium text-text capitalize">{config.font}</span>
        </div>
        <div className="rounded-xl bg-surface-muted p-2">
          <span className="block text-[10px] uppercase tracking-wider">Border Radius</span>
          <span className="font-medium text-text uppercase">{config.radius}</span>
        </div>
        <div className="rounded-xl bg-surface-muted p-2">
          <span className="block text-[10px] uppercase tracking-wider">Density</span>
          <span className="font-medium text-text capitalize">{config.density}</span>
        </div>
        <div className="rounded-xl bg-surface-muted p-2">
          <span className="block text-[10px] uppercase tracking-wider">Background</span>
          <span className="font-medium text-text capitalize">{config.background.style}</span>
        </div>
      </div>
    </div>
  );
}
