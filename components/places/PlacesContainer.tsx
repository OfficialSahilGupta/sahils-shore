"use client";

// ============================================================================
// Sahil's Shore: Places Module Main Container
// Unites interactive Leaflet map, directory list, and travel timeline
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  List,
  Compass,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  type Place,
  type PlaceInput,
  type PlaceCategory,
  PLACE_CATEGORIES,
} from "@/lib/places";
import { createClient } from "@/lib/supabase/client";
import { PlacesList } from "./PlacesList";
import { TravelTimeline } from "./TravelTimeline";
import { PlacesThisMonth } from "./PlacesThisMonth";
import { PlaceModal } from "./PlaceModal";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] w-full items-center justify-center rounded-2xl border border-border bg-surface">
      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

type ViewMode = "map" | "list" | "timeline";

export function PlacesContainer() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  const supabase = createClient();

  const loadPlaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const loaded = await getPlaces(supabase, user.id, {
        category: categoryFilter,
        search,
      });
      setPlaces(loaded);
    } catch (err) {
      console.error("[PlacesContainer] Load error:", err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, search]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const handleSavePlace = async (input: PlaceInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (editingPlace) {
      const updated = await updatePlace(supabase, user.id, editingPlace.id, input);
      if (updated) {
        setPlaces((prev) => prev.map((p) => (p.id === editingPlace.id ? updated : p)));
      }
    } else {
      const created = await createPlace(supabase, user.id, input);
      if (created) {
        setPlaces((prev) => [created, ...prev]);
      }
    }
  };

  const handleDeletePlace = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const ok = await deletePlace(supabase, user.id, id);
    if (ok) {
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const categories = Object.keys(PLACE_CATEGORIES) as PlaceCategory[];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Compass className="h-3.5 w-3.5 text-accent-warm" />
            <span>Places & Exploration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Places Visited & Interactive Map
          </h1>
          <p className="text-xs text-text-muted sm:text-sm">
            Leaflet OpenStreetMap tracking cafes, study spots, travel destinations, and linked photos & expenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingPlace(null);
              setModalSearchQuery("");
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-98 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Log Place</span>
          </button>
        </div>
      </div>

      {/* Places This Month Widget */}
      <PlacesThisMonth places={places} />

      {/* Controls & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search places by name or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-muted/50 py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-text-muted hover:bg-surface-muted hover:text-text"
            }`}
          >
            All
          </button>
          {categories.map((catKey) => {
            const isSelected = categoryFilter === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setCategoryFilter(catKey)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all capitalize ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-text-muted hover:bg-surface-muted hover:text-text"
                }`}
              >
                {catKey}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-muted/60 p-1">
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "map"
                ? "bg-surface text-primary shadow-xs font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "list"
                ? "bg-surface text-primary shadow-xs font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              viewMode === "timeline"
                ? "bg-surface text-primary shadow-xs font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Search fallback: Not in saved places */}
      {search.trim().length > 1 && places.length === 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-semibold text-text">
                &quot;{search}&quot; is not in your saved places yet
              </p>
              <p className="text-[11px] text-text-muted">
                Would you like to search OpenStreetMap and log this location now?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingPlace(null);
              setModalSearchQuery(search);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Search &amp; Add &quot;{search}&quot;</span>
          </button>
        </div>
      )}

      {/* Main View Area */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {viewMode === "map" && (
            <div className="space-y-4">
              <LeafletMap places={places} className="h-[520px] w-full" />
              <PlacesList
                places={places}
                onEditPlace={(p) => {
                  setEditingPlace(p);
                  setIsModalOpen(true);
                }}
                onDeletePlace={handleDeletePlace}
              />
            </div>
          )}

          {viewMode === "list" && (
            <PlacesList
              places={places}
              onEditPlace={(p) => {
                setEditingPlace(p);
                setIsModalOpen(true);
              }}
              onDeletePlace={handleDeletePlace}
            />
          )}

          {viewMode === "timeline" && <TravelTimeline places={places} />}
        </>
      )}

      {/* Place Modal */}
      <PlaceModal
        place={editingPlace}
        isOpen={isModalOpen}
        initialSearchQuery={modalSearchQuery}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlace(null);
          setModalSearchQuery("");
        }}
        onSave={handleSavePlace}
      />
    </div>
  );
}
