"use client";

// ============================================================================
// Sahil's Shore: Company Notes View Component
// Culture, tech stack, interview stages, questions asked, and interactive checklist
// ============================================================================

import React, { useState } from "react";
import type { CompanyNote, CreateCompanyNoteInput, PrepChecklistItem } from "@/types/career";
import { CompanyNoteDialog } from "./CompanyNoteDialog";
import {
  Building2,
  Plus,
  Layers,
  Workflow,
  HelpCircle,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CompanyNotesViewProps {
  companyNotes: CompanyNote[];
  onSaveCompanyNote: (
    input: CreateCompanyNoteInput,
    existingId?: string
  ) => Promise<void>;
  onDeleteCompanyNote: (id: string) => Promise<void>;
  onToggleChecklistItem: (
    noteId: string,
    checklist: PrepChecklistItem[]
  ) => Promise<void>;
}

export function CompanyNotesView({
  companyNotes,
  onSaveCompanyNote,
  onDeleteCompanyNote,
  onToggleChecklistItem,
}: CompanyNotesViewProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CompanyNote | null>(null);

  const filteredNotes = companyNotes.filter((cn) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      cn.company.toLowerCase().includes(q) ||
      (cn.culture && cn.culture.toLowerCase().includes(q)) ||
      cn.tech_stack.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleOpenAdd = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: CompanyNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleToggleCheck = async (
    note: CompanyNote,
    itemId: string,
    currentChecked: boolean
  ) => {
    const updatedChecklist = (note.prep_checklist || []).map((item) =>
      item.id === itemId ? { ...item, checked: !currentChecked } : item
    );
    await onToggleChecklistItem(note.id, updatedChecklist);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
        <div>
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Company Intelligence & Notes</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Deep-dive company research: engineering culture, tech stack breakdown, questions asked, and prep checklists.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="inline-flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Company Note</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search by company or tech stack..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-8 text-center flex flex-col items-center justify-center">
          <Building2 className="w-10 h-10 text-primary/40 mb-2" />
          <h4 className="text-sm font-bold text-text mb-1">No company research notes found</h4>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            Document target company tech stacks, culture tips, questions asked during rounds, and track your prep checklist.
          </p>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Company Research
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => {
            const completedCount = (note.prep_checklist || []).filter((i) => i.checked).length;
            const totalCount = (note.prep_checklist || []).length;

            return (
              <div
                key={note.id}
                className="rounded-2xl border border-border/80 bg-surface p-5 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Company Name & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-text flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span>{note.company}</span>
                      </h4>
                      {note.culture && (
                        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                          {note.culture}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-muted transition-colors"
                        title="Edit company notes"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCompanyNote(note.id)}
                        className="p-1.5 text-text-muted hover:text-rose-500 rounded-lg hover:bg-surface-muted transition-colors"
                        title="Delete company notes"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tech Stack Chips */}
                  {note.tech_stack && note.tech_stack.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                        <Layers className="w-3 h-3 text-primary" /> Tech Stack:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {note.tech_stack.map((tech) => (
                          <Badge
                            key={tech}
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 h-4.5 bg-primary/10 text-primary border-primary/20"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview Process */}
                  {note.interview_process && (
                    <div className="p-2.5 rounded-xl bg-surface-muted/40 border border-border/50 text-xs">
                      <span className="font-bold text-text flex items-center gap-1 text-[11px] mb-1">
                        <Workflow className="w-3 h-3 text-amber-500" />
                        Interview Process:
                      </span>
                      <p className="text-text-muted text-[11px] leading-relaxed">
                        {note.interview_process}
                      </p>
                    </div>
                  )}

                  {/* Questions Asked */}
                  {note.questions_asked && note.questions_asked.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-text-muted" /> Questions Asked / Known:
                      </span>
                      <ul className="space-y-1 text-xs text-text pl-1">
                        {note.questions_asked.slice(0, 3).map((q, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                            <span className="text-primary font-bold">›</span>
                            <span className="truncate">{q}</span>
                          </li>
                        ))}
                        {note.questions_asked.length > 3 && (
                          <p className="text-[10px] text-text-muted italic">
                            +{note.questions_asked.length - 3} more questions in detail
                          </p>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Prep Checklist with interactive toggle */}
                  {note.prep_checklist && note.prep_checklist.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-text flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-emerald-500" />
                          Prep Checklist
                        </span>
                        <span className="text-text-muted font-medium">
                          {completedCount}/{totalCount} completed
                        </span>
                      </div>

                      <div className="space-y-1">
                        {note.prep_checklist.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleCheck(note, item.id, item.checked)}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-muted/60 cursor-pointer transition-colors text-xs"
                          >
                            {item.checked ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            )}
                            <span
                              className={`truncate flex-1 text-[11px] ${
                                item.checked
                                  ? "line-through text-text-muted"
                                  : "text-text font-medium"
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <CompanyNoteDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveCompanyNote}
        initialNote={editingNote}
      />
    </div>
  );
}
