"use client";

// ============================================================================
// Sahil's Shore: Vault Protection Gate Component
// Provides PIN and WebAuthn Biometric lock screen for sensitive modules
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ProtectedModule,
  PrivacyConfig,
  DEFAULT_PRIVACY_CONFIG,
  verifyPin,
  authenticateWebAuthn,
  isWebAuthnAvailable,
  isModuleUnlocked,
  unlockModuleSession,
  lockModuleSession,
} from "@/lib/privacy";
import {
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Delete,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface VaultProtectionGateProps {
  module: ProtectedModule;
  moduleName: string;
  children: React.ReactNode;
}

export function VaultProtectionGate({
  module,
  moduleName,
  children,
}: VaultProtectionGateProps) {
  const [privacy, setPrivacy] = useState<PrivacyConfig>(DEFAULT_PRIVACY_CONFIG);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Load privacy config and evaluate lock status
  useEffect(() => {
    let currentPrivacy = DEFAULT_PRIVACY_CONFIG;

    try {
      const cached = localStorage.getItem("shore_privacy_config");
      if (cached) {
        currentPrivacy = { ...DEFAULT_PRIVACY_CONFIG, ...JSON.parse(cached) };
        setPrivacy(currentPrivacy);
      }
    } catch {}

    const isLockedConfig =
      (module === "journal" && currentPrivacy.lock_journal) ||
      (module === "expenses" && currentPrivacy.lock_expenses) ||
      (module === "media" && currentPrivacy.lock_media);

    if (isLockedConfig) {
      const unlocked = isModuleUnlocked(module, currentPrivacy.auto_lock_minutes);
      setIsUnlocked(unlocked);
    } else {
      setIsUnlocked(true);
    }

    // Check WebAuthn availability
    isWebAuthnAvailable().then(setBiometricAvailable);

    // Sync from Supabase settings
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
                const updated = {
                  ...DEFAULT_PRIVACY_CONFIG,
                  ...(settingsData.privacy as Partial<PrivacyConfig>),
                };
                setPrivacy(updated);
                try {
                  localStorage.setItem("shore_privacy_config", JSON.stringify(updated));
                } catch {}

                const lockNow =
                  (module === "journal" && updated.lock_journal) ||
                  (module === "expenses" && updated.lock_expenses) ||
                  (module === "media" && updated.lock_media);

                if (lockNow) {
                  setIsUnlocked(isModuleUnlocked(module, updated.auto_lock_minutes));
                } else {
                  setIsUnlocked(true);
                }
              }
            });
        }
      });
    } catch {}
  }, [module]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleUnlockSuccess = useCallback(() => {
    unlockModuleSession(module);
    setIsUnlocked(true);
    setPinInput("");
    setErrorMsg("");
  }, [module]);

  const handleManualLock = () => {
    lockModuleSession(module);
    setIsUnlocked(false);
    setPinInput("");
  };

  const handlePinSubmit = async (pinToTest: string) => {
    if (!pinToTest) return;
    setIsVerifying(true);
    setErrorMsg("");

    try {
      if (!privacy.pin_hash || !privacy.pin_salt) {
        // Fallback default PIN if not yet saved in cloud (default 1234 for initial test)
        if (pinToTest === "1234") {
          handleUnlockSuccess();
          setIsVerifying(false);
          return;
        }
        setErrorMsg("Please configure a PIN in Settings > Privacy first.");
        triggerShake();
        setIsVerifying(false);
        return;
      }

      const isValid = await verifyPin(pinToTest, privacy.pin_hash, privacy.pin_salt);
      if (isValid) {
        handleUnlockSuccess();
      } else {
        setErrorMsg("Incorrect PIN. Please try again.");
        triggerShake();
        setPinInput("");
      }
    } catch {
      setErrorMsg("Verification error. Please try again.");
      triggerShake();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === "clear") {
      setPinInput("");
      setErrorMsg("");
      return;
    }
    if (val === "backspace") {
      setPinInput((prev) => prev.slice(0, -1));
      setErrorMsg("");
      return;
    }
    if (pinInput.length >= 6) return;

    const nextPin = pinInput + val;
    setPinInput(nextPin);
    setErrorMsg("");

    // Auto submit if length reaches 4 or 6
    if (nextPin.length === 4 || nextPin.length === 6) {
      handlePinSubmit(nextPin);
    }
  };

  const handleBiometricAuth = async () => {
    setIsVerifying(true);
    setErrorMsg("");
    try {
      const ok = await authenticateWebAuthn(privacy.webauthn_credential_id);
      if (ok) {
        handleUnlockSuccess();
      } else {
        setErrorMsg("Biometric verification canceled or not recognized.");
      }
    } catch {
      setErrorMsg("Biometric verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  // If unlocked, render children along with a discrete Lock toggle
  if (isUnlocked) {
    const isLockConfigured =
      (module === "journal" && privacy.lock_journal) ||
      (module === "expenses" && privacy.lock_expenses) ||
      (module === "media" && privacy.lock_media);

    return (
      <div className="relative">
        {isLockConfigured && (
          <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
            <button
              onClick={handleManualLock}
              title={`Lock ${moduleName}`}
              className="flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 px-3 py-1.5 text-[11px] font-medium text-text-muted shadow-md backdrop-blur-md transition-all hover:bg-surface hover:text-text active:scale-95"
            >
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span>Lock Vault</span>
            </button>
          </div>
        )}
        {children}
      </div>
    );
  }

  // Render Lock Screen
  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <div
        className={`w-full max-w-sm rounded-3xl border border-border bg-surface p-7 shadow-xl transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            {moduleName} Locked
          </h2>
          <p className="text-xs text-text-muted">
            Enter your PIN or verify biometrics to unlock this vault.
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="my-6 flex justify-center items-center gap-3">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pinInput.length > idx;
            return (
              <div
                key={idx}
                className={`h-3.5 w-3.5 rounded-full border transition-all ${
                  isFilled
                    ? "border-primary bg-primary scale-110"
                    : "border-border bg-surface-muted/60"
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-center text-xs text-rose-500 font-medium animate-fadeIn">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeypadPress(digit)}
              disabled={isVerifying}
              className="flex h-13 items-center justify-center rounded-2xl border border-border/70 bg-surface-muted/40 text-lg font-semibold text-text shadow-sm transition-all hover:bg-surface-muted active:scale-95 disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => handleKeypadPress("clear")}
            disabled={isVerifying}
            className="flex h-13 items-center justify-center rounded-2xl border border-border/70 bg-surface-muted/20 text-xs font-medium text-text-muted transition-all hover:bg-surface-muted active:scale-95"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeypadPress("0")}
            disabled={isVerifying}
            className="flex h-13 items-center justify-center rounded-2xl border border-border/70 bg-surface-muted/40 text-lg font-semibold text-text shadow-sm transition-all hover:bg-surface-muted active:scale-95 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={() => handleKeypadPress("backspace")}
            disabled={isVerifying}
            className="flex h-13 items-center justify-center rounded-2xl border border-border/70 bg-surface-muted/20 text-text-muted transition-all hover:bg-surface-muted active:scale-95"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>

        {/* Biometrics Button */}
        {biometricAvailable && (
          <div className="mt-5 pt-4 border-t border-border/60">
            <button
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Use Touch ID / Face ID</span>
            </button>
          </div>
        )}

        {/* Direct PIN button if user typed without auto-submit */}
        {pinInput.length > 0 && pinInput.length !== 4 && pinInput.length !== 6 && (
          <div className="mt-3">
            <button
              onClick={() => handlePinSubmit(pinInput)}
              disabled={isVerifying}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>{isVerifying ? "Verifying..." : "Unlock"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
