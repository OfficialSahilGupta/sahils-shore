"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Meal Dialog (Food Diary)
// Log/edit meal: type, items, location, cost (auto-linked expense), rating,
// photo, taste/health notes, favorites, and places to eat again.
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Star,
  Camera,
  MapPin,
  Utensils,
  Heart,
  Sparkles,
  Check,
  RotateCcw,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";
import { formatINR, rupeesToPaise, paiseToRupees } from "@/lib/expenses";
import type { MealType, MealLocation, CreateMealInput, MealWithExpense } from "@/lib/food";

interface MealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateMealInput) => Promise<void>;
  editingMeal?: MealWithExpense | null;
  defaultDate?: string;
  defaultMealType?: MealType;
}

const MEAL_TYPES: Array<{ type: MealType; label: string; icon: any }> = [
  { type: "breakfast", label: "Breakfast", icon: Coffee },
  { type: "lunch", label: "Lunch", icon: Sun },
  { type: "snack", label: "Snack", icon: Cookie },
  { type: "dinner", label: "Dinner", icon: Moon },
];

const LOCATIONS: Array<{ type: MealLocation; label: string }> = [
  { type: "home", label: "Home" },
  { type: "restaurant", label: "Restaurant / Cafe" },
  { type: "office", label: "Office" },
  { type: "other", label: "Other" },
];

export function MealDialog({
  isOpen,
  onClose,
  onSave,
  editingMeal,
  defaultDate,
  defaultMealType,
}: MealDialogProps) {
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<MealLocation>("home");
  const [restaurantName, setRestaurantName] = useState("");
  const [costRupees, setCostRupees] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notesTaste, setNotesTaste] = useState("");
  const [notesHealth, setNotesHealth] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [eatAgain, setEatAgain] = useState(false);
  const [eatenAt, setEatenAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingMeal) {
        setMealType(editingMeal.meal_type);
        setDescription(editingMeal.description);
        setLocationType(editingMeal.location_type || "home");
        setRestaurantName(editingMeal.restaurant_name || "");
        setCostRupees(
          editingMeal.expense ? paiseToRupees(editingMeal.expense.amount_paise).toString() : ""
        );
        setRating(editingMeal.rating || null);
        setPhotoUrl(editingMeal.photo_url || null);
        setNotesTaste(editingMeal.notes_taste || "");
        setNotesHealth(editingMeal.notes_health || "");
        setIsFavorite(editingMeal.is_favorite || false);
        setEatAgain(editingMeal.eat_again || false);

        const d = new Date(editingMeal.eaten_at);
        const tzOffset = d.getTimezoneOffset() * 60000;
        setEatenAt(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
      } else {
        setMealType(defaultMealType || "lunch");
        setDescription("");
        setLocationType("home");
        setRestaurantName("");
        setCostRupees("");
        setRating(null);
        setPhotoUrl(null);
        setNotesTaste("");
        setNotesHealth("");
        setIsFavorite(false);
        setEatAgain(false);

        const now = defaultDate ? new Date(defaultDate) : new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        setEatenAt(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
      }
    }
  }, [isOpen, editingMeal, defaultDate, defaultMealType]);

  if (!isOpen) return null;

  const costPaise = rupeesToPaise(costRupees);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const utcIso = eatenAt ? new Date(eatenAt).toISOString() : new Date().toISOString();

      await onSave({
        meal_type: mealType,
        description: description.trim(),
        location_type: locationType,
        restaurant_name: locationType !== "home" ? restaurantName.trim() || null : null,
        cost_paise: costPaise > 0 ? costPaise : undefined,
        rating,
        photo_url: photoUrl,
        notes_taste: notesTaste.trim() || null,
        notes_health: notesHealth.trim() || null,
        is_favorite: isFavorite,
        eat_again: eatAgain,
        eaten_at: utcIso,
      });
      onClose();
    } catch (err) {
      console.error("Error saving meal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-surface border border-border/70 rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-accent-warm/15 flex items-center justify-center text-accent-warm">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                {editingMeal ? "Edit Meal" : "Log Meal"}
              </h3>
              <p className="text-xs text-text-muted">Food diary & auto-expense tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Meal Type Selector */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1.5 block">
              Meal Slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMealType(type)}
                  className={`py-2 px-1.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    mealType === type
                      ? "bg-primary text-primary-foreground shadow-sm scale-102"
                      : "bg-surface-muted text-text-muted hover:text-text"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meal Description / Dishes */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              What did you eat? *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Masala Dosa + Filter Coffee, Dal Makhani with Roti"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-surface-muted/60 border border-border/70 text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary font-medium"
            />
          </div>

          {/* Location & Restaurant Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-muted block">
              Where did you eat?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {LOCATIONS.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLocationType(type)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    locationType === type
                      ? "bg-text text-surface font-semibold"
                      : "bg-surface-muted text-text-muted hover:text-text"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {locationType !== "home" && (
              <div className="relative pt-1 animate-in fade-in">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Restaurant or Cafe Name..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Cost in INR (Auto-creates linked expense) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-text-muted">
                Cost (₹ INR)
              </label>
              <span className="text-[11px] text-primary font-medium">
                Auto-creates linked Food expense
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
                ₹
              </span>
              <input
                type="number"
                step="5"
                min="0"
                value={costRupees}
                onChange={(e) => setCostRupees(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 text-sm font-semibold rounded-xl bg-surface-muted/60 border border-border text-text font-mono focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Star Rating & Quick Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* 1-5 Star Rating */}
            <div>
              <label className="text-xs font-medium text-text-muted mb-1.5 block">
                Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? null : star)}
                    className="p-1 text-border hover:scale-110 active:scale-95 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating && rating >= star
                          ? "fill-accent-warm text-accent-warm"
                          : "text-border hover:text-accent-warm/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite & Eat Again Toggles */}
            <div className="flex flex-col justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isFavorite
                    ? "bg-danger/10 border-danger/30 text-danger"
                    : "bg-surface-muted border-border text-text-muted hover:text-text"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-danger" : ""}`} />
                <span>Favorite Meal</span>
              </button>

              <button
                type="button"
                onClick={() => setEatAgain(!eatAgain)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  eatAgain
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-surface-muted border-border text-text-muted hover:text-text"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Place to eat again</span>
              </button>
            </div>
          </div>

          {/* Taste & Health Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Taste Notes
              </label>
              <input
                type="text"
                value={notesTaste}
                onChange={(e) => setNotesTaste(e.target.value)}
                placeholder="e.g. Crispy, mild spice, rich gravy"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Health Notes
              </label>
              <input
                type="text"
                value={notesHealth}
                onChange={(e) => setNotesHealth(e.target.value)}
                placeholder="e.g. High protein, fresh salad, low oil"
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Date & Photo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Eaten At (IST)
              </label>
              <input
                type="datetime-local"
                value={eatenAt}
                onChange={(e) => setEatenAt(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface-muted/60 border border-border text-text focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">
                Photo
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted border border-border text-xs font-medium text-text hover:bg-border/50 transition-colors">
                  <Camera className="h-3.5 w-3.5 text-primary" />
                  <span>Attach</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoUrl && (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={photoUrl}
                      alt="Meal"
                      className="h-8 w-8 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="text-[11px] text-danger hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>
                {editingMeal
                  ? "Update Meal Record"
                  : costPaise > 0
                  ? `Save Meal (${formatINR(costPaise)})`
                  : "Save Meal"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
