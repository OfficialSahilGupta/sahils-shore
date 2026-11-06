"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Meal Dialog (Food Diary)
// Luxury meal logging modal with Amrita Mess, permanent multi-photo storage,
// Google Drive integration, inline Media Vault linking, and reactive zero-costing.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Camera,
  MapPin,
  Utensils,
  Heart,
  Check,
  RotateCcw,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Home,
  GraduationCap,
  Building2,
  Store,
  Compass,
  CheckCircle2,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  Search,
  Film,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { formatINR, rupeesToPaise, paiseToRupees } from "@/lib/expenses";
import type { MealType, MealLocation, CreateMealInput, MealWithExpense } from "@/lib/food";
import { prepareFoodPhoto } from "@/lib/food/media";
import { createClient } from "@/lib/supabase/client";
import { useScrollLock } from "@/hooks/useScrollLock";

interface MealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateMealInput) => Promise<void>;
  editingMeal?: MealWithExpense | null;
  defaultDate?: string;
  defaultMealType?: MealType;
}

const MEAL_TYPES: Array<{ type: MealType; label: string; icon: React.ElementType }> = [
  { type: "breakfast", label: "Breakfast", icon: Coffee },
  { type: "lunch", label: "Lunch", icon: Sun },
  { type: "snack", label: "Snack", icon: Cookie },
  { type: "dinner", label: "Dinner", icon: Moon },
];

const LOCATIONS: Array<{
  type: MealLocation;
  label: string;
  icon: React.ElementType;
}> = [
  {
    type: "amrita_mess",
    label: "Amrita Mess",
    icon: GraduationCap,
  },
  {
    type: "home",
    label: "Home",
    icon: Home,
  },
  {
    type: "restaurant",
    label: "Restaurant",
    icon: Store,
  },
  {
    type: "office",
    label: "Office",
    icon: Building2,
  },
  {
    type: "other",
    label: "Other",
    icon: Compass,
  },
];

