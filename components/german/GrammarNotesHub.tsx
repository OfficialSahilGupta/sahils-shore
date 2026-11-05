"use client";

// ============================================================================
// Sahil's Shore: German Grammar Notes Hub
// Tagged by CEFR level and topic, markdown explanation, and rule-example pairs
// ============================================================================

import React, { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  BookOpen,
  Filter,
  CheckCircle2,
  X,
  Tag,
  ChevronRight,
} from "lucide-react";
import type { GrammarNote } from "@/types";
import { type CreateGrammarNoteInput } from "@/lib/german";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/german/constants";
import { Select } from "@/components/ui/select";

interface GrammarNotesHubProps {
  notes: GrammarNote[];
  onCreateNote: (input: CreateGrammarNoteInput) => Promise<void>;
}

export function GrammarNotesHub({ notes, onCreateNote }: GrammarNotesHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedNote, setSelectedNote] = useState<GrammarNote | null>(
    notes[0] || null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formLevel, setFormLevel] = useState<CefrLevel>("A1");
  const [formTopic, setFormTopic] = useState("General");
  const [formTags, setFormTags] = useState("");
  const [formContent, setFormContent] = useState("");
  const [rule1, setRule1] = useState("");
  const [example1, setExample1] = useState("");
  const [rule2, setRule2] = useState("");
  const [example2, setExample2] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Distinct topics
  const topics = Array.from(
    new Set(notes.map((n) => n.topic || "General").filter(Boolean))
  );

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesLevel =
      selectedLevel === "all" || n.cefr_level === selectedLevel;

    const matchesTopic =
      selectedTopic === "all" || n.topic === selectedTopic;

    return matchesSearch && matchesLevel && matchesTopic;
  });

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsSaving(true);
    try {
      const tagsArray = formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const rules: Array<{ rule: string; example: string }> = [];
      if (rule1.trim()) rules.push({ rule: rule1.trim(), example: example1.trim() });
      if (rule2.trim()) rules.push({ rule: rule2.trim(), example: example2.trim() });

      const input: CreateGrammarNoteInput = {
        title: formTitle.trim(),
        cefr_level: formLevel,
        topic: formTopic.trim() || "General",
        tags: tagsArray,
        content: formContent.trim(),
        rules,
      };

      await onCreateNote(input);
      setIsAddModalOpen(false);
      setFormTitle("");
      setFormContent("");
      setRule1("");
      setExample1("");
      setRule2("");
      setExample2("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search grammar rules, topics, or keywords..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-surface border border-surface-muted focus:outline-none focus:ring-2 focus:ring-primary text-text placeholder:text-text-muted"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 text-sm font-semibold rounded-xl bg-primary hover:opacity-90 text-white flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Grammar Note</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-text-muted font-medium mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Level:
        </span>
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

        {topics.length > 0 && (
          <>
            <span className="text-text-muted font-medium ml-3 mr-1">Topic:</span>
            {["all", ...topics].map((top) => (
              <button
                key={top}
                onClick={() => setSelectedTopic(top)}
                className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${
                  selectedTopic === top
                    ? "bg-primary text-white font-semibold"
                    : "bg-surface border border-surface-muted text-text-muted hover:text-text"
                }`}
              >
                {top}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Notes Index List (4 columns) */}
        <div className="lg:col-span-4 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredNotes.map((note) => {
            const isSelected = selectedNote?.id === note.id;

            return (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                    : "bg-surface border-surface-muted hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-surface-muted text-text-muted">
                    {note.cefr_level}
                  </span>
                  <span className="text-[11px] font-medium text-primary">
                    {note.topic}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-text line-clamp-1">
                  {note.title}
                </h4>

                <p className="text-xs text-text-muted line-clamp-2 mt-1">
                  {note.content}
                </p>
              </div>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="p-6 text-center text-xs text-text-muted bg-surface rounded-2xl border border-surface-muted">
              No grammar notes matched your search.
            </div>
          )}
        </div>

        {/* Right: Active Note Reader (8 columns) */}
        <div className="lg:col-span-8">
          {selectedNote ? (
            <div className="p-6 sm:p-7 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-surface-muted pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/15 text-primary border border-primary/20">
                    {selectedNote.cefr_level}
                  </span>
                  <span className="text-xs font-semibold text-text-muted">
                    {selectedNote.topic}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-text">
                  {selectedNote.title}
                </h2>
              </div>

              {/* Note Content / Markdown */}
              <div className="text-sm text-text leading-relaxed whitespace-pre-line p-4 rounded-xl bg-surface-muted/40 border border-surface-muted">
                {selectedNote.content}
              </div>

              {/* Structured Rules & Examples Cards */}
              {Array.isArray(selectedNote.rules) && selectedNote.rules.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Key Grammar Rules & Examples
                  </h4>
                  <div className="space-y-2.5">
                    {(selectedNote.rules as Array<{ rule: string; example: string }>).map(
                      (r, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-surface border border-surface-muted space-y-1.5"
                        >
                          <div className="text-xs font-bold text-text flex items-start gap-1.5">
                            <span className="text-primary font-mono">•</span>
                            <span>{r.rule}</span>
                          </div>
                          {r.example && (
                            <div className="text-xs font-mono p-2 rounded-lg bg-surface-muted/60 text-primary border border-surface-muted/60">
                              {r.example}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="pt-3 border-t border-surface-muted flex items-center gap-1.5 flex-wrap">
                  {selectedNote.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-surface-muted text-text-muted font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-text-muted text-sm bg-surface rounded-2xl border border-surface-muted">
              Select a grammar note to view rules and examples.
            </div>
          )}
        </div>
      </div>

      {/* Add Grammar Note Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-surface border border-surface-muted rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-muted pb-3">
              <h3 className="text-lg font-bold text-text">New Grammar Note</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Dativ Prepositions (aus, bei, mit, nach...)"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">
                    CEFR Level
                  </label>
                  <Select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as CefrLevel)}
                    options={CEFR_LEVELS.map((lvl) => ({ value: lvl, label: lvl }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="e.g. Prepositions"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Grammar Explanation (Markdown) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Explain the grammar rule, exceptions, and patterns..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Rule & Example Pairs */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Key Rules & Examples (Optional)
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rule1}
                    onChange={(e) => setRule1(e.target.value)}
                    placeholder="Rule 1: Prepositions that always trigger Dativ"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={example1}
                    onChange={(e) => setExample1(e.target.value)}
                    placeholder="Example 1: Ich fahre mit dem Bus."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-surface-muted border border-surface-muted text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="cases, dativ, prepositions"
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
                  {isSaving ? "Saving..." : "Save Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
