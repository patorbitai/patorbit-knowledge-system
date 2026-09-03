"use client";

import { useState, useRef, useEffect } from "react";
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
  Info,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import {
  evidenceKindsByCategory,
  kindToTransport,
  getEvidenceKind,
} from "@/types/evidence-kinds";
import type { Evidence, EvidenceKind, EvidenceType } from "@/types/resume";
import {
  validateEvidenceEntry,
  isLinkKind,
  MAX_EVIDENCE_FILE_BYTES,
} from "@/lib/evidence/validate";
import { storeEvidenceBlob } from "@/lib/evidence/storage";

/**
 * AddEvidenceModal — polished evidence upload dialog.
 *
 * Supports four UI states:
 *   - Form   : evidence type picker + entry form
 *   - Loading: storing blob + persisting record
 *   - Error  : validation / upload failures
 *   - Success: evidence persisted, claim advanced
 */

interface AddEvidenceModalProps {
  claimId: string;
  claimAssertion: string;
  open: boolean;
  onClose: () => void;
}

/* ── Evidence Kind Card ──────────────────────────────────────────────────── */

function EvidenceKindCard({
  kind,
  category,
  transport,
  hint,
  isSelected,
  onSelect,
}: {
  kind: string;
  category: string;
  transport: string;
  hint: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const icon =
    transport === "link" ? (
      <Link2 className="w-4 h-4" />
    ) : transport === "file" ? (
      <Upload className="w-4 h-4" />
    ) : (
      <FileText className="w-4 h-4" />
    );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "w-full text-left rounded-xl border px-4 py-3 transition-all duration-150",
        isSelected
          ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20"
          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10]"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            "mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/[0.06] text-slate-400"
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "text-sm font-medium",
                isSelected ? "text-blue-300" : "text-white"
              )}
            >
              {kind}
            </span>
            <span className="text-[10px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
              {transport === "link" ? "URL" : "File"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{hint}</p>
        </div>
        {isSelected && (
          <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export function AddEvidenceModal({
  claimId,
  claimAssertion,
  open,
  onClose,
}: AddEvidenceModalProps) {
  const addEvidence = useResumeBuilder((s) => s.addEvidence);
  const modalRef = useRef<HTMLDivElement>(null);

  // ── Form state ──
  const [kind, setKind] = useState<EvidenceKind | null>(null);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [kindPickerOpen, setKindPickerOpen] = useState(true);

  const reset = () => {
    setKind(null);
    setLink("");
    setFile(null);
    setConsent(false);
    setNotes("");
    setError(null);
    setSaving(false);
    setSaved(false);
    setDragOver(false);
    setKindPickerOpen(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Focus trap
  useEffect(() => {
    if (open && modalRef.current) {
      modalRef.current.focus();
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Derive transport for the selected kind
  const transport: EvidenceType | null = kind ? kindToTransport(kind) : null;
  const kindDef = kind ? getEvidenceKind(kind) : null;

  const submitDisabled =
    saving ||
    saved ||
    !kind ||
    !consent ||
    (transport === "link" ? !link.trim() : !file);

  const handleSubmit = async () => {
    if (submitDisabled) return;

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
            metadata.linkTitle =
              link.trim().replace(/^https?:\/\//, "").split("/")[0] || link.trim();
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
      const message =
        err instanceof Error
          ? err.message
          : "Could not save your evidence. Please try again.";
      setError(message);
    }
  };

  const fileTooLarge = file ? file.size > MAX_EVIDENCE_FILE_BYTES : false;

  // File drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
          onClick={handleClose}
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#0C1322] shadow-2xl shadow-black/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.06]">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white">
                  Add Evidence
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Support your claim with a source or document
                </p>
              </div>
              <button
                onClick={handleClose}
                className="ml-4 p-1.5 rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-white transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable Body ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Success state */}
              {saved ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Check className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-semibold text-white">
                    Evidence added
                  </h4>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
                    Your claim is now supported by evidence. You can add more
                    supporting documents or continue building your Professional
                    Passport.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Claim Context ─────────────────────────────── */}
                  <div className="rounded-xl bg-blue-500/[0.06] border border-blue-500/[0.12] px-4 py-3">
                    <p className="text-[10px] font-medium text-blue-400/70 uppercase tracking-wider mb-1">
                      Claim you&apos;re supporting
                    </p>
                    <p className="text-sm text-blue-200/90 leading-relaxed italic">
                      &ldquo;{claimAssertion}&rdquo;
                    </p>
                  </div>

                  {/* ── Evidence Type Picker ──────────────────────── */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setKindPickerOpen(!kindPickerOpen)}
                      className="flex items-center justify-between w-full text-left mb-3"
                    >
                      <label className="text-xs font-medium text-slate-300">
                        Evidence type{" "}
                        <span className="text-slate-500">(required)</span>
                      </label>
                      <ChevronDown
                        className={clsx(
                          "w-4 h-4 text-slate-500 transition-transform",
                          kindPickerOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {kindPickerOpen && (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {evidenceKindsByCategory().map(
                          ({ category, kinds }) => (
                            <div key={category}>
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1.5 mt-3 first:mt-0">
                                {category}
                              </div>
                              <div className="space-y-1.5">
                                {kinds.map((d) => (
                                  <EvidenceKindCard
                                    key={d.kind}
                                    kind={d.kind}
                                    category={d.category}
                                    transport={d.transport}
                                    hint={d.hint}
                                    isSelected={kind === d.kind}
                                    onSelect={() => {
                                      setKind(d.kind);
                                      setError(null);
                                      setKindPickerOpen(false);
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Selected kind summary when collapsed */}
                    {!kindPickerOpen && kindDef && (
                      <button
                        type="button"
                        onClick={() => setKindPickerOpen(true)}
                        className="w-full text-left rounded-xl bg-blue-500/[0.06] border border-blue-500/[0.15] px-4 py-3 flex items-center gap-3 hover:bg-blue-500/[0.10] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                          {transport === "link" ? (
                            <Link2 className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-blue-300">
                            {kind}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            {kindDef.hint}
                          </span>
                        </div>
                        <span className="text-xs text-blue-400/60">
                          Change
                        </span>
                      </button>
                    )}
                  </div>

                  {/* ── Entry Form ───────────────────────────────── */}
                  {kind && (
                    <div className="space-y-4">
                      {/* Divider */}
                      <div className="border-t border-white/[0.06]" />

                      <h4 className="text-xs font-medium text-slate-300">
                        Evidence details
                      </h4>

                      {/* Link input */}
                      {isLinkKind(kind) && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">
                            URL <span className="text-slate-500">(required)</span>
                          </label>
                          <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="url"
                              value={link}
                              onChange={(e) => {
                                setLink(e.target.value);
                                setError(null);
                              }}
                              placeholder="https://github.com/yourname/repo"
                              className="w-full bg-slate-900/50 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* File upload */}
                      {kind && !isLinkKind(kind) && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">
                            File <span className="text-slate-500">(required)</span>
                          </label>
                          {file ? (
                            <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 border border-white/[0.08] px-4 py-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFile(null);
                                  setError(null);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                aria-label="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                              }}
                              onDragLeave={() => setDragOver(false)}
                              onDrop={handleDrop}
                              className={clsx(
                                "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-all",
                                dragOver
                                  ? "border-blue-500/50 bg-blue-500/[0.06]"
                                  : "border-white/[0.10] hover:border-blue-500/30 hover:bg-white/[0.02]"
                              )}
                            >
                              <Upload
                                className={clsx(
                                  "w-8 h-8 mb-2 transition-colors",
                                  dragOver
                                    ? "text-blue-400"
                                    : "text-slate-500"
                                )}
                              />
                              <span className="text-sm text-slate-300 font-medium">
                                {dragOver
                                  ? "Drop file here"
                                  : "Drop evidence here or click to browse"}
                              </span>
                              <span className="text-xs text-slate-500 mt-1">
                                PDF, DOCX, PNG, JPG up to{" "}
                                {(
                                  MAX_EVIDENCE_FILE_BYTES /
                                  (1024 * 1024)
                                ).toFixed(0)}{" "}
                                MB
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  setFile(e.target.files?.[0] ?? null);
                                  setError(null);
                                }}
                                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
                              />
                            </label>
                          )}
                          {fileTooLarge && (
                            <p className="mt-2 text-xs text-rose-400">
                              File is too large. Max{" "}
                              {(
                                MAX_EVIDENCE_FILE_BYTES /
                                (1024 * 1024)
                              ).toFixed(0)}{" "}
                              MB.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">
                          Notes{" "}
                          <span className="text-slate-500">(optional)</span>
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          placeholder="e.g. Official offer letter from Acme Corp confirming my role as Senior Engineer"
                          className="w-full bg-slate-900/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none transition-all"
                        />
                      </div>

                      {/* Consent */}
                      <label className="flex items-start gap-3 cursor-pointer select-none rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => {
                            setConsent(e.target.checked);
                            setError(null);
                          }}
                          className="mt-0.5 rounded border-white/[0.15] bg-slate-900"
                        />
                        <span className="text-xs text-slate-400 leading-relaxed">
                          I confirm this evidence is authentic and I consent to
                          Patorbit storing it to support this claim.{" "}
                          <span className="text-slate-500">(Required)</span>
                        </span>
                      </label>

                      {/* Trust disclaimer */}
                      <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
                        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Evidence you add helps document your claim. Patorbit
                          does not independently verify this evidence unless a
                          separate verification process explicitly confirms it.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Error State ──────────────────────────────── */}
                  {error && (
                    <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-300">
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer ───────────────────────────────────────────── */}
            {!saved && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] bg-[#0C1322]">
                <p className="text-[10px] text-slate-500 hidden sm:block">
                  Evidence is saved to your Patorbit profile.
                </p>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitDisabled || !!error}
                    className={clsx(
                      "inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all",
                      submitDisabled || error
                        ? "bg-white/[0.06] text-slate-500 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Save Evidence
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
