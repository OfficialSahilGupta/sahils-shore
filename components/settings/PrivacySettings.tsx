"use client";

// ============================================================================
// Sahil's Shore: Privacy & Security Settings Component
// Biometric & PIN lock protection for confidential areas (Journal, Expenses, Media)
// ============================================================================

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";
import {
  hashPin,
  generateSalt,
  registerWebAuthnCredential,
  isWebAuthnAvailable,
  PrivacyConfig,
  DEFAULT_PRIVACY_CONFIG,
} from "@/lib/privacy";
import {
  Lock,
  KeyRound,
  Shield,
  Smartphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  RotateCcw,
} from "lucide-react";

export function PrivacySettings() {
  const [privacy, setPrivacy] = useState<PrivacyConfig>(DEFAULT_PRIVACY_CONFIG);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<string>("");

  useEffect(() => {
    try {
      const cached = localStorage.getItem("shore_privacy_config");
      if (cached) setPrivacy((prev) => ({ ...prev, ...JSON.parse(cached) }));
    } catch {}

    isWebAuthnAvailable().then(setBiometricSupported);

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
              if (settingsData?.privacy && typeof settingsData.privacy === "object") {
                const sbPrivacy = settingsData.privacy as Partial<PrivacyConfig>;
                setPrivacy((prev) => {
                  const merged = { ...prev, ...sbPrivacy };
                  try {
                    localStorage.setItem("shore_privacy_config", JSON.stringify(merged));
                  } catch {}
                  return merged;
                });
              }
            });
        }
      });
    } catch {}
  }, []);

  const handleToggle = (key: "lock_journal" | "lock_expenses" | "lock_media") => {
    setPrivacy((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("shore_privacy_config", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSavePin = async () => {
    setPinError("");
    if (!newPin || newPin.length < 4 || newPin.length > 6) {
      setPinError("PIN must be 4 to 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("PINs do not match. Please re-enter.");
      return;
    }

    try {
      const salt = generateSalt();
      const hash = await hashPin(newPin, salt);
      const updated: PrivacyConfig = {
        ...privacy,
        pin_hash: hash,
        pin_salt: salt,
      };

      setPrivacy(updated);
      try {
        localStorage.setItem("shore_privacy_config", JSON.stringify(updated));
      } catch {}

      // Save to Supabase
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("settings")
          .update({
            privacy: updated as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }

      setPinSetupOpen(false);
      setNewPin("");
      setConfirmPin("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      setPinError("Failed to save PIN.");
    }
  };

  const handleEnrollBiometric = async () => {
    setBiometricStatus("Prompting device...");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id || "shore_user";
      const email = user?.email || "sahil@shore.local";

      const cred = await registerWebAuthnCredential(userId, email);
      if (cred) {
        const updated: PrivacyConfig = {
          ...privacy,
          webauthn_credential_id: cred.credentialId,
        };
        setPrivacy(updated);
        try {
          localStorage.setItem("shore_privacy_config", JSON.stringify(updated));
        } catch {}

        if (user) {
          await supabase
            .from("settings")
            .update({
              privacy: updated as unknown as Json,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);
        }
        setBiometricStatus("Biometrics linked successfully!");
      } else {
        setBiometricStatus("Biometric setup canceled or not supported.");
      }
    } catch {
      setBiometricStatus("Biometric enrollment failed.");
    }
    setTimeout(() => setBiometricStatus(""), 3500);
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
      try {
        localStorage.setItem("shore_privacy_config", JSON.stringify(privacy));
      } catch {}
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

      {/* Security Credentials Card */}
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">Access PIN</h3>
              <p className="text-xs text-text-muted">
                {privacy.pin_hash ? "PIN configured and active" : "No PIN set yet"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPinSetupOpen(true)}
            className="rounded-xl border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-text hover:bg-surface active:scale-95"
          >
            {privacy.pin_hash ? "Change PIN" : "Set Up PIN"}
          </button>
        </div>

        {/* PIN Setup Modal / Expander */}
        {pinSetupOpen && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-text">
              {privacy.pin_hash ? "Update Your PIN" : "Create a 4-6 Digit PIN"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="New PIN (4-6 digits)"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-primary"
              />
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Confirm PIN"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-primary"
              />
            </div>
            {pinError && <p className="text-[11px] text-rose-500">{pinError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSavePin}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Save PIN
              </button>
              <button
                onClick={() => {
                  setPinSetupOpen(false);
                  setNewPin("");
                  setConfirmPin("");
                  setPinError("");
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Biometrics row */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-warm/10 text-accent-warm">
              <Fingerprint className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">Device Biometrics (WebAuthn)</h3>
              <p className="text-xs text-text-muted">
                {privacy.webauthn_credential_id
                  ? "Biometrics linked (Face ID / Touch ID / Passkey)"
                  : biometricSupported
                  ? "Supported on this device"
                  : "Not supported in this browser"}
              </p>
            </div>
          </div>
          {biometricSupported && (
            <button
              onClick={handleEnrollBiometric}
              className="rounded-xl border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-text hover:bg-surface active:scale-95"
            >
              {privacy.webauthn_credential_id ? "Re-link Biometrics" : "Enable Biometrics"}
            </button>
          )}
        </div>
        {biometricStatus && (
          <p className="text-xs text-primary font-medium">{biometricStatus}</p>
        )}
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
                Requires PIN or biometric unlock to view daily reflections, gratitude, and mood trends.
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
                Hides financial cashflow, balances, category budgets, and transaction history.
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
                Protects Google Drive photo/video sync, private albums, and memories vault.
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
        <p className="text-xs text-text-muted">
          Automatically re-locks protected vaults after inactivity in the session.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Immediate", val: 0 },
            { label: "5 Min", val: 5 },
            { label: "15 Min", val: 15 },
            { label: "30 Min", val: 30 },
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
