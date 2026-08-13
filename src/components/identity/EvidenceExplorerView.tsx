"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { FileSearch, ShieldCheck } from "lucide-react";
import { EvidencePanel } from "./EvidencePanel";
import { useState } from "react";
import { AddEvidenceModal } from "./AddEvidenceModal";

export function EvidenceExplorerView() {
  const resume = useResumeBuilder((s) => s.resume);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);
  const claims = resume?.claims ?? [];
  const [selectedClaimId, setSelectedClaimId] = useState<string>(claims[0]?.id ?? "");
  const [addModalOpen, setAddModalOpen] = useState(false);

  if (!resume || (evidence.length === 0 && claims.length === 0)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Evidence Explorer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore attached evidence records, documents, and artifacts backing your professional claims.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <FileSearch className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No evidence items attached yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Attach evidence artifacts, links, or documents to your profile claims to support your professional trust score.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Evidence Explorer</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore attached evidence records, documents, and artifacts backing your professional claims. ({evidence.length} total evidence items)
        </p>
      </div>

      {claims.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {claims.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClaimId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedClaimId === c.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white"
                }`}
              >
                {c.assertionText.slice(0, 40)}...
              </button>
            ))}
          </div>

          {selectedClaimId && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <EvidencePanel
                claimId={selectedClaimId}
                onAddEvidence={() => setAddModalOpen(true)}
              />
            </div>
          )}

          {selectedClaimId && (
            <AddEvidenceModal
              claimId={selectedClaimId}
              claimAssertion={claims.find((c) => c.id === selectedClaimId)?.assertionText ?? ""}
              open={addModalOpen}
              onClose={() => setAddModalOpen(false)}
            />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-3">
          <ShieldCheck className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No claims defined</h3>
          <p className="text-xs text-slate-400">Add claims in your resume to associate evidence records.</p>
        </div>
      )}
    </div>
  );
}
