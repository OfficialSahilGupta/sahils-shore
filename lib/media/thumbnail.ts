// ============================================================================
// Sahil's Shore: Client-side Thumbnail Generator
// Canvas-powered instant thumbnail creation for photos and video keyframes
// ============================================================================

export interface ThumbnailResult {
  blob: Blob;
  width: number;
  height: number;
  dataUrl?: string;
  duration?: number;
}

/**
 * Resizes an image file to a thumbnail blob within maximum dimension limits.
 */
export async function generateImageThumbnail(
  file: File,
  maxDimension = 480
): Promise<ThumbnailResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { naturalWidth: origW, naturalHeight: origH } = img;

      let targetW = origW;
      let targetH = origH;

      if (origW > origH && origW > maxDimension) {
        targetW = maxDimension;
        targetH = Math.round((origH * maxDimension) / origW);
      } else if (origH > maxDimension) {
        targetH = maxDimension;
        targetW = Math.round((origW * maxDimension) / origH);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to create canvas 2d context for image thumbnail."));
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to convert canvas to blob."));
            return;
          }
          const dataUrl = canvas.toDataURL("image/webp", 0.85);
          resolve({
            blob,
            width: targetW,
            height: targetH,
            dataUrl,
          });
        },
        "image/webp",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for thumbnail generation."));
    };

    img.src = objectUrl;
  });
}

/**
 * Extracts a representative frame from a video file and scales it to a thumbnail.
 */
export async function generateVideoThumbnail(
  file: File,
  maxDimension = 480
): Promise<ThumbnailResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    let hasHandledSeek = false;

    video.onloadedmetadata = () => {
      // Seek to 0.5s or 10% into the video
      const targetTime = Math.min(0.5, video.duration / 2 || 0.1);
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      if (hasHandledSeek) return;
      hasHandledSeek = true;

      const origW = video.videoWidth || 640;
      const origH = video.videoHeight || 360;

      let targetW = origW;
      let targetH = origH;

      if (origW > origH && origW > maxDimension) {
        targetW = maxDimension;
        targetH = Math.round((origH * maxDimension) / origW);
      } else if (origH > maxDimension) {
        targetH = maxDimension;
        targetW = Math.round((origW * maxDimension) / origH);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas context failed for video frame."));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(video, 0, 0, targetW, targetH);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Failed to convert video frame to blob."));
            return;
          }
          const dataUrl = canvas.toDataURL("image/webp", 0.85);
          resolve({
            blob,
            width: targetW,
            height: targetH,
            duration: video.duration,
            dataUrl,
          });
        },
        "image/webp",
        0.85
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Error playing video for thumbnail extraction."));
    };

    video.src = objectUrl;
  });
}
