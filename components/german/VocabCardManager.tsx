"use client";

// ============================================================================
// Sahil's Shore: German Vocab Card Manager
// Card grid, search, filters, audio playback, creation modal, and review launcher
// ============================================================================

import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Volume2,
  Trash2,
  Edit2,
  Sparkles,
  Calendar,
  Layers,
  Check,
  X,
} from "lucide-react";
import type { VocabCard } from "@/types";
import { type CreateVocabCardInput } from "@/lib/german";
import { playGermanSpeech } from "@/lib/german/speech";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/german/constants";
import { formatIntervalLabel } from "@/lib/german/sm2";
import { getISTDateString } from "@/lib/date-utils";

interface VocabCardManagerProps {
  cards: VocabCard[];
  dueCards: VocabCard[];
  onStartReview: () => void;
  onCreateCard: (input: CreateVocabCardInput) => Promise<void>;
  onUpdateCard: (id: string, input: Partial<CreateVocabCardInput>) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  onOpenPronunciation: (word: string) => void;
}

export function VocabCardManager({
  cards,
  dueCards,
  onStartReview,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onOpenPronunciation,
}: VocabCardManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<VocabCard | null>(null);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Form State
  const [formWord, setFormWord] = useState("");
  const [formGender, setFormGender] = useState<"der" | "die" | "das" | "">("");
  const [formPlural, setFormPlural] = useState("");
  const [formMeaning, setFormMeaning] = useState("");
  const [formExample, setFormExample] = useState("");
  const [formLevel, setFormLevel] = useState<CefrLevel>("A1");
  const [formTags, setFormTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Filter cards
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.german_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.english_meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGender =
      selectedGender === "all" ||
      (selectedGender === "none" && !c.gender) ||
      c.gender === selectedGender;

    const matchesLevel =
      selectedLevel === "all" || c.cefr_level === selectedLevel;

    return matchesSearch && matchesGender && matchesLevel;
  });

  const handlePlayAudio = async (card: VocabCard) => {
    setPlayingWordId(card.id);
    try {
      await playGermanSpeech(card.german_text, { rate: 0.9 });
    } finally {
      setPlayingWordId(null);
    }
  };

  const openAddModal = () => {
    setEditingCard(null);
    setFormWord("");
    setFormGender("");
    setFormPlural("");
    setFormMeaning("");
    setFormExample("");
    setFormLevel("A1");
    setFormTags("");
    setIsAddModalOpen(true);
  };

  const openEditModal = (card: VocabCard) => {
    setEditingCard(card);
    setFormWord(card.german_text);
    setFormGender(card.gender || "");
    setFormPlural(card.plural || "");
    setFormMeaning(card.english_meaning);
    setFormExample(card.example_sentence || "");
    setFormLevel(card.cefr_level as CefrLevel);
    setFormTags((card.tags || []).join(", "));
    setIsAddModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim() || !formMeaning.trim()) return;

    setIsSaving(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const input: CreateVocabCardInput = {
        german_text: formWord.trim(),
        gender: (formGender || null) as "der" | "die" | "das" | null,
        plural: formPlural.trim() || null,
        english_meaning: formMeaning.trim(),
        example_sentence: formExample.trim() || null,
        cefr_level: formLevel,
        tags: tagsArray,
      };

      if (editingCard) {
        await onUpdateCard(editingCard.id, input);
      } else {
        await onCreateCard(input);
      }
      setIsAddModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getGenderBadge = (gender: string | null) => {
    if (gender === "der") {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-500/15 text-blue-500 border border-blue-500/30">
          der
        </span>
      );
    }
    if (gender === "die") {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-500/15 text-rose-500 border border-rose-500/30">
          die
        </span>
      );
    }
    if (gender === "das") {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          das
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-surface-muted text-text-muted">
        no article
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search, Filters, Start Review & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search word, meaning, or tags..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface border border-surface-muted focus:outline-none focus:ring-2 focus:ring-primary text-text placeholder:text-text-muted"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {dueCards.length > 0 ? (
            <button
              onClick={onStartReview}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary hover:opacity-90 text-white flex items-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Review Due Cards</span>
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-white text-primary font-bold">
                {dueCards.length}
              </span>
            </button>
          ) : (
            <button
              onClick={onStartReview}
              disabled={cards.length === 0}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-surface border border-surface-muted hover:bg-surface-muted text-text flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Free Practice</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 text-sm font-medium rounded-xl bg-surface-muted hover:bg-surface border border-surface-muted text-text flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Word</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-text-muted font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Gender:
        </span>
        {["all", "der", "die", "das", "none"].map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGender(g)}
            className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
              selectedGender === g
                ? "bg-primary text-white font-semibold"
                : "bg-surface border border-surface-muted text-text-muted hover:text-text"
            }`}
          >
            {g === "none" ? "Other" : g}
          </button>
        ))}

        <span className="text-text-muted font-medium ml-3 mr-1">Level:</span>
        {["all", ...CEFR_LEVELS].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              selectedLevel === lvl
                ? "bg-primary text-white font-semibold"
                : "bg-surface border border-surface-muted text-text-muted hover:text-text"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        {filteredCards.map((card) => {
          const isDue =
            new Date(card.next_review_at).getTime() <= Date.now();

          return (
            <div
              key={card.id}
              className={`p-4 rounded-2xl bg-surface border transition-all flex flex-col justify-between hover:border-primary/40 ${
                isDue ? "border-primary/40 ring-1 ring-primary/20" : "border-surface-muted"
              }`}
            >
              <div>
                {/* Header row: Gender badge, Level, and Action menu */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {getGenderBadge(card.gender)}
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-surface-muted text-text-muted">
                      {card.cefr_level}
                    </span>
                    {isDue && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Due
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePlayAudio(card)}
                      disabled={playingWordId === card.id}
                      className={`p-1.5 rounded-lg transition-all ${
                        playingWordId === card.id
                          ? "bg-primary text-white scale-110"
                          : "text-text-muted hover:text-primary hover:bg-surface-muted"
                      }`}
                      title="Listen (de-DE)"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openEditModal(card)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                      title="Edit Card"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteCard(card.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* German text & English Meaning */}
                <h4 className="text-lg font-bold text-text tracking-tight">
                  {card.german_text}
                </h4>
                {card.plural && card.plural !== "-" && (
                  <p className="text-xs text-text-muted italic -mt-0.5">
                    Plural: {card.plural}
                  </p>
                )}
                <p className="text-sm font-medium text-primary mt-1">
                  {card.english_meaning}
                </p>

                {/* Example sentence */}
                {card.example_sentence && (
                  <p className="text-xs text-text-muted mt-2 line-clamp-2">
                    &ldquo;{card.example_sentence}&rdquo;
                  </p>
                )}

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap mt-2.5">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-surface-muted text-text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SM-2 Footer Stats */}
              <div className="mt-4 pt-2.5 border-t border-surface-muted flex items-center justify-between text-[11px] text-text-muted">
                <span title="Repetition streak & ease factor">
                  Rep: <strong className="text-text">{card.repetition}</strong> (EF: {Number(card.ease_factor).toFixed(2)})
                </span>
                <span title={`Next review: ${getISTDateString(card.next_review_at)}`}>
                  Interval: <strong className="text-text">{formatIntervalLabel(card.interval)}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-surface border border-surface-muted text-text-muted text-sm">
          No vocabulary cards matched your filter. Try clearing search or add a new card!
        </div>
      )}

      {/* Add / Edit Card Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface border border-surface-muted rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-muted pb-3">
              <h3 className="text-lg font-bold text-text">
                {editingCard ? "Edit German Card" : "Add German Card"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-text-muted block mb-1">
                    Gender (Article)
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">None / Verb</option>
                    <option value="der">der (m)</option>
                    <option value="die">die (f)</option>
                    <option value="das">das (n)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-text-muted block mb-1">
                    German Word *
                  </label>
                  <input
                    type="text"
                    required
                    value={formWord}
                    onChange={(e) => setFormWord(e.target.value)}
                    placeholder="e.g. Schlüssel"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">
                    Plural (if noun)
                  </label>
                  <input
                    type="text"
                    value={formPlural}
                    onChange={(e) => setFormPlural(e.target.value)}
                    placeholder="e.g. die Schlüssel"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">
                    CEFR Level
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as CefrLevel)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CEFR_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  English Meaning *
                </label>
                <input
                  type="text"
                  required
                  value={formMeaning}
                  onChange={(e) => setFormMeaning(e.target.value)}
                  placeholder="e.g. key"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Example Sentence
                </label>
                <textarea
                  rows={2}
                  value={formExample}
                  onChange={(e) => setFormExample(e.target.value)}
                  placeholder="e.g. Ich habe meinen Schlüssel vergessen."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="daily, household, travel"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t border-surface-muted flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-text-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary hover:opacity-90 text-white shadow-sm disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingCard ? "Update Card" : "Add Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
