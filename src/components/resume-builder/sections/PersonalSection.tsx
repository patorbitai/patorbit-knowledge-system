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
import { Mail, Phone, MapPin, Link2, Globe, Pencil, Check, User, Sparkles } from "lucide-react";

/** Initials from a name ("Arvind Abhay Narayan Chauhan" → "AC"). */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LINK_FIELDS: Array<{ key: "linkedin" | "github" | "website"; label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { key: "linkedin", label: "LinkedIn", Icon: Link2, color: "text-sky-500" },
  { key: "github", label: "GitHub", Icon: Link2, color: "text-gray-500 dark:text-slate-400" },
  { key: "website", label: "Portfolio", Icon: Globe, color: "text-emerald-500" },
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
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
            editing
              ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
              : "text-gray-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
          }`}
        >
          {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          {editing ? "Done" : "Edit Profile"}
        </button>
      }
    >
      {/* ── CONTENT VIEW ── */}
      {!editing && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-purple-500/20 border border-cyan-500/20 flex items-center justify-center">
              <span className="text-lg font-bold text-cyan-600 dark:text-cyan-300">{initialsOf(resume.name || "?")}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate">
                {resume.name || "Your Name"}
              </h3>
              {resume.title && (
                <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{resume.title}</p>
              )}
            </div>
          </div>

          {/* Contact rows */}
          {(resume.email || resume.phone || resume.address) && (
            <div className="space-y-1.5">
              {resume.email && (
                <div className="flex items-center gap-2.5 text-[13px] text-gray-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{resume.email}</span>
                </div>
              )}
              {resume.phone && (
                <div className="flex items-center gap-2.5 text-[13px] text-gray-600 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{resume.phone}</span>
                </div>
              )}
              {resume.address && (
                <div className="flex items-center gap-2.5 text-[13px] text-gray-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{resume.address}</span>
                </div>
              )}
            </div>
          )}

          {/* Link chips */}
          <div className="flex flex-wrap gap-2">
            {LINK_FIELDS.filter(({ key }) => resume.social[key]).map(({ key, label, Icon, color }) => (
              <a
                key={key}
                href={resume.social[key].startsWith("http") ? resume.social[key] : `https://${resume.social[key]}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-[11px] font-medium text-gray-600 dark:text-slate-300 hover:border-cyan-400/40 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                <Icon className={`w-3 h-3 ${color}`} />
                {label}
              </a>
            ))}
          </div>

          {/* Summary */}
          {resume.summary ? (
            <div>
              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Summary</h4>
              <p className="text-[13px] leading-relaxed text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{resume.summary}</p>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 dark:border-white/[0.12] px-3 py-2.5 text-xs text-gray-400 dark:text-slate-500 hover:border-cyan-400/50 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
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
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Identity</h4>
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
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Contact</h4>
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
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Online</h4>
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
              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Summary</h4>
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

      {!editing && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500 pt-1">
          <User className="w-3 h-3" />
          Edit opens structured fields — changes are saved automatically.
        </div>
      )}
    </SectionCard>
  );
}