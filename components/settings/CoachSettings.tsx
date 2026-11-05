"use client";

// ============================================================================
// Sahil's Shore: AI Coach Settings Component
// Instant toggle AI Coach, privacy opt-in for journal, provider routing,
// dual persistence (localStorage + Supabase), and real-time event dispatch
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCoachSettings,
  saveCoachSettings,
  parseCoachSettings,
  DEFAULT_COACH_SETTINGS,
} from "@/lib/coach/service";
import type { CoachSettingsConfig } from "@/lib/coach/types";
import { useToast } from "@/components/ui/toast";
import {
  Sparkles,
  ShieldCheck,
  Save,
  CheckCircle2,
  Bot,
  Sliders,
  Check,
} from "lucide-react";

export const SHORE_AI_COACH_STORAGE_KEY = "shore_ai_coach_config";
export const SHORE_AI_COACH_EVENT = "shore_ai_coach_config_changed";

export function CoachSettings() {
  const [config, setConfig] = useState<CoachSettingsConfig>(DEFAULT_COACH_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const userEditedRef = useRef(false);

  const { toast } = useToast();

  // Load configuration on mount:
  // 1. Immediately read from localStorage for 0ms latency
  // 2. Query Supabase in the background to sync cloud preference
  useEffect(() => {
    try {
      const cached = localStorage.getItem(SHORE_AI_COACH_STORAGE_KEY);
      if (cached) {
        const parsed = parseCoachSettings(cached);
        setConfig(parsed);
        setIsLoading(false);
      }
    } catch (e) {
      console.warn("Failed to read coach settings from localStorage:", e);
    }

    const loadRemote = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          const remote = await getCoachSettings(supabase, user.id);
          // Only overwrite if the user hasn't actively interacted in this session
          if (!userEditedRef.current) {
            setConfig(remote);
            try {
              localStorage.setItem(SHORE_AI_COACH_STORAGE_KEY, JSON.stringify(remote));
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote coach settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRemote();
  }, []);

  // Shared persistence function: writes to localStorage, dispatches event, and syncs to Supabase / API
  const persistConfig = useCallback(
    async (
      newConfig: CoachSettingsConfig,
      options?: { showToast?: boolean; successTitle?: string; successDesc?: string }
    ) => {
      // 1. Mark as user-modified to block any in-flight background loadRemote overwrite
      userEditedRef.current = true;

      // 2. Update React state immediately
      setConfig(newConfig);

      // 2. Persist to localStorage immediately
      try {
        localStorage.setItem(SHORE_AI_COACH_STORAGE_KEY, JSON.stringify(newConfig));
      } catch (e) {
        console.warn("Failed to write coach settings to localStorage:", e);
      }

      // 3. Dispatch global custom event for real-time app reactivity
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SHORE_AI_COACH_EVENT, { detail: newConfig })
        );
      }

      // 4. Sync remotely to Supabase or API route
      let remoteSuccess = false;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await saveCoachSettings(supabase, user.id, newConfig);
          remoteSuccess = true;
        } else {
          // Attempt API route PATCH if unauthenticated or proxy session
          const res = await fetch("/api/coach", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newConfig),
          });
          if (res.ok) remoteSuccess = true;
        }
      } catch (err) {
        console.warn("Remote sync failed, preference safely saved on device:", err);
      }

      if (options?.showToast !== false) {
        toast({
          title: options?.successTitle || "Preferences Updated",
          description:
            options?.successDesc ||
            (remoteSuccess
              ? "Saved and synced with your shore."
              : "Preference saved locally on this device."),
          type: "success",
        });
      }

      return remoteSuccess;
    },
    [toast]
  );

  // Toggle 1: Enable / Disable AI Coach
  const handleToggleEnable = async () => {
    const nextEnabled = !config.enabled;
    const nextConfig: CoachSettingsConfig = { ...config, enabled: nextEnabled };

    await persistConfig(nextConfig, {
      showToast: true,
      successTitle: nextEnabled ? "AI Coach Enabled" : "AI Coach Disabled",
      successDesc: nextEnabled
        ? "Daily calibrations and suggested priorities are now active."
        : "AI Coach insights are now hidden across Shore.",
    });
  };

  // Toggle 2: Journal Privacy Opt-In
  const handleToggleJournal = async () => {
    const nextOptIn = !config.opt_in_journal;
    const nextConfig: CoachSettingsConfig = { ...config, opt_in_journal: nextOptIn };

    await persistConfig(nextConfig, {
      showToast: true,
      successTitle: nextOptIn ? "Journal Reflections Included" : "Journal Excluded",
      successDesc: nextOptIn
        ? "High-level journal reflections will help calibrate the AI coach."
        : "Journal entries are excluded from AI coach context.",
    });
  };

  // Provider Selection
  const handleSelectProvider = async (provider: "auto" | "gemini" | "anthropic" | "heuristic") => {
    if (config.provider === provider) return;
    const nextConfig: CoachSettingsConfig = { ...config, provider };

    const labels: Record<string, string> = {
      auto: "Auto (Gemini > Claude > Heuristic)",
      gemini: "Gemini 1.5/2.0",
      anthropic: "Claude 3.5",
      heuristic: "Offline Heuristic",
    };

    await persistConfig(nextConfig, {
      showToast: true,
      successTitle: "Provider Preference Saved",
      successDesc: `Active engine set to ${labels[provider]}.`,
    });
  };

  // Manual explicit "Save Preferences" button at bottom
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await persistConfig(config, {
        showToast: true,
        successTitle: "Settings Saved",
        successDesc: "Your AI Coach preferences have been saved.",
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-surface-muted" />
        <div className="h-24 w-full rounded-2xl bg-surface-muted" />
        <div className="h-24 w-full rounded-2xl bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
        <div>
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

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Controls Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-6">
        {/* Toggle 1: Enable AI Coach */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-text">Enable AI Coach</h3>
            </div>
            <p className="text-xs text-text-muted">
              Display daily 3-line calibrations, patterns, suggested priorities, and weekly reviews on your Dashboard and Analytics page.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                config.enabled
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-surface-muted text-text-muted border border-border"
              }`}
            >
              {config.enabled ? "Active" : "Disabled"}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={config.enabled}
              aria-label="Toggle AI Coach on or off"
              onClick={handleToggleEnable}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                config.enabled
                  ? "bg-primary border-primary"
                  : "bg-surface-muted border-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  config.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
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

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                config.opt_in_journal
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-surface-muted text-text-muted border border-border"
              }`}
            >
              {config.opt_in_journal ? "Included" : "Excluded"}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={config.opt_in_journal}
              aria-label="Toggle journal reflection opt-in"
              onClick={handleToggleJournal}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                config.opt_in_journal
                  ? "bg-primary border-primary"
                  : "bg-surface-muted border-border"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  config.opt_in_journal ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Provider Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <label className="text-xs font-semibold text-text uppercase tracking-wider">
              Engine & Provider Preference
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {[
              { id: "auto", label: "Auto (Recommended)", desc: "Gemini > Claude > Heuristic" },
              { id: "gemini", label: "Gemini 1.5/2.0", desc: "Requires GEMINI_API_KEY" },
              { id: "anthropic", label: "Claude 3.5", desc: "Requires ANTHROPIC_API_KEY" },
              { id: "heuristic", label: "Offline Heuristic", desc: "Zero API / 100% Local" },
            ].map((prov) => {
              const isSelected = (config.provider || "auto") === prov.id;
              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => handleSelectProvider(prov.id as any)}
                  className={`rounded-xl border p-3 text-left transition-all relative ${
                    isSelected
                      ? "border-primary bg-primary/10 text-text shadow-sm ring-1 ring-primary/40"
                      : "border-border bg-surface hover:bg-surface-muted text-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text">{prov.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">{prov.desc}</div>
                </button>
              );
            })}
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
    </div>
  );
}
