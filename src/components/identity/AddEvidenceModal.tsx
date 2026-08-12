"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import {
  X,
  Upload,
  Link2,
  FileText,
  ShieldCheck,
  Loader2,
  Check,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import {
  evidenceKindsByCategory,
  kindToTransport,
} from "@/types/evidence-kinds";
import type { Evidence, EvidenceKind, EvidenceType } from "@/types/resume";
import {
  validateEvidenceEntry,
  isLinkKind,
  MAX_EVIDENCE_FILE_BYTES,
} from "@/lib/evidence/validate";
import { storeEvidenceBlob } from "@/lib/evidence/storage";

/**
 * AddEvidenceModal — the core of Slice 2, Task 2 (Evidence Upload Workflow).
 *
 * Attaches file/link evidence to an ACCEPTED claim. Handles the four UI states:
 *   - Empty   : no kind selected yet / no file chosen → picker + dropzone + URL.
 *   - Loading : storing the blob (IndexedDB) + persisting the record.
 *   - Error   : validation failures, upload failures, quota failures.
 *   - Success : evidence persisted, claim status advanced to evidence-added.
 *
 * Evidence is only ever attached to an accepted claim; the modal is disabled
 * for any other state. Consent is mandatory — submit is blocked without it.
 */

interface AddEvidenceModalProps {
  claimId: string;
  claimAssertion: string;
  open: boolean;
  onClose: () => void;
}

export function AddEvidenceModal({ claimId, claimAssertion, open, onClose }: AddEvidenceModalProps) {
  const addEvidence = useResumeBuilder((s) => s.addEvidence);

  // ── Form state ──
  const [kind, setKind] = useState<EvidenceKind | null>(null);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setKind(null);
    setLink("");
    setFile(null);
    setConsent(false);
    setNotes("");
    setError(null);
    setSaving(false);
    setSaved(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Derive transport for the selected kind to pick the right entry widget.
  const transport: EvidenceType | null = kind ? kindToTransport(kind) : null;

  const submitDisabled =
    saving ||
    saved ||
    !kind ||
    !consent ||
    (transport === "link" ? !link.trim() : !file);

  const handleSubmit = async () => {
    if (submitDisabled) return;

    // Full validation gate — surfaces the first problem to the user.
    const v = validateEvidenceEntry({ kind, link, file, consent });
    if (v) {
      setError(v.message);
      return;
    }
    setError(null);
    setSaving(true);

    try {
      let record: Evidence;
      const isLink = transport === "link";

      const formData = new FormData();
      formData.append("claimId", claimId);
      formData.append("evidenceKind", kind!);
      formData.append("notes", notes.trim());
      formData.append("consent", String(consent));
      if (isLink) {
        formData.append("link", link.trim());
      } else if (file) {
        formData.append("file", file);
      }

      let serverSuccess = false;
      try {
        const res = await fetch("/api/evidence", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          record = await res.json();
          serverSuccess = true;
        }
      } catch {}

      if (!serverSuccess) {
        const id = `evd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        let content = link.trim();
        let format = "link";
        const metadata: Evidence["metadata"] = {};

        if (isLink) {
          try {
            metadata.linkTitle = link.trim().replace(/^https?:\/\//, "").split("/")[0] || link.trim();
          } catch {
            metadata.linkTitle = link.trim();
          }
        } else if (file) {
          await storeEvidenceBlob(id, file);
          content = id;
          format = file.type || "file";
          metadata.fileName = file.name;
          metadata.fileSize = file.size;
          metadata.mimeType = file.type;
        }

        const now = new Date().toISOString();
        record = {
          id,
          claimId,
          evidenceType: transport ?? "document",
          evidenceKind: kind!,
          content,
          format,
          metadata,
          uploadedBy: "self",
          createdAt: now,
          updatedAt: now,
          status: "evidence-added",
          confidence: transport === "link" ? 0.7 : transport === "file" ? 0.8 : 0.9,
          notes: notes.trim(),
          visibility: "private",
          consent: true,
        };
      }

      addEvidence(record!);
      setSaving(false);
      setSaved(true);
    } catch (err: unknown) {
      setSaving(false);
      const message = err instanceof Error ? err.message : "Could not save your evidence. Please try again.";
      setError(message);
    }
  };

  const fileTooLarge = file ? file.size > MAX_EVIDENCE_FILE_BYTES : false;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0C1322] shadow-2xl shadow-black/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white">Add Evidence</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{claimAssertion}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Success state */}
              {saved ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">Evidence added successfully</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    This claim is now supported by evidence.
                  </p>
                  <p className="text-xs text-slate-500 mt-3 max-w-xs leading-relaxed">
                    Next step: add another supporting document, or continue building
                    your Professional Passport to strengthen trust.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Evidence kind picker */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Evidence type</label>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                      {evidenceKindsByCategory().map(({ category, kinds }) => (
                        <div key={category}>
                          <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1 first:mt-0">{category}</div>
                          {kinds.map((d) => (
                            <button
                              key={d.kind}
                              type="button"
                              onClick={() => { setKind(d.kind); setError(null); }}
                              className={clsx(
                                "w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                                kind === d.kind
                                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                  : "text-slate-300 hover:bg-white/[0.04] border border-transparent",
                              )}
                            >
                              <span>{d.kind}</span>
                              <span className="text-[10px] text-slate-500">{d.transport === "link" ? "Link" : "File"}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Entry widget: link vs file */}
                  {kind && (
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        {isLinkKind(kind) ? "Link" : "File"}
                      </label>
                      {isLinkKind(kind) ? (
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => { setLink(e.target.value); setError(null); }}
                          placeholder="https://github.com/yourname/repo"
                          className="mt-1.5 w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                        />
                      ) : (
                        <div>
                          <label className="mt-1.5 flex flex-col items-center justify-center w-full border border-dashed border-white/[0.12] rounded-lg px-4 py-5 cursor-pointer hover:border-blue-500/40 transition-colors">
                            <Upload className="w-5 h-5 text-slate-500 mb-1.5" />
                            <span className="text-xs text-slate-400">
                              {file ? file.name : "Click to choose a file"}
                            </span>
                            {file && (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
                            />
                          </label>
                          {fileTooLarge && (
                            <p className="mt-1.5 text-[11px] text-rose-400">
                              File is too large. Max {(MAX_EVIDENCE_FILE_BYTES / (1024 * 1024)).toFixed(0)} MB.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {kind && (
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="e.g. Official offer letter from Acme Corp"
                        className="mt-1.5 w-full bg-slate-900 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none"
                      />
                    </div>
                  )}

                  {/* Consent gate */}
                  {kind && (
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => { setConsent(e.target.checked); setError(null); }}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-slate-400 leading-relaxed">
                        I agree to let Patorbit use this document for verification and to display it as
                        supporting evidence for this claim.{" "}
                        <span className="text-slate-500">(Required)</span>
                      </span>
                    </label>
                  )}

                  {/* Error state */}
                  {error && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-[11px] text-rose-300">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!saved && (
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-white/[0.06]">
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitDisabled || !!error}
                  className={clsx(
                    "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    submitDisabled || error
                      ? "bg-white/[0.06] text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white",
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" /> Attach Evidence
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
