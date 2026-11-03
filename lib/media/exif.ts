// ============================================================================
// Sahil's Shore: EXIF Extraction Helper
// Extracts creation timestamp and GPS coordinates from uploaded camera media
// ============================================================================

import exifr from "exifr";

export interface ExtractedExifData {
  takenAt: string; // ISO 8601 UTC
  lat: number | null;
  lng: number | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
}

/**
 * Parses EXIF metadata from an image or falls back gracefully to file modified date.
 */
export async function extractExifMetadata(file: File): Promise<ExtractedExifData> {
  // Default fallback timestamp based on file modification or now
  const fallbackDate = file.lastModified
    ? new Date(file.lastModified).toISOString()
    : new Date().toISOString();

  // If not an image (e.g., video or audio), return default
  if (!file.type.startsWith("image/")) {
    return {
      takenAt: fallbackDate,
      lat: null,
      lng: null,
    };
  }

  try {
    const output = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
    });

    if (!output) {
      return {
        takenAt: fallbackDate,
        lat: null,
        lng: null,
      };
    }

    // 1. Date taken
    let takenAt = fallbackDate;
    const dateCandidate =
      output.DateTimeOriginal || output.CreateDate || output.ModifyDate;

    if (dateCandidate instanceof Date && !isNaN(dateCandidate.getTime())) {
      takenAt = dateCandidate.toISOString();
    }

    // 2. GPS Coordinates
    let lat: number | null = null;
    let lng: number | null = null;

    if (
      typeof output.latitude === "number" &&
      !isNaN(output.latitude) &&
      typeof output.longitude === "number" &&
      !isNaN(output.longitude)
    ) {
      lat = output.latitude;
      lng = output.longitude;
    }

    return {
      takenAt,
      lat,
      lng,
      cameraMake: output.Make || null,
      cameraModel: output.Model || null,
    };
  } catch (err) {
    // Non-fatal if EXIF cannot be parsed
    console.warn("[extractExifMetadata] Failed to parse EXIF, falling back:", err);
    return {
      takenAt: fallbackDate,
      lat: null,
      lng: null,
    };
  }
}
