"use client";

// ============================================================================
// Sahil's Shore: AI Coach Settings Component
// Toggle AI Coach, privacy opt-in for journal, and provider status indicators
// ============================================================================

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCoachSettings, saveCoachSettings, DEFAULT_COACH_SETTINGS } from "@/lib/coach/service";
import type { CoachSettingsConfig } from "@/lib/coach/types";
import { useToast } from "@/components/ui/toast";
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Lock,
  Save,
  CheckCircle,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

export function CoachSettings() {
  const [config, setConfig] = useState<CoachSettingsConfig>(DEFAULT_COACH_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const current = await getCoachSettings(supabase, user.id);
          setConfig(current);
        }
      } catch (err) {
        console.error("Failed to load coach settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    try {
      setIsSaving(true);
      const supabase = createClient();
      await saveCoachSettings(supabase, userId, config);
      toast({
        title: "Settings Saved",
        description: "Your AI Coach preferences have been updated.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error saving settings",
        description: err.message,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-surface-muted" />
        <div className="h-20 w-full rounded bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
          <span>Intelligence & Coaching</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl mt-0.5">
          AI Coach Configuration
        </h2>
        <p className="text-xs text-text-muted sm:text-sm mt-1">
          Configure how Sahil&apos;s Shore analyzes your daily timeline and generates morning alignments.
        </p>
      </div>

      {/* Main Controls Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-6">
        {/* Toggle 1: Enable AI Coach */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-text">Enable AI Coach</h3>
            <p className="text-xs text-text-muted">
              Display daily 3-line calibrations, patterns, suggested priorities, and weekly reviews on your Dashboard and Analytics page.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.enabled ? "bg-primary" : "bg-surface-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                config.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-border" />

        {/* Toggle 2: Journal Privacy Opt-In */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-text">
                Include Journal Reflections (Opt-in)
              </h3>
              <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                Privacy Protected
              </span>
            </div>
            <p className="text-xs text-text-muted">
              When enabled, high-level wins and lessons from your daily journal are synthesized to enhance coaching relevance. Free-text entries remain private and are strictly scrubbed of emails, credentials, and sensitive contact info.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.opt_in_journal}
            onClick={() =>
              setConfig((prev) => ({ ...prev, opt_in_journal: !prev.opt_in_journal }))
            }
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              config.opt_in_journal ? "bg-primary" : "bg-surface-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                config.opt_in_journal ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-border" />

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text uppercase tracking-wider">
            Engine & Provider Preference
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {[
              { id: "auto", label: "Auto (Recommended)", desc: "Gemini > Claude > Heuristic" },
              { id: "gemini", label: "Gemini 1.5/2.0", desc: "Requires GEMINI_API_KEY" },
              { id: "anthropic", label: "Claude 3.5", desc: "Requires ANTHROPIC_API_KEY" },
              { id: "heuristic", label: "Offline Heuristic", desc: "Zero API / 100% Local" },
            ].map((prov) => (
              <button
                key={prov.id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, provider: prov.id as any }))}
                className={`rounded-xl border p-3 text-left transition-all ${
                  (config.provider || "auto") === prov.id
                    ? "border-primary bg-primary/10 text-text shadow-sm"
                    : "border-border bg-surface hover:bg-surface-muted text-text-muted"
                }`}
              >
                <div className="text-xs font-bold text-text">{prov.label}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{prov.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Guarantees Box */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span>Strict Privacy & Air-Gap Guarantees</span>
        </div>
        <ul className="text-xs text-text-muted space-y-1.5 list-disc list-inside">
          <li>
            <strong>Exact GPS coordinates</strong> are stripped before any LLM prompt. Only generalized city/region is preserved.
          </li>
          <li>
            <strong>Receipt images and media binaries</strong> are NEVER uploaded to third-party AI APIs.
          </li>
          <li>
            <strong>Server-side only execution:</strong> API keys reside exclusively in server environment variables and are never transmitted to browser clients.
          </li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:opacity-95 transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
        </button>
      </div>
    </div>
  );
}
