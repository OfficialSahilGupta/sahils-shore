"use client";

// ============================================================================
// Sahil's Shore: Application Creation & Edit Dialog
// Supports company, role, location, stage, source, INR salary range (paise math),
// resume version selection, contacts list, follow-up dates, and notes.
// ============================================================================

import React, { useState, useEffect } from "react";
import type {
  Application,
  ApplicationContact,
  ApplicationStage,
  CreateApplicationInput,
  Resume,
} from "@/types/career";
import {
  APPLICATION_STAGES,
  rupeesToSalaryPaise,
  salaryPaiseToRupees,
} from "@/lib/career";
import { todayIST, addDaysIST, toISTDateString } from "@/lib/date-utils";
import {
  Building2,
  Briefcase,
  MapPin,
  IndianRupee,
  Link as LinkIcon,
  Calendar,
  Clock,
  UserPlus,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateApplicationInput, applicationId?: string) => Promise<void>;
  application?: Application | null;
  initialStage?: ApplicationStage;
  resumes: Resume[];
}

const SOURCES = [
  "LinkedIn",
  "Referral",
  "Company Website",
  "Wellfound (AngelList)",
  "Naukri",
  "Instahyre",
  "Recruiter Reachout",
  "InMail",
  "Job Fair / Campus",
  "Other",
];

export function ApplicationDialog({
  isOpen,
  onClose,
  onSave,
  application,
  initialStage = "wishlist",
  resumes,
}: ApplicationDialogProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<ApplicationStage>(initialStage);
  const [source, setSource] = useState("LinkedIn");
  const [minRupees, setMinRupees] = useState<string>("");
  const [maxRupees, setMaxRupees] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [jobUrl, setJobUrl] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<ApplicationContact[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      setCompany(application.company || "");
      setRole(application.role || "");
      setLocation(application.location || "");
      setStage(application.stage || "wishlist");
      setSource(application.source || "LinkedIn");
      setMinRupees(
        application.salary_min_paise
          ? String(salaryPaiseToRupees(application.salary_min_paise))
          : ""
      );
      setMaxRupees(
        application.salary_max_paise
          ? String(salaryPaiseToRupees(application.salary_max_paise))
          : ""
      );
      setResumeId(application.resume_id || "");
      setJobUrl(application.job_url || "");
      setAppliedAt(
        application.applied_at ? toISTDateString(application.applied_at) : ""
      );
      setNextFollowUp(
        application.next_follow_up ? toISTDateString(application.next_follow_up) : ""
      );
      setNotes(application.notes || "");
      setContacts(
        Array.isArray(application.contacts) && application.contacts.length > 0
          ? [...application.contacts]
          : []
      );
    } else {
      setCompany("");
      setRole("");
      setLocation("");
      setStage(initialStage);
      setSource("LinkedIn");
      setMinRupees("");
      setMaxRupees("");
      // Preselect primary resume if available
      const primaryResume = resumes.find((r) => r.is_primary);
      setResumeId(primaryResume ? primaryResume.id : "");
      setJobUrl("");
      setAppliedAt(initialStage === "applied" ? todayIST() : "");
      setNextFollowUp("");
      setNotes("");
      setContacts([]);
    }
  }, [application, initialStage, isOpen, resumes]);

  if (!isOpen) return null;

  const handleAddContact = () => {
    setContacts([...contacts, { name: "", role: "", email: "", phone: "", notes: "" }]);
  };

  const handleContactChange = (index: number, field: keyof ApplicationContact, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSetQuickFollowUp = (days: number) => {
    setNextFollowUp(addDaysIST(todayIST(), days));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    try {
      setIsSubmitting(true);

      const minPaise = minRupees.trim()
        ? rupeesToSalaryPaise(Number(minRupees.replace(/,/g, "")))
        : null;
      const maxPaise = maxRupees.trim()
        ? rupeesToSalaryPaise(Number(maxRupees.replace(/,/g, "")))
        : null;

      const input: CreateApplicationInput = {
        company: company.trim(),
        role: role.trim(),
        location: location.trim() || null,
        stage,
        source: source.trim() || null,
        salary_min_paise: minPaise,
        salary_max_paise: maxPaise,
        resume_id: resumeId || null,
        job_url: jobUrl.trim() || null,
        applied_at: appliedAt ? new Date(`${appliedAt}T00:00:00Z`).toISOString() : null,
        next_follow_up: nextFollowUp ? new Date(`${nextFollowUp}T09:00:00Z`).toISOString() : null,
        notes: notes.trim() || null,
        contacts: contacts.filter((c) => c.name.trim() !== ""),
      };

      await onSave(input, application?.id);
      onClose();
    } catch (err) {
      console.error("Failed to save application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text">
              {application ? "Edit Application" : "New Job Application"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Row 1: Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Google, Razorpay"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Job Role / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Backend Engineer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Row 2: Stage & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Kanban Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ApplicationStage)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {APPLICATION_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Application Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Location & Job URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Location / Mode</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Bengaluru (Hybrid) or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Job Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="url"
                  placeholder="https://jobs.lever.co/..."
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Salary Range (INR, stored in paise) */}
          <div className="rounded-xl border border-border/70 bg-surface-muted/30 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Target Salary / CTC (INR)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-text-muted mb-1">Min (₹ in Rupees)</label>
                <input
                  type="number"
                  placeholder="e.g. 1800000 (18 LPA)"
                  value={minRupees}
                  onChange={(e) => setMinRupees(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">Max (₹ in Rupees)</label>
                <input
                  type="number"
                  placeholder="e.g. 2400000 (24 LPA)"
                  value={maxRupees}
                  onChange={(e) => setMaxRupees(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Resume Version Used */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Resume Version Sent
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- No specific resume attached --</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.version_label} - {r.title} {r.is_primary ? "(Master)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Dates & Follow-up Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Applied Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text">Next Follow-Up</label>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSetQuickFollowUp(3)}
                    className="text-primary hover:underline"
                  >
                    +3d
                  </button>
                  <span className="text-text-muted">·</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickFollowUp(7)}
                    className="text-primary hover:underline"
                  >
                    +1w
                  </button>
                  <span className="text-text-muted">·</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickFollowUp(14)}
                    className="text-primary hover:underline"
                  >
                    +2w
                  </button>
                </div>
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Row 7: Contacts List */}
          <div className="rounded-xl border border-border/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text">Recruiter / Referral Contacts</label>
              <button
                type="button"
                onClick={handleAddContact}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-text-muted italic">No contacts added yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {contacts.map((c, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg bg-surface-muted/40 p-2 border border-border/50 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Name"
                      value={c.name}
                      onChange={(e) => handleContactChange(index, "name", e.target.value)}
                      className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Recruiter)"
                      value={c.role || ""}
                      onChange={(e) => handleContactChange(index, "role", e.target.value)}
                      className="w-28 rounded border border-border bg-surface px-2 py-1 text-xs text-text"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={c.email || ""}
                      onChange={(e) => handleContactChange(index, "email", e.target.value)}
                      className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
                      className="text-text-muted hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 8: Notes */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Notes & Follow-up Log</label>
            <textarea
              rows={3}
              placeholder="Application notes, interview rounds feedback, discussion points..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !company.trim() || !role.trim()}>
              {isSubmitting ? "Saving..." : application ? "Update Application" : "Create Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
