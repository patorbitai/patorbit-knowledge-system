"use client";

import { useEffect, useState, useMemo } from "react";
import { clsx } from "clsx";
import {
  FileText,
  Link2,
  Plus,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { getEvidenceKind } from "@/types/evidence-kinds";
import type { Evidence } from "@/types/resume";
import { retrieveEvidenceBlob, removeEvidenceBlob } from "@/lib/evidence/storage";

/**
 * EvidencePanel — renders the evidence attached to a single claim.
 *
 * Empty / loading / error / success states are handled here:
 *   - Empty   : centered "No evidence yet" card with an Add Evidence button.
 *   - Loading : a file preview is being hydrated from IndexedDB.
 *   - Error   : a blob is missing (IndexedDB cleared) → graceful degraded card.
 *   - Success : an evidence card with kind, format, notes, consent, visibility.
 */

interface EvidencePanelProps {
  claimId: string;
  onAddEvidence: () => void;
}

/** A small hook to hydrate a Blob from server storage or IndexedDB for file-based evidence. */
function useFilePreview(evidence: Evidence) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    (async () => {
      try {
        // Try server fetch first
        const res = await fetch(`/api/evidence/${evidence.id}`);
        if (res.ok) {
          const blob = await res.blob();
          if (cancelled) return;
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setMissing(false);
          setLoading(false);
          return;
        }

        // Fallback to IndexedDB
        const blob = await retrieveEvidenceBlob(evidence.content);
        if (cancelled) return;
        if (blob) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setMissing(false);
        } else {
          setMissing(true);
        }
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [evidence.id, evidence.content]);

  return { blobUrl, loading, missing };
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const removeEvidence = useResumeBuilder((s) => s.removeEvidence);
  const setEvidenceVisibility = useResumeBuilder((s) => s.setEvidenceVisibility);
  const kind = getEvidenceKind(evidence.evidenceKind);
  const { blobUrl, loading, missing } = useFilePreview(evidence);
  const isLink = evidence.evidenceType === "link";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
        {isLink ? <Link2 className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white">{evidence.evidenceKind}</span>
          <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
            {evidence.evidenceType}
          </span>
          {evidence.status === "verified" && (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>

        {/* File preview or link out */}
        {isLink ? (
          <a
            href={evidence.content.startsWith("http") ? evidence.content : `https://${evidence.content}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-[11px] text-blue-400 hover:underline"
          >
            {evidence.metadata.linkTitle || evidence.content}
          </a>
        ) : loading ? (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading file…
          </div>
        ) : missing ? (
          <div className="mt-1 text-[11px] text-amber-400/80">
            File unavailable on this device (stored locally).
          </div>
        ) : (
          <a
            href={blobUrl ?? undefined}
            download={evidence.metadata.fileName}
            className="mt-0.5 block truncate text-[11px] text-blue-400 hover:underline"
          >
            {evidence.metadata.fileName || "Download file"} · {(evidence.metadata.fileSize ?? 0 / 1e6).toFixed(1)} MB
          </a>
        )}

        {evidence.notes && (
          <p className="mt-1 text-[11px] text-slate-400">{evidence.notes}</p>
        )}

        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
          <span>Uploaded {new Date(evidence.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span>{evidence.consent ? "Consent ✓" : "Consent required"}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setEvidenceVisibility(evidence.id, evidence.visibility === "public" ? "private" : "public")}
          title={evidence.visibility === "public" ? "Visible on shared Passport" : "Private (not shared)"}
          className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {evidence.visibility === "public" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={async () => {
            if (evidence.evidenceType !== "link") {
              await fetch(`/api/evidence/${evidence.id}`, { method: "DELETE" }).catch(() => {});
              await removeEvidenceBlob(evidence.content).catch(() => {});
            }
            removeEvidence(evidence.id);
          }}
          title="Remove evidence"
          className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function EvidencePanel({ claimId, onAddEvidence }: EvidencePanelProps) {
  const allEvidence = useResumeBuilder((s) => s.evidence);
  const evidence = useMemo(() => allEvidence.filter((e) => e.claimId === claimId), [allEvidence, claimId]);
  const evidenceCount = evidence.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Evidence ({evidenceCount})
        </span>
        <button
          onClick={onAddEvidence}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Evidence
        </button>
      </div>

      {evidenceCount === 0 ? (
        <button
          onClick={onAddEvidence}
          className={clsx(
            "w-full flex flex-col items-center justify-center rounded-xl border border-dashed py-6 text-center transition-colors",
            "border-white/[0.10] hover:border-blue-500/40 hover:bg-blue-500/[0.03]",
          )}
        >
          <ShieldCheck className="w-6 h-6 text-slate-600 mb-2" />
          <span className="text-xs text-slate-400">No evidence yet</span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Add the first document to start building trust on this claim
          </span>
        </button>
      ) : (
        <>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This claim is supported. Add more documents to make it harder to dispute.
          </p>
          <div className="space-y-2">
            {evidence.map((e) => <EvidenceCard key={e.id} evidence={e} />)}
          </div>
        </>
      )}
    </div>
  );
}
