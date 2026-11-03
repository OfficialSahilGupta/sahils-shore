"use client";

// ============================================================================
// Sahil's Shore: German Pronunciation Lab
// MediaRecorder, Live Waveform, Side-by-Side Reference, Self-Rating & Drive Sync
// ============================================================================

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import type { PronunciationRecording } from "@/types";
import {
  GermanAudioRecorder,
  startWaveformAnimation,
  type AudioRecordingResult,
  type RecorderError,
} from "@/lib/german/audio-recorder";
import { playGermanSpeech } from "@/lib/german/speech";
import {
  TRICKY_SOUNDS,
  type TrickySound,
} from "@/lib/german/constants";
import {
  getTrickyWords,
  getImprovementStats,
  type SavePronunciationInput,
  type TrickyWordReport,
} from "@/lib/german";
import { ShadowingModeModal } from "./ShadowingModeModal";

interface PronunciationLabProps {
  recordings: PronunciationRecording[];
  initialPhrase?: string;
  onSaveRecording: (
    input: SavePronunciationInput,
    audioBlob: Blob
  ) => Promise<void>;
  onSaveShadowingAttempts: (
    phrase: string,
    attempts: any[]
  ) => Promise<void>;
}

export function PronunciationLab({
  recordings,
  initialPhrase,
  onSaveRecording,
  onSaveShadowingAttempts,
}: PronunciationLabProps) {
  // Target phrase state
  const [phrase, setPhrase] = useState(initialPhrase || "Ausgezeichnet");
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [isPlayingReference, setIsPlayingReference] = useState(false);

  // Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedResult, setRecordedResult] = useState<AudioRecordingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Self-rating & hard sounds state
  const [score, setScore] = useState<number>(4);
  const [hardSounds, setHardSounds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Shadowing modal state
  const [isShadowingOpen, setIsShadowingOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<GermanAudioRecorder | null>(null);
  const stopWaveformRef = useRef<(() => void) | null>(null);

  // Update phrase if initialPhrase prop changes
  useEffect(() => {
    if (initialPhrase) {
      setPhrase(initialPhrase);
      setRecordedResult(null);
      setSaveSuccess(false);
    }
  }, [initialPhrase]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (stopWaveformRef.current) stopWaveformRef.current();
      if (recorderRef.current) {
        recorderRef.current.stopRecording().catch(() => {});
      }
    };
  }, []);

  // Preset phrases with specific German sounds
  const presetPhrases = [
    { text: "Ausgezeichnet", sound: "ch" },
    { text: "Gemütlichkeit", sound: "ü" },
    { text: "Wunderschön", sound: "ö" },
    { text: "Die Straße", sound: "ß" },
    { text: "Mädchen", sound: "ä" },
    { text: "Richtig gut", sound: "r" },
    { text: "Schönen Feierabend", sound: "sch" },
    { text: "Fingerspitzengefühl", sound: "ü" },
  ];

  // Detect which tricky sounds exist in current phrase
  const detectedSounds = TRICKY_SOUNDS.filter((s) =>
    phrase.toLowerCase().includes(s.symbol)
  );

  const handlePlayReference = async () => {
    if (!phrase.trim() || isPlayingReference) return;
    setIsPlayingReference(true);
    try {
      await playGermanSpeech(phrase, { rate: speechRate });
    } finally {
      setIsPlayingReference(false);
    }
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setSaveSuccess(false);
    setRecordedResult(null);

    try {
      const recorder = new GermanAudioRecorder();
      recorderRef.current = recorder;

      setIsRecording(true);
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
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    try {
      if (stopWaveformRef.current) {
        stopWaveformRef.current();
        stopWaveformRef.current = null;
      }

      const result = await recorderRef.current.stopRecording();
      recorderRef.current = null;
      setIsRecording(false);
      setRecordedResult(result);
    } catch (e) {
      console.error("Error stopping recording:", e);
      setIsRecording(false);
    }
  };

  const handleToggleHardSound = (symbol: string) => {
    setHardSounds((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSaveRecording = async () => {
    if (!recordedResult) return;
    setIsSaving(true);
    try {
      const input: SavePronunciationInput = {
        phrase: phrase.trim(),
        audio_url: recordedResult.url,
        score,
        hard_sounds: hardSounds,
        speech_rate: speechRate,
        mode: "standard",
        feedback: feedback.trim() || null,
      };

      await onSaveRecording(input, recordedResult.blob);
      setSaveSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Tricky words and stats
  const trickyWords = getTrickyWords(recordings);
  const stats = getImprovementStats(recordings);

  return (
    <div className="space-y-6">
      {/* Target Phrase Selection & Reference Audio Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-text">Pronunciation Lab</h3>
            <p className="text-xs text-text-muted">
              Select or type a German word/phrase, listen to reference speech, and record your voice.
            </p>
          </div>

          <button
            onClick={() => setIsShadowingOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Shadowing Mode</span>
          </button>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-text-muted font-medium mr-1">Presets:</span>
          {presetPhrases.map((preset) => (
            <button
              key={preset.text}
              onClick={() => {
                setPhrase(preset.text);
                setRecordedResult(null);
                setSaveSuccess(false);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                phrase === preset.text
                  ? "bg-primary text-white font-semibold"
                  : "bg-surface-muted text-text-muted hover:text-text hover:bg-surface-muted/80"
              }`}
            >
              {preset.text} <span className="opacity-60 text-[10px]">[{preset.sound}]</span>
            </button>
          ))}
        </div>

        {/* Phrase Input & Reference Audio Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-text-muted block mb-1">
              German Phrase to Practice
            </label>
            <input
              type="text"
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                setRecordedResult(null);
                setSaveSuccess(false);
              }}
              placeholder="e.g. Ausgezeichnet"
              className="w-full px-3.5 py-2.5 text-base font-medium rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted block mb-1">
              Playback Speed: <strong className="text-text">{speechRate}x</strong>
            </label>
            <div className="flex items-center gap-1.5 pt-1">
              {[0.5, 0.75, 1.0, 1.25].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    speechRate === rate
                      ? "bg-primary text-white"
                      : "bg-surface-muted text-text-muted hover:text-text"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reference Audio Player Bar */}
        <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-surface-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayReference}
              disabled={isPlayingReference || !phrase.trim()}
              className={`p-2.5 rounded-xl text-white transition-all shadow-sm ${
                isPlayingReference
                  ? "bg-primary animate-pulse"
                  : "bg-primary hover:opacity-90"
              }`}
              title="Play reference pronunciation (de-DE)"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs font-bold text-text">Native Reference Audio</div>
              <div className="text-[11px] text-text-muted">
                SpeechSynthesis de-DE (natural German articulation)
              </div>
            </div>
          </div>

          {/* Phonetic tips for detected tricky sounds */}
          {detectedSounds.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-text-muted font-medium">Tricky sounds:</span>
              {detectedSounds.map((sound) => (
                <span
                  key={sound.symbol}
                  className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  title={`${sound.name}: ${sound.description}`}
                >
                  {sound.symbol} ({sound.ipa})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Waveform Recorder & Side-by-Side Comparison Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Recording & Live Waveform */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Your Voice Recording
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  Recording live
                </span>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Canvas Waveform Visualizer */}
            <div className="h-28 w-full bg-surface-muted/40 rounded-2xl border border-surface-muted flex items-center justify-center p-2 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={110}
                className="w-full h-full"
              />
              {!isRecording && !recordedResult && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted/60 pointer-events-none">
                  Press Record to speak & view live audio waveform
                </div>
              )}
            </div>

            {/* Playback Scrubber if recorded */}
            {recordedResult && (
              <div className="mt-3 space-y-1">
                <div className="text-[11px] font-semibold text-text-muted">
                  Recorded Audio Playback:
                </div>
                <audio
                  controls
                  src={recordedResult.url}
                  className="w-full h-8"
                />
              </div>
            )}
          </div>

          {/* Record / Stop Action Button */}
          <div className="pt-2">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Mic className="w-4 h-4" />
                <span>{recordedResult ? "Record Again" : "Start Recording"}</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all animate-pulse"
              >
                <Square className="w-4 h-4" />
                <span>Stop Recording</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Self-Assessment & Google Drive Storage */}
        <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-surface-muted shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Self-Rating & Reflection
            </div>

            {/* 1-5 Star Rating */}
            <div className="space-y-1 mb-4">
              <label className="text-xs font-medium text-text-muted">
                How close was your pronunciation to native? (1-5 stars)
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setScore(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= score
                          ? "text-amber-500 fill-amber-500"
                          : "text-text-muted/30"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-text">
                  {score} / 5
                </span>
              </div>
            </div>

            {/* Tricky Sound Chips */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-medium text-text-muted">
                Tag sounds that were difficult:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TRICKY_SOUNDS.map((sound) => {
                  const isSelected = hardSounds.includes(sound.symbol);
                  return (
                    <button
                      key={sound.symbol}
                      onClick={() => handleToggleHardSound(sound.symbol)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? "bg-rose-500 text-white"
                          : "bg-surface-muted text-text-muted hover:text-text"
                      }`}
                      title={`${sound.name}: ${sound.description}`}
                    >
                      {sound.symbol}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback / Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">
                Notes & Phonetic Feedback (Optional)
              </label>
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Rolled uvular r a bit too hard"
                className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Save & Drive Sync Button */}
          <div className="pt-2">
            {saveSuccess ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved & Synced to Google Drive Voice-Recordings/!</span>
              </div>
            ) : (
              <button
                onClick={handleSaveRecording}
                disabled={!recordedResult || isSaving}
                className="w-full py-3 rounded-xl bg-primary hover:opacity-90 text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? "Saving to Drive..." : "Save Recording & Sync"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tricky Words Directory & Improvement Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tricky Words Directory */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text flex items-center gap-2">
              <span>Tricky Words Directory</span>
              <span className="text-xs text-text-muted font-normal">
                (Ranked by lowest rating)
              </span>
            </h4>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {trickyWords.map((word) => (
              <div
                key={word.phrase}
                className="p-3 rounded-xl bg-surface-muted/40 border border-surface-muted flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-text">{word.phrase}</div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
                    <span>Avg Score: <strong className="text-amber-500">{word.averageScore}/5</strong></span>
                    <span>•</span>
                    <span>{word.attemptsCount} attempts</span>
                  </div>

                  {word.hardSounds.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {word.hardSounds.map((sound) => (
                        <span
                          key={sound}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/10 text-rose-500 font-bold"
                        >
                          {sound}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setPhrase(word.phrase);
                    setRecordedResult(null);
                    setSaveSuccess(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface hover:bg-primary/10 text-primary border border-surface-muted transition-all whitespace-nowrap"
                >
                  Practice Again
                </button>
              </div>
            ))}

            {trickyWords.length === 0 && (
              <div className="p-6 text-center text-text-muted text-xs">
                No recorded words yet. Record pronunciation attempts above to build your tricky words list!
              </div>
            )}
          </div>
        </div>

        {/* Improvement Trend Chart */}
        <div className="p-5 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Pronunciation Improvement Trend</span>
            </h4>
            <span className="text-xs text-text-muted">
              Avg: <strong className="text-text">{stats.averageScore}/5</strong>
            </span>
          </div>

          {stats.trend.length > 1 ? (
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trend}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--surface-muted)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1F7A8C"
                    strokeWidth={2.5}
                    dot={{ fill: "#1F7A8C", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-center text-text-muted text-xs p-6">
              Record 2 or more attempts to visualize your pronunciation rating curve over time.
            </div>
          )}
        </div>
      </div>

      {/* Shadowing Mode Modal */}
      <ShadowingModeModal
        isOpen={isShadowingOpen}
        onClose={() => setIsShadowingOpen(false)}
        phrase={phrase}
        speechRate={speechRate}
        onSaveShadowingAttempts={onSaveShadowingAttempts}
      />
    </div>
  );
}
