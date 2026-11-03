// ============================================================================
// Sahil's Shore: OpenStreetMap Nominatim Geocoding Route
// Route: GET /api/places/geocode?q=...
// Free, keyless location search to resolve coordinates for any place/landmark
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlaceCategory } from "@/lib/places";

export const dynamic = "force-dynamic";

export interface GeocodeResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  category?: PlaceCategory;
}

// Maps OpenStreetMap types/classes to Shore place categories
function mapOsmTypeToCategory(osmType: string, osmClass: string): PlaceCategory {
  const type = (osmType || "").toLowerCase();
  const cls = (osmClass || "").toLowerCase();

  if (type.includes("cafe") || type.includes("coffee") || type.includes("bakery")) return "cafe";
  if (type.includes("restaurant") || type.includes("food") || type.includes("bar") || type.includes("pub")) return "restaurant";
  if (type.includes("gym") || type.includes("fitness") || type.includes("sports")) return "gym";
  if (type.includes("library") || type.includes("study") || type.includes("university") || type.includes("school")) return "study spot";
  if (
    cls === "historic" ||
    cls === "tourism" ||
    type.includes("beach") ||
    type.includes("monument") ||
    type.includes("temple") ||
    type.includes("memorial") ||
    type.includes("hotel") ||
    type.includes("attraction") ||
    type.includes("viewpoint") ||
    type.includes("park") ||
    type.includes("nature")
  ) {
    return "travel";
  }
  return "other";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&addressdetails=1&limit=6`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "SahilsShore/1.0 (https://github.com/sahil/shore)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 }, // Cache search queries for 1 hour
    });

    if (!res.ok) {
      console.warn("[geocode] Nominatim returned status:", res.status);
      return NextResponse.json({ results: [] });
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) {
      return NextResponse.json({ results: [] });
    }

    const results: GeocodeResult[] = rawData.map((item: any, idx: number) => {
      const parsedLat = parseFloat(item.lat);
      const parsedLng = parseFloat(item.lon);
      const rawName = item.name || (item.display_name ? item.display_name.split(",")[0] : "Location");
      const cleanName = rawName.trim();
      const detectedCategory = mapOsmTypeToCategory(item.type, item.class);

      return {
        id: item.place_id ? String(item.place_id) : `geo_${idx}_${Date.now()}`,
        name: cleanName,
        displayName: item.display_name || cleanName,
        lat: Number(parsedLat.toFixed(6)),
        lng: Number(parsedLng.toFixed(6)),
        type: item.type || item.class || "location",
        category: detectedCategory,
      };
    });

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Geocoding request failed";
    console.error("[geocode] Error:", message);
    return NextResponse.json({ error: message, results: [] }, { status: 500 });
  }
}
