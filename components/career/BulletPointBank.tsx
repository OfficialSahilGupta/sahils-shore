"use client";

// ============================================================================
// Sahil's Shore: Bullet-Point Bank Component
// Reusable achievement bullets tagged by skill/project/role with action-verb +
// metric checker and 1-click clipboard copy.
// ============================================================================

import React, { useState, useMemo } from "react";
import type { BulletPoint, CreateBulletInput } from "@/types/career";
import { analyzeBulletPoint } from "@/lib/career";
import { BulletAnalyzerModal } from "./BulletAnalyzerModal";
import {
  Sparkles,
  Search,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  Tag,
  Briefcase,
  Layers,
  Wand2,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";

interface BulletPointBankProps {
  bullets: BulletPoint[];
  onSaveBullet: (input: CreateBulletInput, existingId?: string) => Promise<void>;
  onDeleteBullet: (id: string) => Promise<void>;
}

export function BulletPointBank({
  bullets,
  onSaveBullet,
  onDeleteBullet,
}: BulletPointBankProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSkill, setSelectedSkill] = useState<string>("All");
  const [editingBullet, setEditingBullet] = useState<BulletPoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract all unique categories and skills
  const categories = useMemo(() => {
    const set = new Set<string>();
    bullets.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ["All", ...Array.from(set)];
  }, [bullets]);

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    bullets.forEach((b) => {
      (b.skills || []).forEach((s) => set.add(s));
    });
    return ["All", ...Array.from(set)];
  }, [bullets]);

  // Filter bullets
  const filteredBullets = useMemo(() => {
    return bullets.filter((b) => {
      if (selectedCategory !== "All" && b.category !== selectedCategory) {
        return false;
      }
      if (selectedSkill !== "All" && !b.skills.includes(selectedSkill)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesContent = b.content.toLowerCase().includes(q);
        const matchesRole = b.role?.toLowerCase().includes(q);
        const matchesProject = b.project?.toLowerCase().includes(q);
        const matchesSkills = b.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesContent && !matchesRole && !matchesProject && !matchesSkills) {
          return false;
        }
      }
      return true;
    });
  }, [bullets, search, selectedCategory, selectedSkill]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const handleOpenAdd = () => {
    setEditingBullet(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bullet: BulletPoint) => {
    setEditingBullet(bullet);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search / Add Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
        <div>
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Achievement Bullet Bank</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Battle-tested resume bullet points with action-verb + metric checkers and 1-click clipboard copy.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="inline-flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Bullet</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between min-w-0 max-w-full">
        <div className="relative min-w-0 flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search bullets, skills, projects, or roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            containerClassName="w-auto max-w-[170px]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </Select>

          {allSkills.length > 1 && (
            <Select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              containerClassName="w-auto max-w-[170px]"
            >
              {allSkills.map((s) => (
                <option key={s} value={s}>
                  Skill: {s}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* Bullets List */}
      {filteredBullets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface/40 p-8 text-center flex flex-col items-center justify-center">
          <Wand2 className="w-10 h-10 text-primary/40 mb-2" />
          <h4 className="text-sm font-bold text-text mb-1">No achievement bullets found</h4>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            {search || selectedCategory !== "All" || selectedSkill !== "All"
              ? "Try adjusting your search query or category filters."
              : "Compose your first quantified achievement bullet with our live impact analyzer."}
          </p>
          <Button onClick={handleOpenAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Compose Bullet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBullets.map((bullet) => {
            const analysis = analyzeBulletPoint(bullet.content);
            const isCopied = copiedId === bullet.id;

            return (
              <div
                key={bullet.id}
                className="group relative rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Strength badge & Category */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          analysis.strength === "strong"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : analysis.strength === "good"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {analysis.strength === "strong"
                          ? "Strong"
                          : analysis.strength === "good"
                          ? "Good"
                          : "Needs Metric"}
                      </span>

                      {bullet.category && (
                        <span className="text-[10px] font-medium text-text-muted bg-surface-muted px-2 py-0.5 rounded-md border border-border/40">
                          {bullet.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(bullet)}
                        className="p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-muted"
                        title="Edit bullet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBullet(bullet.id)}
                        className="p-1 text-text-muted hover:text-rose-500 rounded-md hover:bg-surface-muted"
                        title="Delete bullet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bullet Content */}
                  <p className="text-xs text-text font-normal leading-relaxed mb-3">
                    {bullet.content}
                  </p>

                  {/* Context chips: Project & Role */}
                  {(bullet.project || bullet.role) && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted mb-2">
                      {bullet.project && (
                        <span className="inline-flex items-center gap-1 bg-surface-muted/50 px-2 py-0.5 rounded border border-border/40">
                          <Layers className="w-3 h-3 text-primary" />
                          <span className="font-medium text-text">{bullet.project}</span>
                        </span>
                      )}
                      {bullet.role && (
                        <span className="inline-flex items-center gap-1 bg-surface-muted/50 px-2 py-0.5 rounded border border-border/40">
                          <Briefcase className="w-3 h-3 text-text-muted" />
                          <span>{bullet.role}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Skills tags */}
                  {bullet.skills && bullet.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {bullet.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer: Copy Button & Metric Status */}
                <div className="mt-2 pt-2.5 border-t border-border/60 flex items-center justify-between">
                  <div className="text-[11px] text-text-muted">
                    {analysis.hasMetric ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>{analysis.metricsFound[0]}</span>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Add a number</span>
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(bullet.id, bullet.content)}
                    className="h-7 text-xs inline-flex items-center gap-1 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Analyzer Composer Modal */}
      <BulletAnalyzerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveBullet}
        initialBullet={editingBullet}
      />
    </div>
  );
}
