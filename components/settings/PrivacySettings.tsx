"use client";

// ============================================================================
// Sahil's Shore: Privacy & Security Settings Component
// Stub for PIN/Biometric lock on sensitive modules (Journal, Expenses, Media)
// ============================================================================

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import {
  Lock,
  KeyRound,
  Shield,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface PrivacyConfig {
  lock_journal: boolean;
  lock_expenses: boolean;
  lock_media: boolean;
  auto_lock_minutes: number;
}

const DEFAULT_PRIVACY: PrivacyConfig = {
  lock_journal: false,
  lock_expenses: false,
  lock_media: false,
  auto_lock_minutes: 5,
};

export function PrivacySettings() {
  const [privacy, setPrivacy] = useState<PrivacyConfig>(DEFAULT_PRIVACY);
  const [pin, setPin] = useState<string>("");
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("shore_privacy_config");
      if (cached) setPrivacy(JSON.parse(cached));
    } catch {}

    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          supabase
            .from("settings")
            .select("privacy")
            .eq("user_id", data.user.id)
            .single()
            .then(({ data: settingsData }) => {
              if (
                settingsData?.privacy &&
                typeof settingsData.privacy === "object"
              ) {
                const sbPrivacy = settingsData.privacy as Partial<PrivacyConfig>;
                setPrivacy((prev) => ({ ...prev, ...sbPrivacy }));
              }
            });
        }
      });
    } catch {}
  }, []);

  const handleToggle = (key: keyof Omit<PrivacyConfig, "auto_lock_minutes">) => {
    setPrivacy((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("shore_privacy_config", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("settings")
          .update({
            privacy: privacy as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            Privacy & Vault Locks
          </h2>
          <p className="text-xs text-text-muted">
            Configure biometric or PIN lock protection for confidential areas of your shore.
          </p>
        </div>

        <button
          onClick={handleSaveToCloud}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
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

      {/* Status Card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-text">
              Zero-Knowledge Local Lock (Phase 2 Stub)
            </h3>
            <p className="text-[11px] leading-relaxed text-text-muted">
              Preferences set here are saved in Supabase `settings.privacy`. When active, entering locked modules
              prompts for your local PIN or device biometric key before decrypting sensitive logs.
            </p>
          </div>
        </div>
      </div>

      {/* Module Lock Toggles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text">Protected Modules</h3>

        <div className="space-y-2">
          {/* Journal */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-text">Lock Journal & Reflection</span>
              <p className="text-[11px] text-text-muted">
                Requires PIN to view daily gratitude, mood trends, and reflection logs.
              </p>
            </div>
            <button
              onClick={() => handleToggle("lock_journal")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                privacy.lock_journal
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface-muted text-text-muted"
              }`}
            >
              <Lock className="h-3 w-3" />
              <span>{privacy.lock_journal ? "Locked" : "Unlocked"}</span>
            </button>
          </div>

          {/* Expenses */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-text">Lock Expense Tracker</span>
              <p className="text-[11px] text-text-muted">
                Hides financial cashflow, balances, and transaction history.
              </p>
            </div>
            <button
              onClick={() => handleToggle("lock_expenses")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                privacy.lock_expenses
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface-muted text-text-muted"
              }`}
            >
              <Lock className="h-3 w-3" />
              <span>{privacy.lock_expenses ? "Locked" : "Unlocked"}</span>
            </button>
          </div>

          {/* Media Vault */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-text">Lock Media Vault</span>
              <p className="text-[11px] text-text-muted">
                Protects Google Drive photo/video sync and private captures.
              </p>
            </div>
            <button
              onClick={() => handleToggle("lock_media")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-all ${
                privacy.lock_media
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface-muted text-text-muted"
              }`}
            >
              <Lock className="h-3 w-3" />
              <span>{privacy.lock_media ? "Locked" : "Unlocked"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Lock Timeout */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text">Auto-Lock Inactivity Timeout</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Immediate", val: 0 },
            { label: "5 Minutes", val: 5 },
            { label: "15 Minutes", val: 15 },
          ].map((opt) => {
            const isSelected = privacy.auto_lock_minutes === opt.val;
            return (
              <button
                key={opt.val}
                onClick={() => setPrivacy((prev) => ({ ...prev, auto_lock_minutes: opt.val }))}
                className={`rounded-xl border p-2.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-muted/50 text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
