"use client";

// ============================================================================
// Sahil's Shore: German Shadowing Mode Modal
// Native phrase playback -> automatic countdown -> auto-start recording -> loop
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  Mic,
  Square,
  RotateCcw,
  CheckCircle2,
  X,
  Play,
  Sparkles,
  Star,
} from "lucide-react";
import { playGermanSpeech } from "@/lib/german/speech";
import {
  GermanAudioRecorder,
  startWaveformAnimation,
  type AudioRecordingResult,
  type RecorderError,
} from "@/lib/german/audio-recorder";
import { TRICKY_SOUNDS } from "@/lib/german/constants";

interface ShadowingAttempt {
  attemptNumber: number;
  audioResult: AudioRecordingResult;
  score: number;
  hardSounds: string[];
}

interface ShadowingModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrase: string;
  speechRate: number;
  onSaveShadowingAttempts: (
    phrase: string,
    attempts: ShadowingAttempt[]
  ) => Promise<void>;
}

type ShadowingStep =
  | "ready"
  | "playing_reference"
  | "countdown"
  | "recording"
  | "summary";

export function ShadowingModeModal({
  isOpen,
  onClose,
  phrase,
  speechRate,
  onSaveShadowingAttempts,
}: ShadowingModeModalProps) {
  const [totalRepeats, setTotalRepeats] = useState<number>(3);
  const [currentRepeat, setCurrentRepeat] = useState<number>(1);
  const [step, setStep] = useState<ShadowingStep>("ready");
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [attempts, setAttempts] = useState<ShadowingAttempt[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<GermanAudioRecorder | null>(null);
  const stopWaveformRef = useRef<(() => void) | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("ready");
      setCurrentRepeat(1);
      setAttempts([]);
      setErrorMessage(null);
    }
  }, [isOpen, phrase]);

  // Clean up recorder and waveform on unmount
  useEffect(() => {
    return () => {
      if (stopWaveformRef.current) stopWaveformRef.current();
      if (recorderRef.current) {
        recorderRef.current.stopRecording().catch(() => {});
      }
    };
  }, []);

  const handleStartSession = () => {
    setAttempts([]);
    setCurrentRepeat(1);
    executeShadowingCycle(1);
  };

  const executeShadowingCycle = async (repeatNum: number) => {
    setErrorMessage(null);
    setStep("playing_reference");

    // 1. Play reference audio
    try {
      await playGermanSpeech(phrase, { rate: speechRate });
    } catch (e) {
      console.warn("Reference speech failed:", e);
    }

    // 2. Countdown: 3, 2, 1
    setStep("countdown");
    setCountdownNum(3);
    await new Promise((r) => setTimeout(r, 800));
    setCountdownNum(2);
    await new Promise((r) => setTimeout(r, 800));
    setCountdownNum(1);
    await new Promise((r) => setTimeout(r, 800));

    // 3. Start Recording
    setStep("recording");
    try {
      const recorder = new GermanAudioRecorder();
      recorderRef.current = recorder;

      const { analyser } = await recorder.startRecording((activeAnalyser) => {
        if (canvasRef.current && activeAnalyser) {
          stopWaveformRef.current = startWaveformAnimation(
            canvasRef.current,
            activeAnalyser,
            "#1F7A8C"
          );
        }
      });
    } catch (err: unknown) {
      const recErr = err as RecorderError;
      setErrorMessage(recErr.message || "Could not access microphone.");
      setStep("ready");
    }
  };

  const handleStopRecordingAttempt = async () => {
    if (!recorderRef.current) return;
    try {
      if (stopWaveformRef.current) {
        stopWaveformRef.current();
        stopWaveformRef.current = null;
      }

      const result = await recorderRef.current.stopRecording();
      recorderRef.current = null;

      const newAttempt: ShadowingAttempt = {
        attemptNumber: currentRepeat,
        audioResult: result,
        score: 4, // default initial rating
        hardSounds: [],
      };

      const updatedAttempts = [...attempts, newAttempt];
      setAttempts(updatedAttempts);

      if (currentRepeat < totalRepeats) {
        const nextRepeat = currentRepeat + 1;
        setCurrentRepeat(nextRepeat);
        // Short pause then trigger next repeat
        setTimeout(() => {
          executeShadowingCycle(nextRepeat);
        }, 1200);
      } else {
        // All repeats completed
        setStep("summary");
      }
    } catch (e) {
      console.error("Error stopping attempt:", e);
      setStep("summary");
    }
  };

  const handleUpdateAttemptScore = (idx: number, score: number) => {
    setAttempts((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, score } : a))
    );
  };

  const handleToggleHardSound = (idx: number, sound: string) => {
    setAttempts((prev) =>
      prev.map((a, i) => {
        if (i !== idx) return a;
        const exists = a.hardSounds.includes(sound);
        const hardSounds = exists
          ? a.hardSounds.filter((s) => s !== sound)
          : [...a.hardSounds, sound];
        return { ...a, hardSounds };
      })
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveShadowingAttempts(phrase, attempts);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface border border-surface-muted rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-text">
              German Shadowing Mode
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* Target Phrase Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-muted/50 border border-surface-muted text-center space-y-1">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Shadowing Phrase
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-text">
              &ldquo;{phrase}&rdquo;
            </h2>
            <div className="text-xs text-text-muted">
              Reference Speed: {speechRate}x
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Step 1: Ready Screen */}
          {step === "ready" && (
            <div className="space-y-6 text-center py-4">
              <p className="text-sm text-text-muted max-w-md mx-auto">
                In Shadowing Mode, listen closely to native German rhythm and immediately repeat what you hear. Shore will loop through your chosen number of repetitions.
              </p>

              <div className="flex items-center justify-center gap-3">
                <span className="text-xs font-semibold text-text-muted">
                  Repeat Count:
                </span>
                {[1, 2, 3, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTotalRepeats(count)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      totalRepeats === count
                        ? "bg-primary text-white"
                        : "bg-surface-muted text-text-muted hover:text-text"
                    }`}
                  >
                    {count}x Loop
                  </button>
                ))}
              </div>

              <div>
                <button
                  onClick={handleStartSession}
                  className="px-6 py-3 rounded-xl bg-primary hover:opacity-90 text-white font-semibold shadow-md flex items-center gap-2 mx-auto transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Begin Shadowing Loop</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Reference Playing Screen */}
          {step === "playing_reference" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center animate-pulse">
                <Volume2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text">
                Listen carefully... (Repeat {currentRepeat} of {totalRepeats})
              </h3>
              <p className="text-xs text-text-muted">
                Reference audio is playing. Pay attention to melody and mouth posture.
              </p>
            </div>
          )}

          {/* Step 3: Countdown Screen */}
          {step === "countdown" && (
            <div className="text-center py-8 space-y-3">
              <div className="text-5xl font-mono font-bold text-primary animate-bounce">
                {countdownNum}
              </div>
              <h3 className="text-lg font-bold text-text">Get ready to speak!</h3>
              <p className="text-xs text-text-muted">
                Recording starts in {countdownNum}...
              </p>
            </div>
          )}

          {/* Step 4: Recording with Waveform */}
          {step === "recording" && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-500 font-bold text-sm">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span>Recording Attempt {currentRepeat} of {totalRepeats}...</span>
              </div>

              {/* Canvas Waveform */}
              <div className="h-24 w-full bg-surface-muted/40 rounded-2xl border border-surface-muted flex items-center justify-center p-2 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={100}
                  className="w-full h-full"
                />
              </div>

              <div>
                <button
                  onClick={handleStopRecordingAttempt}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md flex items-center gap-2 mx-auto transition-all"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Attempt {currentRepeat}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Summary Screen with Side-by-Side Attempts */}
          {step === "summary" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-text">Shadowing Completed!</h3>
                <p className="text-xs text-text-muted">
                  Review and self-rate your attempts below before saving to Google Drive.
                </p>
              </div>

              {/* Side-by-Side Attempts List */}
              <div className="space-y-4">
                {attempts.map((attempt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-surface-muted/40 border border-surface-muted space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text uppercase tracking-wider">
                        Attempt #{attempt.attemptNumber}
                      </span>

                      {/* 1-5 Star Self-Rating */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleUpdateAttemptScore(idx, star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= attempt.score
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-text-muted/40"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Audio Player Scrubber */}
                    <audio
                      controls
                      src={attempt.audioResult.url}
                      className="w-full h-8"
                    />

                    {/* Hard Sounds Toggle Chips */}
                    <div>
                      <div className="text-[11px] font-medium text-text-muted mb-1.5">
                        Which sounds were tricky in this attempt?
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {TRICKY_SOUNDS.map((sound) => {
                          const isSelected = attempt.hardSounds.includes(
                            sound.symbol
                          );
                          return (
                            <button
                              key={sound.symbol}
                              onClick={() =>
                                handleToggleHardSound(idx, sound.symbol)
                              }
                              className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all ${
                                isSelected
                                  ? "bg-rose-500 text-white"
                                  : "bg-surface border border-surface-muted text-text-muted hover:text-text"
                              }`}
                              title={sound.name}
                            >
                              {sound.symbol}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save All Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setStep("ready")}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-text-muted hover:bg-surface-muted"
                >
                  Shadow Again
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary hover:opacity-90 text-white shadow-md transition-all disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Recordings to Drive"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
