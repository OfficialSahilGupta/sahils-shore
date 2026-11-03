// ============================================================================
// Sahil's Shore: Audio Recorder & Live Waveform Engine
// Cross-browser MediaRecorder (Safari/iOS compatible) + Web Audio API visualizer
// ============================================================================

export interface AudioRecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationSeconds: number;
}

export interface RecorderError {
  type: "PERMISSION_DENIED" | "NOT_FOUND" | "IN_USE" | "UNSUPPORTED" | "UNKNOWN";
  message: string;
}

/**
 * Detects the optimal supported audio MIME type for the client browser
 * Specifically addresses Safari / iOS which only supports audio/mp4 or audio/aac
 */
export function getSupportedAudioMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return ""; // Browser default
}

/**
 * Class wrapper for browser audio recording with permission checking and waveform hook
 */
export class GermanAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private startTime = 0;
  private animFrameId: number | null = null;

  /**
   * Requests mic permission and sets up AudioContext + AnalyserNode
   */
  async startRecording(
    onWaveformUpdate?: (analyser: AnalyserNode) => void
  ): Promise<{ analyser: AnalyserNode | null }> {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      throw {
        type: "UNSUPPORTED",
        message: "Audio recording is not supported in this browser environment.",
      } as RecorderError;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        throw {
          type: "PERMISSION_DENIED",
          message:
            "Microphone access was denied. Please allow microphone permissions in your browser address bar or device settings to record pronunciation.",
        } as RecorderError;
      }
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        throw {
          type: "NOT_FOUND",
          message: "No microphone detected. Please connect a microphone or headset.",
        } as RecorderError;
      }
      if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        throw {
          type: "IN_USE",
          message: "Microphone is currently in use by another tab or application.",
        } as RecorderError;
      }
      throw {
        type: "UNKNOWN",
        message: error.message || "Failed to initialize microphone.",
      } as RecorderError;
    }

    // Set up Web Audio API for live waveform visualizer
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.sourceNode.connect(this.analyser);
      if (onWaveformUpdate && this.analyser) {
        onWaveformUpdate(this.analyser);
      }
    } catch (e) {
      console.warn("[GermanAudioRecorder] Web Audio API visualizer warning:", e);
    }

    const mimeType = getSupportedAudioMimeType();
    const options = mimeType ? { mimeType } : undefined;

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.startTime = Date.now();
    this.mediaRecorder.start(100); // chunk every 100ms
    return { analyser: this.analyser };
  }

  /**
   * Stops recording, collects audio chunks, stops media streams, and resolves audio blob
   */
  stopRecording(): Promise<AudioRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        reject(new Error("No active recording session"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - this.startTime) / 1000)
        );
        const mimeType =
          this.mediaRecorder?.mimeType ||
          getSupportedAudioMimeType() ||
          "audio/webm";

        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        this.cleanup();
        resolve({
          blob,
          url,
          mimeType,
          durationSeconds,
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.cleanup();
        reject(e);
      }
    });
  }

  private cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
  }
}

/**
 * Draws a live, flowing animated waveform on an HTML Canvas element
 */
export function startWaveformAnimation(
  canvas: HTMLCanvasElement,
  analyser: AnalyserNode,
  color: string = "#1F7A8C" // Shore teal
): () => void {
  let isRunning = true;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    if (!isRunning) return;
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0; // 0.0 to 2.0 (center 1.0)
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  draw();

  return () => {
    isRunning = false;
  };
}
