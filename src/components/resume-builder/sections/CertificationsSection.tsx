"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton } from "../AIActionButton";
import { EmptyState } from "../cards/EmptyState";
import { Award, ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

export function CertificationsSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addCertification = useResumeBuilder((s) => s.addCertification);
  const updateCertification = useResumeBuilder((s) => s.updateCertification);
  const removeCertification = useResumeBuilder((s) => s.removeCertification);
  const moveCertification = useResumeBuilder((s) => s.moveCertification);
  const { touch, getFieldError } = useValidation();

  const claimForCertification = (id: string, index: number) =>
    resume.claims.find(
      (c) => c.sourceActivityId === id || c.sourceActivityId === `certifications-${index}`,
    );

  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const toggleEdit = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCertification = () => {
    addCertification();
    const newId = useResumeBuilder.getState().resume.certifications.at(-1)?.id;
    if (newId) setEditingIds((prev) => new Set([...prev, newId]));
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
          <EmptyState
            icon={<Award className="w-5 h-5" />}
            message="Boost your credibility"
            submessage="Add professional certifications and credentials as compact cards."
            action={handleAddCertification}
            actionLabel="Add Certification"
          />
        ) : (
          <div className="space-y-3">
            {resume.certifications.map((cert, idx) => {
              const isEditing = editingIds.has(cert.id);
              return (
                <motion.div
                  key={cert.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className={`rounded-xl border transition-colors ${
                    isEditing
                      ? "border-cyan-500/25 bg-white dark:bg-[#0C1222]"
                      : "border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0A0E1B] hover:border-gray-300 dark:hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cert.name || "New Certification"}</span>
                        {cert.issuer && <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{cert.issuer}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cert.date && <span className="text-[11px] text-gray-400 dark:text-slate-500">Issued {cert.date}</span>}
                        {cert.expiryDate && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">· Expires {cert.expiryDate}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {cert.link && (
                        <a href={cert.link.startsWith("http") ? cert.link : `https://${cert.link}`} target="_blank" rel="noreferrer" className="p-1 text-gray-400 dark:text-slate-500 hover:text-cyan-500 rounded-md" title="Credential link"><ExternalLink className="w-3 h-3" /></a>
                      )}
                      {(() => {
                        const claim = claimForCertification(cert.id, idx);
                        return claim ? <VerificationBadge claim={claim} size="sm" /> : null;
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveCertification(cert.id, -1)} disabled={idx === 0} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveCertification(cert.id, 1)} disabled={idx === resume.certifications.length - 1} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button
                        onClick={() => toggleEdit(cert.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          isEditing
                            ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                            : "text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                        }`}
                      >
                        {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                        {isEditing ? "Done" : "Edit"}
                      </button>
                      <button onClick={() => removeCertification(cert.id)} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 dark:border-white/[0.06] overflow-hidden"
                      >
                        <div className="px-4 py-4 space-y-5">
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Certification Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FieldInput label="Certification Name" placeholder="AWS Solutions Architect" value={cert.name} onChange={(v) => updateCertification(cert.id, "name", v)} onBlur={() => touch(`certifications.${idx}.name`)} error={getFieldError("certifications", "name", idx)} />
                              <FieldInput label="Issuer" placeholder="Amazon Web Services" value={cert.issuer} onChange={(v) => updateCertification(cert.id, "issuer", v)} />
                              <FieldInput label="Date" placeholder="Jan 2024" value={cert.date} onChange={(v) => updateCertification(cert.id, "date", v)} />
                              <FieldInput label="Expiry Date" placeholder="Jan 2027" value={cert.expiryDate} onChange={(v) => updateCertification(cert.id, "expiryDate", v)} />
                              <FieldInput label="Credential Link" placeholder="https://..." value={cert.link} onChange={(v) => updateCertification(cert.id, "link", v)} type="url" />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Additional Info</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FieldInput label="Description" placeholder="Cert details..." value={cert.description} onChange={(v) => updateCertification(cert.id, "description", v)} type="textarea" rows={3} />
                              <FieldInput label="Relevant Skills" placeholder="DevOps, Cloud Architecture" value={cert.skills} onChange={(v) => updateCertification(cert.id, "skills", v)} />
                            </div>
                          </div>
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