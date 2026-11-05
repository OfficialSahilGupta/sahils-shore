"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Media Link Picker Modal
// Supports both single-item and bulk entity linking to:
// - Places (Leaflet/OSM locations)
// - Albums (Drive-synced photo albums)
// - Meals (Food Diary)
// - Expenses (Paise tracker)
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Folder,
  Utensils,
  Wallet,
  Check,
  Search,
  Sparkles,
  Link as LinkIcon,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import type { MediaItem, MediaLinks, Album } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

interface MediaLinkPickerProps {
  item: MediaItem | null;
  selectedItems?: MediaItem[];
  albums?: Album[];
  isOpen: boolean;
  onClose: () => void;
  onSaveLinks: (
    targetItemIds: string[],
    links: Partial<MediaLinks>,
    albumId?: string | null | undefined
  ) => Promise<void>;
}

export function MediaLinkPicker({
  item,
  selectedItems = [],
  albums = [],
  isOpen,
  onClose,
  onSaveLinks,
}: MediaLinkPickerProps) {
  const [activeTab, setActiveTab] = useState<"place" | "album" | "meal" | "expense">("place");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Target items determination
  const targetItems = selectedItems.length > 0 ? selectedItems : item ? [item] : [];
  const isBulk = targetItems.length > 1;

  // Track if user explicitly modified each category
  const [placeTouched, setPlaceTouched] = useState(false);
  const [albumTouched, setAlbumTouched] = useState(false);
  const [mealTouched, setMealTouched] = useState(false);
  const [expenseTouched, setExpenseTouched] = useState(false);

  // Selected state
  const [selectedPlace, setSelectedPlace] = useState<{ id: string; name: string } | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: string; title: string } | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<{ id: string; name: string } | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<{ id: string; amountPaise: number; note: string } | null>(null);

  // Available options loaded from database
  const [places, setPlaces] = useState<{ id: string; name: string; category: string }[]>([]);
  const [meals, setMeals] = useState<{ id: string; name: string; meal_type: string }[]>([]);
  const [expenses, setExpenses] = useState<{ id: string; amount_paise: number; note: string; category: string }[]>([]);

  useEffect(() => {
    if (!isOpen || targetItems.length === 0) return;

    // Reset touched flags
    setPlaceTouched(false);
    setAlbumTouched(false);
    setMealTouched(false);
    setExpenseTouched(false);
    setSearch("");

    if (!isBulk && item) {
      // Single-item initialization
      if (item.links?.place_id && item.links.place_name) {
        setSelectedPlace({ id: item.links.place_id, name: item.links.place_name });
      } else {
        setSelectedPlace(null);
      }

      if (item.album_id) {
        const found = albums.find((a) => a.id === item.album_id);
        setSelectedAlbum({
          id: item.album_id,
          title: found ? found.title : item.album_title || "Current Album",
        });
      } else {
        setSelectedAlbum(null);
      }

      if (item.links?.meal_id && item.links.meal_name) {
        setSelectedMeal({ id: item.links.meal_id, name: item.links.meal_name });
      } else {
        setSelectedMeal(null);
      }

      if (item.links?.expense_id && item.links.expense_amount_paise) {
        setSelectedExpense({
          id: item.links.expense_id,
          amountPaise: item.links.expense_amount_paise,
          note: `Expense ₹${(item.links.expense_amount_paise / 100).toFixed(2)}`,
        });
      } else {
        setSelectedExpense(null);
      }
    } else {
      // Bulk initialization: check if all selected items share the same place or album
      const commonPlaceId = targetItems[0]?.links?.place_id;
      const allSharePlace =
        commonPlaceId && targetItems.every((i) => i.links?.place_id === commonPlaceId);
      if (allSharePlace && targetItems[0].links?.place_name) {
        setSelectedPlace({ id: commonPlaceId, name: targetItems[0].links.place_name });
      } else {
        setSelectedPlace(null);
      }

      const commonAlbumId = targetItems[0]?.album_id;
      const allShareAlbum =
        commonAlbumId && targetItems.every((i) => i.album_id === commonAlbumId);
      if (allShareAlbum) {
        const found = albums.find((a) => a.id === commonAlbumId);
        setSelectedAlbum({
          id: commonAlbumId,
          title: found ? found.title : targetItems[0].album_title || "Current Album",
        });
      } else {
        setSelectedAlbum(null);
      }

      setSelectedMeal(null);
      setSelectedExpense(null);
    }

    // Load available places, meals, and expenses
    const loadOptions = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [placesRes, mealsRes, expensesRes] = await Promise.all([
        supabase.from("places").select("id, name, category").eq("user_id", user.id).limit(40),
        supabase.from("meals").select("id, name, meal_type").eq("user_id", user.id).limit(40),
        supabase
          .from("expenses")
          .select("id, amount_paise, note, category")
          .eq("user_id", user.id)
          .order("occurred_at", { ascending: false })
          .limit(40),
      ]);

      if (placesRes.data) setPlaces(placesRes.data as any);
      if (mealsRes.data) setMeals(mealsRes.data as any);
      if (expensesRes.data) setExpenses(expensesRes.data as any);
    };

    loadOptions();
  }, [isOpen, item, selectedItems.length, isBulk]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || targetItems.length === 0) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const targetItemIds = targetItems.map((i) => i.id);

      // Construct links updates
      const linksPayload: Partial<MediaLinks> = {};

      if (placeTouched || !isBulk) {
        linksPayload.place_id = selectedPlace ? selectedPlace.id : null;
        linksPayload.place_name = selectedPlace ? selectedPlace.name : null;
      }

      if (mealTouched || !isBulk) {
        linksPayload.meal_id = selectedMeal ? selectedMeal.id : null;
        linksPayload.meal_name = selectedMeal ? selectedMeal.name : null;
      }

      if (expenseTouched || !isBulk) {
        linksPayload.expense_id = selectedExpense ? selectedExpense.id : null;
        linksPayload.expense_amount_paise = selectedExpense ? selectedExpense.amountPaise : null;
      }

      // Album assignment determination
      let albumIdToSet: string | null | undefined = undefined;
      if (albumTouched || !isBulk) {
        albumIdToSet = selectedAlbum
          ? selectedAlbum.id === "none"
            ? null
            : selectedAlbum.id
          : null;
      }

      await onSaveLinks(targetItemIds, linksPayload, albumIdToSet);
      onClose();
    } catch (err) {
      console.error("Failed to save links:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPlaces = places.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAlbums = albums.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMeals = meals.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredExpenses = expenses.filter(
    (e) =>
      e.note?.toLowerCase().includes(search.toLowerCase()) ||
      e.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">
                  {isBulk ? `Link ${targetItems.length} Media Items` : "Link Media Item"}
                </h3>
                <p className="text-xs text-text-muted">
                  {isBulk
                    ? `Assign a Place, Album, Meal, or Expense to all ${targetItems.length} selected items.`
                    : targetItems[0]?.file_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mini preview thumbnail strip for bulk mode */}
          {isBulk && (
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {targetItems.slice(0, 10).map((tItem) => (
                <div
                  key={tItem.id}
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted shadow-xs"
                >
                  <img
                    src={tItem.thumb_path || ""}
                    alt={tItem.file_name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
              {targetItems.length > 10 && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-[11px] font-semibold text-text-muted">
                  +{targetItems.length - 10}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 Tabs: Place, Album, Meal, Expense */}
        <div className="flex border-b border-border px-4 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("place");
              setSearch("");
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "place"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <MapPin className="h-3.5 w-3.5 text-cyan-500" />
            <span>Place</span>
            {selectedPlace && <Check className="h-3 w-3 text-primary" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("album");
              setSearch("");
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "album"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Folder className="h-3.5 w-3.5 text-primary" />
            <span>Album</span>
            {selectedAlbum && <Check className="h-3 w-3 text-primary" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("meal");
              setSearch("");
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "meal"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Utensils className="h-3.5 w-3.5 text-rose-500" />
            <span>Meal</span>
            {selectedMeal && <Check className="h-3 w-3 text-rose-500" />}
          </button>

          <button
            onClick={() => {
              setActiveTab("expense");
              setSearch("");
            }}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "expense"
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            <Wallet className="h-3.5 w-3.5 text-amber-500" />
            <span>Expense</span>
            {selectedExpense && <Check className="h-3 w-3 text-amber-500" />}
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border bg-surface-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              placeholder={`Search ${activeTab}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Options List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* TAB 1: PLACE */}
          {activeTab === "place" && (
            <>
              {selectedPlace && (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                      <span>Linked to Place: {selectedPlace.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPlace(null);
                      setPlaceTouched(true);
                    }}
                    className="text-danger hover:underline text-[11px] font-medium"
                  >
                    Unlink
                  </button>
                </div>
              )}
              {filteredPlaces.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No matching places found. Log places first in the Places tab!
                </div>
              ) : (
                filteredPlaces.map((p) => {
                  const isSelected = selectedPlace?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlace(isSelected ? null : { id: p.id, name: p.name });
                        setPlaceTouched(true);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                          : "border-border hover:bg-surface-muted text-text"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-cyan-500" />
                        <div>
                          <p className="font-medium text-text">{p.name}</p>
                          <p className="text-[10px] text-text-muted capitalize">{p.category}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: ALBUM */}
          {activeTab === "album" && (
            <>
              {selectedAlbum && (
                <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-primary" />
                      <span>Assigned Album: {selectedAlbum.title}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAlbum(null);
                      setAlbumTouched(true);
                    }}
                    className="text-danger hover:underline text-[11px] font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Special option: Remove from Album */}
              <button
                type="button"
                onClick={() => {
                  setSelectedAlbum({ id: "none", title: "No Album (Unassigned)" });
                  setAlbumTouched(true);
                }}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors mb-2 ${
                  selectedAlbum?.id === "none"
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-dashed border-border hover:bg-surface-muted text-text-muted"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="font-medium text-text">No Album (Unassigned)</p>
                    <p className="text-[10px] text-text-muted">
                      Keep photo directly in Year/Month Drive folder
                    </p>
                  </div>
                </div>
                {selectedAlbum?.id === "none" && <Check className="h-4 w-4 text-primary" />}
              </button>

              {filteredAlbums.length === 0 ? (
                <div className="py-6 text-center text-xs text-text-muted">
                  No matching albums found. Create an album with the &quot;+ New Album&quot; button!
                </div>
              ) : (
                filteredAlbums.map((a) => {
                  const isSelected = selectedAlbum?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setSelectedAlbum(isSelected ? null : { id: a.id, title: a.title });
                        setAlbumTouched(true);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                          : "border-border hover:bg-surface-muted text-text"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold text-text">{a.title}</p>
                          <p className="text-[10px] text-text-muted">
                            {a.item_count || 0} {a.item_count === 1 ? "item" : "items"}
                            {a.description ? ` · ${a.description}` : ""}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* TAB 3: MEAL */}
          {activeTab === "meal" && (
            <>
              {selectedMeal && (
                <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-rose-500" />
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      <Utensils className="h-3.5 w-3.5 text-rose-500" />
                      <span>Linked to Meal: {selectedMeal.name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMeal(null);
                      setMealTouched(true);
                    }}
                    className="text-danger hover:underline text-[11px] font-medium"
                  >
                    Unlink
                  </button>
                </div>
              )}
              {filteredMeals.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No matching meals found. Log meals in the Food Diary tab!
                </div>
              ) : (
                filteredMeals.map((m) => {
                  const isSelected = selectedMeal?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMeal(isSelected ? null : { id: m.id, name: m.name });
                        setMealTouched(true);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                        isSelected
                          ? "border-rose-500 bg-rose-500/10 text-rose-600 font-medium shadow-xs"
                          : "border-border hover:bg-surface-muted text-text"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Utensils className="h-4 w-4 text-rose-500" />
                        <div>
                          <p className="font-medium text-text">{m.name}</p>
                          <p className="text-[10px] text-text-muted capitalize">{m.meal_type}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-rose-500" />}
                    </button>
                  );
                })
              )}
            </>
          )}

          {/* TAB 4: EXPENSE */}
          {activeTab === "expense" && (
            <>
              {selectedExpense && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-text flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-amber-500" />
                      <span>Linked to Expense: {selectedExpense.note}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExpense(null);
                      setExpenseTouched(true);
                    }}
                    className="text-danger hover:underline text-[11px] font-medium"
                  >
                    Unlink
                  </button>
                </div>
              )}
              {filteredExpenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  No matching expenses found. Add expenses in the Expenses tab!
                </div>
              ) : (
                filteredExpenses.map((e) => {
                  const isSelected = selectedExpense?.id === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => {
                        setSelectedExpense(
                          isSelected
                            ? null
                            : {
                                id: e.id,
                                amountPaise: e.amount_paise,
                                note:
                                  e.note || `${e.category} ₹${(e.amount_paise / 100).toFixed(2)}`,
                              }
                        );
                        setExpenseTouched(true);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 text-amber-600 font-medium shadow-xs"
                          : "border-border hover:bg-surface-muted text-text"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-medium text-text">
                            ₹{(e.amount_paise / 100).toFixed(2)} {e.note ? `— ${e.note}` : ""}
                          </p>
                          <p className="text-[10px] text-text-muted capitalize">{e.category}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-amber-500" />}
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Active Selection Summary Banner */}
        <div className="border-t border-border bg-surface-muted/40 px-4 py-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-text-muted font-medium">To apply:</span>
          {selectedPlace ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 font-medium border border-cyan-500/30">
              <MapPin className="h-3 w-3" />
              {selectedPlace.name}
            </span>
          ) : placeTouched ? (
            <span className="rounded-md bg-danger/10 text-danger px-2 py-0.5">Place: Removed</span>
          ) : null}

          {selectedAlbum ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 text-primary px-2 py-0.5 font-medium border border-primary/30">
              <Folder className="h-3 w-3" />
              {selectedAlbum.title}
            </span>
          ) : albumTouched ? (
            <span className="rounded-md bg-danger/10 text-danger px-2 py-0.5">Album: Removed</span>
          ) : null}

          {selectedMeal ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 font-medium border border-rose-500/30">
              <Utensils className="h-3 w-3" />
              {selectedMeal.name}
            </span>
          ) : null}

          {selectedExpense ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 font-medium border border-amber-500/30">
              <Wallet className="h-3 w-3" />
              ₹{(selectedExpense.amountPaise / 100).toFixed(2)}
            </span>
          ) : null}

          {!selectedPlace && !selectedAlbum && !selectedMeal && !selectedExpense && (
            <span className="text-text-muted italic">Select tabs above to choose entities to link</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border p-4 bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
          >
            {isSaving
              ? "Saving..."
              : isBulk
              ? `Save Links (${targetItems.length} items)`
              : "Save Links"}
          </button>
        </div>
      </div>
    </div>
  );
}
