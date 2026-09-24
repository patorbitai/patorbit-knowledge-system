"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { FieldInput } from "../fields/FieldInput";
import { InternationalPhoneInput } from "../fields/InternationalPhoneInput";
import { AIActionButton } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { ai } from "@/lib/ai/client";
import { useValidation } from "../hooks/useValidation";
import { Mail, Phone, MapPin, Link2, Globe, Pencil, Check, Sparkles } from "lucide-react";
import { ResumeFont } from "../cards/ResumeFont";

const LINK_FIELDS: Array<{ key: "linkedin" | "github" | "website"; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { key: "linkedin", label: "LinkedIn", Icon: Link2 },
  { key: "github", label: "GitHub", Icon: Link2 },
  { key: "website", label: "Portfolio", Icon: Globe },
];

export function PersonalSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const updateField = useResumeBuilder((s) => s.updateField);
  const updateSocial = useResumeBuilder((s) => s.updateSocial);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);
  const { touch, getFieldError } = useValidation();

  const [editing, setEditing] = useState(false);
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [toneSuggestion, setToneSuggestion] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setAIAction("summary-generate", { status: "loading", result: null, error: null });
    try {
      const result = await ai.generateSummary(resume);
      setSummarySuggestion(result.content);
      setAIAction("summary-generate", { status: "success", result: result.content, error: null });
    } catch (err: unknown) {
      setAIAction("summary-generate", { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
    }
  };

  const handleRewrite = async () => {
    if (!resume.summary) return;
    setAIAction("summary-rewrite", { status: "loading", result: null, error: null });
    try {
      const result = await ai.rewrite(resume.summary);
      setSummarySuggestion(result.content);
      setAIAction("summary-rewrite", { status: "success", result: result.content, error: null });
    } catch (err: unknown) {
      setAIAction("summary-rewrite", { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
    }
  };

  const handleImproveTone = async () => {
    if (!resume.summary) return;
    setAIAction("summary-tone", { status: "loading", result: null, error: null });
    try {
      const result = await ai.improveTone(resume.summary);
      setToneSuggestion(result.content);
      setAIAction("summary-tone", { status: "success", result: result.content, error: null });
    } catch (err: unknown) {
      setAIAction("summary-tone", { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
    }
  };

  const handleAcceptSummary = () => {
    if (summarySuggestion) {
      updateField("summary", summarySuggestion);
      setSummarySuggestion(null);
    }
  };

  /** Enter edit view and generate an AI improvement — contextual, not a
   *  permanent control (redesign §8). */
  const handleImproveSummary = () => {
    setEditing(true);
    if (resume.summary) void handleRewrite();
    else void handleGenerateSummary();
  };

  const hasIdentity = !!(resume.name && resume.email && resume.phone);

  return (
    <SectionCard
      id="personal"
      title="Profile"
      description="Your identity, contact details, and professional summary"
      icon="👤"
      isValid={hasIdentity}
      actions={
        <button
          onClick={() => setEditing((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
            editing
              ? "text-cyan-700 dark:text-cyan-400 bg-cyan-500/10"
              : "text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          {editing ? "Done" : "Edit Profile"}
        </button>
      }
    >
      {/* ── CONTENT VIEW — editorial hierarchy, no dashboard bulk ── */}
      {!editing && (
        <div className="space-y-4">
          {/* Name + title */}
          <div>
            <ResumeFont>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                {resume.name || "Your Name"}
              </h4>
            </ResumeFont>
            {resume.title && (
              <ResumeFont>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{resume.title}</p>
              </ResumeFont>
            )}
          </div>

          {/* Contact — one quiet inline group */}
          {(resume.email || resume.phone || resume.address) && (
            <ResumeFont>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-500 dark:text-slate-400">
                {resume.email && (
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{resume.email}</span>
                  </span>
                )}
                {resume.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                    {resume.phone}
                  </span>
                )}
                {resume.address && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                    {resume.address}
                  </span>
                )}
              </div>
            </ResumeFont>
          )}

          {/* Links — quiet text links, not chips */}
          {LINK_FIELDS.some(({ key }) => resume.social[key]) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {LINK_FIELDS.filter(({ key }) => resume.social[key]).map(({ key, label }) => (
                <a
                  key={key}
                  href={resume.social[key].startsWith("http") ? resume.social[key] : `https://${resume.social[key]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors underline-offset-2 hover:underline"
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          {/* Summary — flat, with contextual AI beneath (§8) */}
          {resume.summary ? (
            <div>
              <h5 className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mb-1.5">Professional summary</h5>
              <ResumeFont>
                <p className="text-[13px] leading-relaxed text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{resume.summary}</p>
              </ResumeFont>
              <button
                onClick={handleImproveSummary}
                disabled={aiActions["summary-rewrite"]?.status === "loading" || aiActions["summary-generate"]?.status === "loading"}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-slate-500 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {aiActions["summary-rewrite"]?.status === "loading" || aiActions["summary-generate"]?.status === "loading"
                  ? "Improving…"
                  : "Improve summary"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 dark:border-white/[0.12] px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500 hover:border-cyan-400/50 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Add a professional summary
            </button>
          )}
        </div>
      )}

      {/* ── EDIT VIEW ── */}
      {editing && (
        <SectionContent>
          {/* Identity */}
          <div>
            <h5 className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mb-3">Identity</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldInput
                label="Full Name"
                placeholder="Alex Johnson"
                value={resume.name}
                onChange={(v) => updateField("name", v)}
                onBlur={() => touch("personal.name")}
                error={getFieldError("personal", "name")}
                type="text"
              />
              <FieldInput
                label="Professional Title"
                placeholder="Senior Software Engineer"
                value={resume.title}
                onChange={(v) => updateField("title", v)}
                type="text"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mb-3">Contact</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldInput
                label="Email"
                placeholder="alex@example.com"
                value={resume.email}
                onChange={(v) => updateField("email", v)}
                onBlur={() => touch("personal.email")}
                error={getFieldError("personal", "email")}
                type="email"
              />
              <InternationalPhoneInput
                label="Phone"
                value={resume.phone}
                onChange={(v) => updateField("phone", v)}
                onBlur={() => touch("personal.phone")}
                error={getFieldError("personal", "phone")}
              />
              <FieldInput
                label="Location"
                placeholder="San Francisco, CA"
                value={resume.address}
                onChange={(v) => updateField("address", v)}
                type="text"
              />
            </div>
          </div>

          {/* Online Presence */}
          <div>
            <h5 className="text-[11px] font-medium text-gray-400 dark:text-slate-500 mb-3">Online</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldInput
                label="LinkedIn"
                placeholder="linkedin.com/in/yourprofile"
                value={resume.social.linkedin}
                onChange={(v) => updateSocial("linkedin", v)}
                type="url"
              />
              <FieldInput
                label="GitHub"
                placeholder="github.com/yourhandle"
                value={resume.social.github}
                onChange={(v) => updateSocial("github", v)}
                type="url"
              />
              <FieldInput
                label="Portfolio"
                placeholder="yourwebsite.com"
                value={resume.social.website}
                onChange={(v) => updateSocial("website", v)}
                type="url"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-[11px] font-medium text-gray-400 dark:text-slate-500">Summary</h5>
              <div className="flex items-center gap-1.5">
                <AIActionButton
                  label="Generate Summary"
                  onClick={handleGenerateSummary}
                  isLoading={aiActions["summary-generate"]?.status === "loading"}
                  variant="ghost"
                />
                {resume.summary && (
                  <AIActionButton
                    label="Rewrite"
                    onClick={handleRewrite}
                    isLoading={aiActions["summary-rewrite"]?.status === "loading"}
                    variant="ghost"
                  />
                )}
                {resume.summary && (
                  <AIActionButton
                    label="Improve Tone"
                    onClick={handleImproveTone}
                    isLoading={aiActions["summary-tone"]?.status === "loading"}
                    variant="ghost"
                  />
                )}
              </div>
            </div>
            {(aiActions["summary-generate"]?.status === "error" || aiActions["summary-rewrite"]?.status === "error" || aiActions["summary-tone"]?.status === "error") && (
              <p className="text-[11px] text-red-400 mb-2">
                {aiActions["summary-generate"]?.error || aiActions["summary-rewrite"]?.error || aiActions["summary-tone"]?.error || "AI request failed. Please try again."}
              </p>
            )}
            <FieldInput
              label=""
              placeholder="Write 2-4 lines describing your experience, strengths, and the type of role you're targeting."
              value={resume.summary}
              onChange={(v) => updateField("summary", v)}
              type="textarea"
              rows={6}
              maxLength={5000}
            />
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5">
              A strong summary highlights your key strengths and career direction.
            </p>
          </div>

          {/* Summary AI Suggestions */}
          {summarySuggestion && (
            <SmartSuggestion
              original={resume.summary}
              suggestion={summarySuggestion}
              onAccept={handleAcceptSummary}
              onRegenerate={handleGenerateSummary}
              onDismiss={() => setSummarySuggestion(null)}
              type="rewrite"
            />
          )}
          {toneSuggestion && toneSuggestion !== summarySuggestion && (
            <SmartSuggestion
              original={resume.summary}
              suggestion={toneSuggestion}
              onAccept={() => { updateField("summary", toneSuggestion); setToneSuggestion(null); }}
              onRegenerate={() => {}}
              onDismiss={() => setToneSuggestion(null)}
              type="improvement"
            />
          )}
        </SectionContent>
      )}
    </SectionCard>
  );
}