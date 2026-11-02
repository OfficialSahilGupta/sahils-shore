"use client";

// ============================================================================
// Sahil's Shore: Branded Login Page
// Google Sign-In only, single-user lock notice, calm coastal aesthetic
// ============================================================================

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WaveLogo } from "@/components/common/WaveLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ShieldAlert, Lock, AlertCircle, Compass, ArrowRight, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(() => {
    if (errorParam === "unauthorized") {
      return "Access Restricted: This instance of Sahil's Shore is locked to an authorized account. Your Google account is not permitted.";
    }
    if (errorParam === "auth_failed") {
      return "Authentication Failed: Could not exchange authorization code with Google.";
    }
    if (errorParam === "no_code") {
      return "Authentication Error: Authorization code was missing in callback.";
    }
    return null;
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error ? err.message : "An unexpected error occurred during sign-in."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Top right theme toggle */}
      <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <WaveLogo size={72} animated />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Sahil&apos;s Shore
          </h1>
          <p className="mt-2 text-sm italic text-accent-warm sm:text-base">
            &ldquo;Your day, your shore.&rdquo;
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-text-muted">
            <Lock className="h-3 w-3 text-primary" />
            <span>Private Personal Life OS</span>
          </div>
        </div>

        {/* Error Notification Alert */}
        {authError && (
          <div className="animate-in fade-in zoom-in-95 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger duration-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-danger" />
              <div className="space-y-1">
                <p className="font-semibold">Authentication Notice</p>
                <p className="leading-relaxed opacity-90">{authError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Sign-In Card */}
        <div className="overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-xl sm:p-8">
          <div className="mb-6 space-y-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-text">Welcome Back</h2>
            <p className="text-xs text-text-muted">
              Sign in with your verified Google account to access your todos, trackers, and timeline.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3.5 text-sm font-medium text-text shadow-sm transition-all hover:border-primary/50 hover:bg-surface hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-text">Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google G Logo SVG */}
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </>
              )}
            </button>

            <div className="rounded-xl bg-surface-muted/60 p-3 text-center">
              <p className="text-[11px] leading-relaxed text-text-muted">
                <span className="font-medium text-text">Single-User Protection Active:</span> Only
                the authorized owner of this Shore workspace can authenticate and access data.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>IST (Asia/Kolkata)</span>
          </span>
          <span>•</span>
          <span>INR Currency</span>
          <span>•</span>
          <span>Supabase SSR</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