export function MealDialog({
  isOpen,
  onClose,
  onSave,
  editingMeal,
  defaultDate,
  defaultMealType,
}: MealDialogProps) {
  useScrollLock(isOpen);

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<MealLocation>("amrita_mess");
  const [restaurantName, setRestaurantName] = useState("");
  const [costRupees, setCostRupees] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [notesTaste, setNotesTaste] = useState("");
  const [notesHealth, setNotesHealth] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [eatAgain, setEatAgain] = useState(false);
  const [eatenAt, setEatenAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Skipped meal tracking
  const [isSkipped, setIsSkipped] = useState(false);
  const [skippedReason, setSkippedReason] = useState("Intermittent Fasting (16:8)");

  // Inline Media Vault & URL Picker states
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTab, setMediaPickerTab] = useState<"vault" | "url">("vault");
  const [vaultPhotos, setVaultPhotos] = useState<
    Array<{ id: string; file_name: string; thumb_path: string | null; media_type?: string }>
  >([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultSearch, setVaultSearch] = useState("");
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingMeal) {
        setMealType(editingMeal.meal_type);
        setDescription(editingMeal.description);
        setLocationType(editingMeal.location_type || "amrita_mess");
        setRestaurantName(editingMeal.restaurant_name || "");
        setCostRupees(
          editingMeal.expense ? paiseToRupees(editingMeal.expense.amount_paise).toString() : ""
        );
        setRating(editingMeal.rating || null);

        // Normalize photos array
        const photos = editingMeal.photo_urls && editingMeal.photo_urls.length > 0
          ? editingMeal.photo_urls
          : editingMeal.photo_url
          ? [editingMeal.photo_url]
          : [];
        setPhotoUrls(photos);

        setNotesTaste(editingMeal.notes_taste || "");
        setNotesHealth(editingMeal.notes_health || "");
        setIsFavorite(editingMeal.is_favorite || false);
        setEatAgain(editingMeal.eat_again || false);
        setIsSkipped(Boolean(editingMeal.is_skipped));
        setSkippedReason(editingMeal.skipped_reason || "Intermittent Fasting (16:8)");

        const d = new Date(editingMeal.eaten_at);
        const tzOffset = d.getTimezoneOffset() * 60000;
        setEatenAt(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
      } else {
        setMealType(defaultMealType || "lunch");
        setDescription("");
        setLocationType("amrita_mess");
        setRestaurantName("");
        setCostRupees("");
        setRating(null);
        setPhotoUrls([]);
        setNotesTaste("");
        setNotesHealth("");
        setIsFavorite(false);
        setEatAgain(false);
        setIsSkipped(false);
        setSkippedReason("Intermittent Fasting (16:8)");

        const now = defaultDate ? new Date(defaultDate) : new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        setEatenAt(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
      }
      setIsMediaPickerOpen(false);
      setUrlInput("");
      setVaultSearch("");
    }
  }, [isOpen, editingMeal, defaultDate, defaultMealType]);

  // Load Vault Photos on demand when picker opens
  useEffect(() => {
    if (isMediaPickerOpen && vaultPhotos.length === 0) {
      const loadVault = async () => {
        setIsLoadingVault(true);
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data } = await supabase
              .from("media_items")
              .select("id, file_name, thumb_path, media_type")
              .eq("user_id", user.id)
              .in("media_type", ["photo", "video"])
              .order("taken_at", { ascending: false })
              .limit(50);

            if (data) {
              setVaultPhotos(data);
            }
          }
        } catch (err) {
          console.warn("Failed to load vault photos:", err);
        } finally {
          setIsLoadingVault(false);
        }
      };

      void loadVault();
    }
  }, [isMediaPickerOpen, vaultPhotos.length]);

  if (!isOpen) return null;

  const isFreeLocation = locationType === "home" || locationType === "amrita_mess";
  const costPaise = isFreeLocation ? 0 : rupeesToPaise(costRupees);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSkipped && !description.trim()) return;

    setIsSubmitting(true);
    try {
      const utcIso = eatenAt ? new Date(eatenAt).toISOString() : new Date().toISOString();

      const computedRestaurantName =
        locationType === "amrita_mess"
          ? "Amrita Mess"
          : locationType === "home"
          ? null
          : restaurantName.trim() || null;

      const finalDescription = isSkipped
        ? (description.trim() || `Skipped ${mealType}`)
        : description.trim();

      await onSave({
        meal_type: mealType,
        description: finalDescription,
        location_type: isSkipped ? "home" : locationType,
        restaurant_name: isSkipped ? null : computedRestaurantName,
        cost_paise: isSkipped ? 0 : (costPaise > 0 ? costPaise : 0),
        rating: isSkipped ? null : rating,
        photo_url: isSkipped ? null : (photoUrls[0] || null),
        photo_urls: isSkipped ? [] : photoUrls,
        notes_taste: isSkipped ? null : (notesTaste.trim() || null),
        notes_health: notesHealth.trim() || null,
        is_favorite: isSkipped ? false : isFavorite,
        eat_again: isSkipped ? false : (locationType === "restaurant" ? eatAgain : false),
        is_skipped: isSkipped,
        skipped_reason: isSkipped ? skippedReason : null,
        eaten_at: utcIso,
      });
      onClose();
    } catch (err) {
      console.error("Error saving meal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingPhoto(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (photoUrls.length + newUrls.length >= 5) break;
        const file = files[i];
        const permanentDataUrl = await prepareFoodPhoto(file);
        if (permanentDataUrl) {
          newUrls.push(permanentDataUrl);
        }
      }
      setPhotoUrls((prev) => [...prev, ...newUrls].slice(0, 5));
    } catch (err) {
      console.error("Error compressing food photo:", err);
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleVaultPhoto = (url: string) => {
    if (!url) return;
    if (photoUrls.includes(url)) {
      setPhotoUrls((prev) => prev.filter((u) => u !== url));
    } else {
      if (photoUrls.length >= 5) return;
      setPhotoUrls((prev) => [...prev, url]);
    }
  };

  const handleAddUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (photoUrls.length < 5 && !photoUrls.includes(urlInput.trim())) {
      setPhotoUrls((prev) => [...prev, urlInput.trim()]);
    }
    setUrlInput("");
  };

  const filteredVaultPhotos = vaultPhotos.filter((p) => {
    if (!vaultSearch.trim()) return true;
    return p.file_name.toLowerCase().includes(vaultSearch.toLowerCase());
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-surface border border-border/80 rounded-3xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-surface-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text">
                {editingMeal ? "Edit Meal Record" : isSkipped ? "Log Skipped Meal" : "Log Today's Meal"}
              </h3>
              <p className="text-[11px] text-text-muted">
                {isSkipped ? "Intermittent fasting & meal skip tracking" : "Food diary & nutrition notes"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body - 2 Columns on desktop to eliminate vertical scrolling */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* LEFT COLUMN: Slots, Description, Location, Cost & Date */}
            <div className="space-y-3">
              {/* 1. Meal Type Selector + Skipped Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-muted">
                    Meal Slot
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSkipped(!isSkipped)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSkipped
                        ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40 shadow-xs"
                        : "border border-border bg-surface hover:bg-surface-muted text-text-muted hover:text-text"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{isSkipped ? "Fasting / Skipped" : "Mark as Skipped"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {MEAL_TYPES.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMealType(type)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                        mealType === type
                          ? isSkipped
                            ? "bg-purple-600 text-white shadow-xs scale-102"
                            : "bg-primary text-primary-foreground shadow-xs scale-102"
                          : "bg-surface-muted/70 text-text-muted hover:text-text hover:bg-surface-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[11px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Skipped Mode Form Panel */}
              {isSkipped ? (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Reason for Skipping {mealType.toUpperCase()}</span>
                    </span>
                    <span className="text-[10px] text-text-muted">₹0 expense logged</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      "Intermittent Fasting (16:8)",
                      "Intermittent Fasting (18:6)",
                      "Not hungry",
                      "Heavy previous meal",
                      "Busy with DSA/Coding",
                      "Woke up late",
                    ].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSkippedReason(r)}
                        className={`p-2 rounded-xl border text-left text-[11px] font-medium transition-all ${
                          skippedReason === r
                            ? "border-purple-500 bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold shadow-2xs"
                            : "border-border bg-surface text-text-muted hover:text-text hover:bg-surface-muted"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-text-muted block mb-1">
                      Optional Skip Note
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={`e.g. Fasting window active until 1:30 PM`}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* 2. Meal Description */}
                  <div>
                    <label className="text-xs font-semibold text-text mb-1 block">
                      What did you eat? *
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Masala Dosa + Sambar, Roti with Dal Tadka"
                      required
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:border-primary font-medium"
                    />
                  </div>

                  {/* 3. Location Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted block">
                      Where did you eat?
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LOCATIONS.map(({ type, label, icon: Icon }) => {
                        const isSelected = locationType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setLocationType(type)}
                            className={`py-1.5 px-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1 ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-2xs ring-1 ring-primary/30 text-primary font-bold"
                                : "border-border/70 bg-surface-muted/40 hover:bg-surface-muted text-text-muted hover:text-text"
                            }`}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            <span className="text-[11px] truncate">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Restaurant Name Input */}
                    {locationType === "restaurant" && (
                      <div className="relative pt-0.5 animate-in fade-in">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                        <input
                          type="text"
                          value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="Restaurant or Cafe Name..."
                      className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {locationType === "office" && (
                  <div className="relative pt-0.5 animate-in fade-in">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="Office / Cafeteria Name (Optional)..."
                      className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* 4. Cost Section (Free for Amrita Mess and Home) */}
              {isFreeLocation ? (
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  <div className="leading-tight">
                    <span className="font-semibold block text-text text-[11px]">
                      {locationType === "amrita_mess"
                        ? "Amrita Mess (Included in Mess Fees)"
                        : "Home Cooked Meal (Included)"}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      No per-meal expense logged. Cost is set to ₹0.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-muted">
                      Cost in INR (₹)
                    </label>
                    <span className="text-[10px] text-primary font-medium">
                      Auto-syncs Food expense
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={costRupees}
                      onChange={(e) => setCostRupees(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-6 pr-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-surface-muted/60 border border-border text-text font-mono focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
                </>
              )}

              {/* 5. Date and Time (IST) */}
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">
                  {isSkipped ? "Skipped At (IST)" : "Eaten At (IST)"}
                </label>
                <input
                  type="datetime-local"
                  value={eatenAt}
                  onChange={(e) => setEatenAt(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Rating, Favorites, Photos & Taste/Health */}
            <div className="space-y-3">
              {isSkipped ? (
                <div className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Fasting & Metabolic Rest</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    By skipping this meal slot, your body remains in fasting mode, maintaining lowered insulin levels and promoting metabolic flexibility and cellular autophagy.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-text-muted mb-1 block">
                      Health / Energy Notes (Optional)
                    </label>
                    <textarea
                      value={notesHealth}
                      onChange={(e) => setNotesHealth(e.target.value)}
                      placeholder="e.g. Felt great, had 1L lemon water and black coffee, zero brain fog..."
                      rows={5}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* 6. Rating & Flags (Favorites & Eat Again) */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-muted/30 border border-border/60">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted mb-1 block">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(rating === star ? null : star)}
                        className="text-border hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Star
                          className={`h-4.5 w-4.5 ${
                            rating && rating >= star
                              ? "fill-accent-warm text-accent-warm"
                              : "text-border hover:text-accent-warm/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isFavorite
                        ? "bg-danger/10 border-danger/30 text-danger shadow-2xs"
                        : "bg-surface border-border text-text-muted hover:text-text"
                    }`}
                    title={isFavorite ? "Favorited" : "Mark as Favorite"}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-danger" : ""}`} />
                    <span className="text-[11px]">Favorite</span>
                  </button>

                  {locationType === "restaurant" && (
                    <button
                      type="button"
                      onClick={() => setEatAgain(!eatAgain)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        eatAgain
                          ? "bg-primary/10 border-primary/30 text-primary shadow-2xs"
                          : "bg-surface border-border text-text-muted hover:text-text"
                      }`}
                      title="Mark to Eat Again"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span className="text-[11px]">Revisit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 7. Multi-Photo & Permanent Media Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-muted">
                    Photos ({photoUrls.length}/5)
                  </label>
                  <span className="text-[10px] text-text-muted">
                    Permanent WebP · Drive sync
                  </span>
                </div>

                {/* Photo Previews */}
                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {photoUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-surface-muted"
                      >
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 px-1 rounded text-[8px] font-bold bg-primary text-primary-foreground">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-danger transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Photo Action Buttons */}
                {photoUrls.length < 5 && (
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-surface-muted/70 border border-border text-xs font-semibold text-text hover:bg-surface-muted transition-colors">
                      {isCompressingPhoto ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Camera className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="text-[11px]">
                        {isCompressingPhoto ? "Compressing..." : "Add Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoFiles}
                        disabled={isCompressingPhoto}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(!isMediaPickerOpen)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        isMediaPickerOpen
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-surface-muted/70 border-border text-text hover:bg-surface-muted"
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span className="text-[11px]">Vault / URL</span>
                    </button>
                  </div>
                )}

                {/* INLINE MEDIA VAULT & URL PICKER PANEL (Zero separate modals, zero blur bleed) */}
                {isMediaPickerOpen && (
                  <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-border shadow-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMediaPickerTab("vault")}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                            mediaPickerTab === "vault"
                              ? "bg-primary text-primary-foreground"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          Media Vault ({vaultPhotos.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaPickerTab("url")}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                            mediaPickerTab === "url"
                              ? "bg-primary text-primary-foreground"
                              : "text-text-muted hover:text-text"
                          }`}
                        >
                          Paste Web URL
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(false)}
                        className="text-text-muted hover:text-text p-0.5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {mediaPickerTab === "vault" ? (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-text-muted" />
                          <input
                            type="text"
                            value={vaultSearch}
                            onChange={(e) => setVaultSearch(e.target.value)}
                            placeholder="Search vault photos..."
                            className="w-full pl-6 pr-2 py-1 text-[11px] rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {isLoadingVault ? (
                          <div className="flex items-center justify-center py-4 text-text-muted gap-1.5 text-[11px]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            <span>Loading Media Vault...</span>
                          </div>
                        ) : filteredVaultPhotos.length === 0 ? (
                          <p className="text-center py-3 text-[11px] text-text-muted">
                            No photos found in Media Vault.
                          </p>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-surface rounded-lg border border-border/50">
                            {filteredVaultPhotos.map((p) => {
                              const photoUrl = p.thumb_path || "";
                              const isSelected = photoUrls.includes(photoUrl);

                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleToggleVaultPhoto(photoUrl)}
                                  className={`relative aspect-square rounded-md overflow-hidden border transition-all ${
                                    isSelected
                                      ? "border-primary ring-2 ring-primary/40"
                                      : "border-border/60 hover:border-primary cursor-pointer"
                                  }`}
                                  title={isSelected ? "Remove media" : "Select media"}
                                >
                                  <img
                                    src={photoUrl}
                                    alt={p.file_name}
                                    className="h-full w-full object-cover"
                                  />
                                  {p.media_type === "video" && (
                                    <div className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded bg-black/60 text-white z-10">
                                      <Film className="h-2.5 w-2.5" />
                                    </div>
                                  )}
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                                      <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleAddUrlSubmit} className="flex gap-1.5 pt-1">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://images.unsplash.com/... or image URL"
                          required
                          className="flex-1 px-2.5 py-1 text-[11px] rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary font-mono"
                        />
                        <button
                          type="submit"
                          disabled={!urlInput.trim() || photoUrls.length >= 5}
                          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-95 disabled:opacity-40 transition-opacity"
                        >
                          Attach
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* 8. Taste & Health Notes */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-text-muted mb-0.5 block">
                    Taste Notes
                  </label>
                  <input
                    type="text"
                    value={notesTaste}
                    onChange={(e) => setNotesTaste(e.target.value)}
                    placeholder="e.g. Crispy, mild spice"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-text-muted mb-0.5 block">
                    Health Notes
                  </label>
                  <input
                    type="text"
                    value={notesHealth}
                    onChange={(e) => setNotesHealth(e.target.value)}
                    placeholder="e.g. High protein, fresh"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
                </>
              )}
            </div>
          </div>

          {/* 9. Bottom Submit Action (Full Width) */}
          <div className="pt-3 border-t border-border/40 mt-3">
            <button
              type="submit"
              disabled={isSubmitting || (!isSkipped && !description.trim()) || isCompressingPhoto}
              className={`w-full py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${
                isSkipped
                  ? "bg-purple-600 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 stroke-[2.5]" />
              )}
              <span>
                {isSkipped
                  ? editingMeal
                    ? "Update Skipped Meal"
                    : "Confirm Skipped Meal (Fasting)"
                  : editingMeal
                  ? "Update Meal Record"
                  : costPaise > 0
                  ? `Save Meal (${formatINR(costPaise)})`
                  : "Save Meal (₹0)"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
