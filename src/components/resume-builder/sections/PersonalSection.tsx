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

export function PersonalSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const updateField = useResumeBuilder((s) => s.updateField);
  const updateSocial = useResumeBuilder((s) => s.updateSocial);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);
  const { touch, getFieldError } = useValidation();

  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [toneSuggestion, setToneSuggestion] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setAIAction("summary-generate", { status: "loading", result: null, error: null });
    try {
      const result = await ai.generateSummary(resume);
      setSummarySuggestion(result.content);
      setAIAction("summary-generate", { status: "success", result: result.content, error: null });
    } catch (err: any) {
      setAIAction("summary-generate", { status: "error", result: null, error: err.message });
    }
  };

  const handleRewrite = async () => {
    if (!resume.summary) return;
    setAIAction("summary-rewrite", { status: "loading", result: null, error: null });
    try {
      const result = await ai.rewrite(resume.summary);
      setSummarySuggestion(result.content);
      setAIAction("summary-rewrite", { status: "success", result: result.content, error: null });
    } catch (err: any) {
      setAIAction("summary-rewrite", { status: "error", result: null, error: err.message });
    }
  };

  const handleImproveTone = async () => {
    if (!resume.summary) return;
    setAIAction("summary-tone", { status: "loading", result: null, error: null });
    try {
      const result = await ai.improveTone(resume.summary);
      setToneSuggestion(result.content);
      setAIAction("summary-tone", { status: "success", result: result.content, error: null });
    } catch (err: any) {
      setAIAction("summary-tone", { status: "error", result: null, error: err.message });
    }
  };

  const handleAcceptSummary = () => {
    if (summarySuggestion) {
      updateField("summary", summarySuggestion);
      setSummarySuggestion(null);
    }
  };

  return (
    <SectionCard
      id="personal"
      title="Personal Information"
      description="Your basic contact details and professional summary"
      icon="👤"
      isValid={!!(resume.name && resume.email && resume.phone)}
    >
      <SectionContent>
        {/* ── Identity ── */}
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

        {/* ── Contact ── */}
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

        {/* ── Online Presence ── */}
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

        {/* ── Summary ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Summary</h4>
            <div className="flex items-center gap-1.5">
              <AIActionButton
                label="Generate"
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
    </SectionCard>
  );
}
