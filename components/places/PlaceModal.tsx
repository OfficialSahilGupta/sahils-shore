"use client";

// ============================================================================
// Sahil's Shore: Add/Edit Place Modal
// Location capture via OpenStreetMap search, browser GPS, or interactive map pin dropper
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MapPin,
  Compass,
  Star,
  Calendar,
  Sparkles,
  Tag,
  AlignLeft,
  Navigation,
  Search,
  Loader2,
  Check,
  Lightbulb,
} from "lucide-react";
import type { Place, PlaceCategory, PlaceInput } from "@/lib/places";
import { PLACE_CATEGORIES } from "@/lib/places";
import { todayIST } from "@/lib/date-utils";
import type { GeocodeResult } from "@/app/api/places/geocode/route";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

interface PlaceModalProps {
  place: Place | null; // null if adding new
  isOpen: boolean;
  initialSearchQuery?: string;
  onClose: () => void;
  onSave: (input: PlaceInput) => Promise<void>;
}

export function PlaceModal({
  place,
  isOpen,
  initialSearchQuery = "",
  onClose,
  onSave,
}: PlaceModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("cafe");
  const [visitedDate, setVisitedDate] = useState(todayIST());
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Place Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (place) {
        setName(place.name);
        setCategory(place.category);
        setVisitedDate(place.visited_at ? place.visited_at.split("T")[0] : todayIST());
        setRating(place.rating);
        setNotes(place.notes || "");
        setLat(place.lat);
        setLng(place.lng);
        setSearchQuery("");
      } else {
        setName(initialSearchQuery || "");
        setCategory("cafe");
        setVisitedDate(todayIST());
        setRating(null);
        setNotes("");
        setLat(null);
        setLng(null);
        setSearchQuery(initialSearchQuery || "");
        if (initialSearchQuery) {
          triggerSearch(initialSearchQuery);
        }
      }
      setSearchResults([]);
      setShowMapPicker(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, place, initialSearchQuery]);

  const triggerSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/places/geocode?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.warn("Geocoding search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      triggerSearch(query);
    }, 350);
  };

  const handleSelectGeocode = (result: GeocodeResult) => {
    if (!name.trim() || name === searchQuery) {
      setName(result.name);
    }
    setLat(result.lat);
    setLng(result.lng);
    if (result.category) {
      setCategory(result.category);
    }
    setSearchResults([]);
    setSearchQuery(result.name);
    setShowMapPicker(true);
  };

  if (!isOpen) return null;

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
        setShowMapPicker(true);
      },
      (err) => {
        console.warn("Geolocation failed:", err.message);
        alert("Unable to retrieve location. Please check browser permissions.");
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const input: PlaceInput = {
        name: name.trim(),
        category,
        visited_at: new Date(visitedDate).toISOString(),
        rating,
        notes: notes.trim() || null,
        lat,
        lng,
      };

      await onSave(input);
      onClose();
    } catch (err) {
      console.error("Failed to save place:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Object.keys(PLACE_CATEGORIES) as PlaceCategory[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-text">
              {place ? "Edit Place" : "Log a New Place"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Search Location (Nominatim Geocoding Autocomplete) */}
          <div className="space-y-1.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                <span>Search Place or Landmark (Auto-finds coordinates)</span>
              </label>
              <span className="text-[10px] text-text-muted">No coordinates needed</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Type e.g., Mahabalipuram Beach, Shore Temple, Blue Tokai..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-8 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none shadow-xs"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />
              )}
              {!isSearching && searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Dropdown Results */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl p-1 space-y-1 animate-in fade-in duration-150">
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectGeocode(res)}
                      className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-surface-muted transition-colors group"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">
                            {res.name}
                          </p>
                          {res.category && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-surface-muted text-text-muted shrink-0 capitalize">
                              {res.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted truncate">
                          {res.displayName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lat && lng && (
              <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" />
                <span>
                  Found coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Place Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text">Place Name *</label>
              {name && !lat && (
                <button
                  type="button"
                  onClick={() => handleSearchChange(name)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <Search className="h-3 w-3" />
                  <span>Find coordinates for this name</span>
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g., Mahabalipuram Beach, Blue Tokai Coffee, Fort Aguada"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((catKey) => {
                const config = PLACE_CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium border transition-all capitalize ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "border-border text-text hover:bg-surface-muted"
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visit Date & Rating Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Visit Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={visitedDate}
                  onChange={(e) => setVisitedDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Rating</label>
              <div className="flex items-center gap-1 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? null : star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        rating && star <= rating
                          ? "fill-accent-warm text-accent-warm"
                          : "text-border hover:text-accent-warm/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Coordinates & Map Dropper */}
          <div className="space-y-2 rounded-xl border border-border bg-surface-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
                <Compass className="h-4 w-4 text-primary" />
                <span>Map Coordinates</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-muted transition-colors disabled:opacity-50"
                >
                  <Navigation className="h-3 w-3 text-cyan-500" />
                  <span>{isLocating ? "Locating..." : "Use Current GPS"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text hover:bg-surface-muted transition-colors"
                >
                  <MapPin className="h-3 w-3 text-rose-500" />
                  <span>{showMapPicker ? "Hide Map" : "View / Adjust on Map"}</span>
                </button>
              </div>
            </div>

            {/* Display lat/lng */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="number"
                step="any"
                placeholder="Latitude (auto-filled on search)"
                value={lat ?? ""}
                onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude (auto-filled on search)"
                value={lng ?? ""}
                onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* Interactive Leaflet Picker Map */}
            {showMapPicker && (
              <div className="mt-3 overflow-hidden rounded-xl border border-border">
                <LeafletMap
                  places={[]}
                  isPickerMode={true}
                  pickerCoords={lat && lng ? { lat, lng } : { lat: 28.6139, lng: 77.2090 }}
                  onPickCoords={(pickedLat, pickedLng) => {
                    setLat(Number(pickedLat.toFixed(6)));
                    setLng(Number(pickedLng.toFixed(6)));
                  }}
                  className="h-56 w-full"
                />
                <p className="bg-surface p-2 text-center text-[10px] text-text-muted border-t border-border flex items-center justify-center gap-1">
                  <Lightbulb className="h-3 w-3 text-primary shrink-0" />
                  <span>Tip: Click anywhere on the map to fine-tune the exact pin location.</span>
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text">Notes & Impressions</label>
            <textarea
              rows={3}
              placeholder="What made this place special? Vibe, wifi, coffee recommendation, memories..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 shadow-sm"
            >
              {isSaving ? "Saving..." : place ? "Update Place" : "Save Place"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
