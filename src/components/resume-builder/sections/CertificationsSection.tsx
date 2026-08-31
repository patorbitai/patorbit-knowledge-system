"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton } from "../AIActionButton";
import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

export function CertificationsSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addCertification = useResumeBuilder((s) => s.addCertification);
  const updateCertification = useResumeBuilder((s) => s.updateCertification);
  const removeCertification = useResumeBuilder((s) => s.removeCertification);
  const moveCertification = useResumeBuilder((s) => s.moveCertification);
  const { touch, getFieldError } = useValidation();

  // Map a certification entry to its claim (via sourceActivityId "certifications-<n>") so
  // the VerificationBadge reflects the claim's real evidence state.
  const claimForCertification = (id: string, index: number) =>
    resume.claims.find(
      (c) => c.sourceActivityId === id || c.sourceActivityId === `certifications-${index}`,
    );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCertification = () => {
    addCertification();
    const newId = useResumeBuilder.getState().resume.certifications.at(-1)?.id;
    if (newId) setExpandedIds((prev) => new Set([...prev, newId]));
  };

  return (
    <SectionCard
      id="certifications"
      title="Certifications"
      description="Professional certifications and credentials"
      icon="🏅"
      isValid={resume.certifications.length > 0 && resume.certifications.some((c) => c.name)}
      actions={
        <AIActionButton
          label="Add Certification"
          onClick={handleAddCertification}
          variant="outline"
          icon={<Plus className="w-3 h-3" />}
        />
      }
    >
      <AnimatePresence>
        {resume.certifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-14 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]"
          >
            <AwardIcon />
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 mt-4">No certifications yet</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">Add relevant certifications to boost credibility</p>
            <AIActionButton label="Add Certification" onClick={handleAddCertification} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {resume.certifications.map((cert, idx) => {
              const isExpanded = expandedIds.has(cert.id);
              return (
                <motion.div
                  key={cert.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpand(cert.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-slate-600 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{cert.name || "New Certification"}</span>
                        {cert.issuer && <><span className="text-gray-400 dark:text-slate-600">·</span><span className="text-xs text-gray-500 dark:text-slate-500 truncate">{cert.issuer}</span></>}
                      </div>
                      {cert.date && <span className="text-[11px] text-gray-400 dark:text-slate-500">{cert.date}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const claim = claimForCertification(cert.id, idx);
                        return claim ? (
                          <VerificationBadge claim={claim} size="sm" />
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-slate-600 italic">No claim yet</span>
                        );
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveCertification(cert.id, -1); }} disabled={idx === 0} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveCertification(cert.id, 1); }} disabled={idx === resume.certifications.length - 1} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeCertification(cert.id); }} className="p-1.5 text-red-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/[0.06]"
                      >
                        <div className="px-4 py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldInput label="Certification Name" placeholder="AWS Solutions Architect" value={cert.name} onChange={(v) => updateCertification(cert.id, "name", v)} onBlur={() => touch(`certifications.${idx}.name`)} error={getFieldError("certifications", "name", idx)} />
                            <FieldInput label="Issuer" placeholder="Amazon Web Services" value={cert.issuer} onChange={(v) => updateCertification(cert.id, "issuer", v)} />
                            <FieldInput label="Date" placeholder="Jan 2024" value={cert.date} onChange={(v) => updateCertification(cert.id, "date", v)} />
                            <FieldInput label="Expiry Date" placeholder="Jan 2027" value={cert.expiryDate} onChange={(v) => updateCertification(cert.id, "expiryDate", v)} />
                            <FieldInput label="Credential Link" placeholder="https://..." value={cert.link} onChange={(v) => updateCertification(cert.id, "link", v)} type="url" />
                          </div>
                          <FieldInput label="Description" placeholder="Cert details..." value={cert.description} onChange={(v) => updateCertification(cert.id, "description", v)} type="textarea" rows={4} />
                          <FieldInput label="Relevant Skills" placeholder="DevOps, Cloud Architecture" value={cert.skills} onChange={(v) => updateCertification(cert.id, "skills", v)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </SectionCard>
  );
}

function AwardIcon() {
  return (
    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
