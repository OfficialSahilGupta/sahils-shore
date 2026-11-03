// ============================================================================
// Sahil's Shore: German SpeechSynthesis Utility (de-DE)
// Native browser text-to-speech with rate selection and promise-based playback
// ============================================================================

export interface SpeechOptions {
  rate?: number; // 0.5 to 1.5 (default: 1.0)
  pitch?: number; // default: 1.0
  volume?: number; // default: 1.0
}

/**
 * Finds the highest-quality available German voice in the browser
 */
export function getGermanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  // 1. Prefer de-DE natural/high quality voices
  const deDeVoice = voices.find(
    (v) =>
      v.lang.replace("_", "-").toLowerCase() === "de-de" &&
      (v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("google") ||
        v.name.toLowerCase().includes("siri") ||
        v.name.toLowerCase().includes("anna") ||
        v.name.toLowerCase().includes("markus"))
  );
  if (deDeVoice) return deDeVoice;

  // 2. Any de-DE voice
  const standardDeDe = voices.find(
    (v) => v.lang.replace("_", "-").toLowerCase() === "de-de"
  );
  if (standardDeDe) return standardDeDe;

  // 3. Any German dialect voice (de-AT, de-CH)
  return voices.find((v) => v.lang.toLowerCase().startsWith("de")) || null;
}

/**
 * Speaks German text using SpeechSynthesis (de-DE)
 * Cancels active speech, returns Promise resolving when utterance ends
 */
export function playGermanSpeech(
  text: string,
  options: SpeechOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("[playGermanSpeech] SpeechSynthesis not supported in this browser.");
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any active utterances immediately

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.rate = options.rate !== undefined ? options.rate : 1.0;
      utterance.pitch = options.pitch !== undefined ? options.pitch : 1.0;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;

      const voice = getGermanVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        // Some browsers fire "canceled" or "interrupted" when cancel() is called
        if (event.error === "canceled" || event.error === "interrupted") {
          resolve();
        } else {
          console.warn("[playGermanSpeech] Utterance error:", event.error);
          resolve(); // Resolve anyway so UI is not left hung
        }
      };

      // Workaround for Chrome/WebKit bug where long speech pauses prematurely
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("[playGermanSpeech] Exception playing speech:", err);
      resolve();
    }
  });
}

/**
 * Stops any ongoing speech synthesis immediately
 */
export function stopGermanSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
