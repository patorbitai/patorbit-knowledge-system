"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { FieldInput } from "../fields/FieldInput";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { generateSummary } from "@/lib/ai/resume-ai";

export function PersonalSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const updateField = useResumeBuilder((s) => s.updateField);
  const updateSocial = useResumeBuilder((s) => s.updateSocial);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);

  const [collapsed, setCollapsed] = useState(false);
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [toneSuggestion, setToneSuggestion] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setAIAction("summary-generate", { status: "loading", result: null, error: null });
    try {
      const result = await generateSummary(resume);
      setSummarySuggestion(result.summary);
      setAIAction("summary-generate", { status: "success", result: result.summary, error: null });
    } catch (err: any) {
      setAIAction("summary-generate", { status: "error", result: null, error: err.message });
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
      actions={
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-all"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      }
    >
      <SectionContent isCollapsed={collapsed}>
        {/* Name & Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
            <FieldInput
              label="Full Name"
              placeholder="Alex Johnson"
              value={resume.name}
              onChange={(v) => updateField("name", v)}
              type="text"
            />
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
            <FieldInput
              label="Professional Title"
              placeholder="Senior Software Engineer"
              value={resume.title}
              onChange={(v) => updateField("title", v)}
              type="text"
            />
          </motion.div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldInput
            label="Email"
            placeholder="alex@example.com"
            value={resume.email}
            onChange={(v) => updateField("email", v)}
            type="email"
          />
          <FieldInput
            label="Phone"
            placeholder="+1 (555) 123-4567"
            value={resume.phone}
            onChange={(v) => updateField("phone", v)}
            type="tel"
          />
          <FieldInput
            label="Location"
            placeholder="San Francisco, CA"
            value={resume.address}
            onChange={(v) => updateField("address", v)}
            type="text"
          />
        </div>

        {/* Professional Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-slate-400">Professional Summary</label>
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
                  onClick={() => handleGenerateSummary()}
                  isLoading={false}
                  variant="ghost"
                />
              )}
              {resume.summary && (
                <AIActionButton
                  label="Improve Tone"
                  onClick={async () => {
                    setAIAction("summary-tone", { status: "loading", result: null, error: null });
                    // Mock: enhance tone
                    const enhanced = resume.summary
                      .replace(/I think /gi, "")
                      .replace(/ sort of /gi, " ")
                      .replace(/ basically /gi, " ")
                      .replace(/\. /g, ". "); // placeholder for real AI
                    await new Promise((r) => setTimeout(r, 300));
                    setToneSuggestion(enhanced);
                    setAIAction("summary-tone", { status: "success", result: enhanced, error: null });
                  }}
                  isLoading={aiActions["summary-tone"]?.status === "loading"}
                  variant="ghost"
                />
              )}
            </div>
          </div>
          <FieldInput
            label=""
            placeholder="Write a brief summary of your background and career goals..."
            value={resume.summary}
            onChange={(v) => updateField("summary", v)}
            type="textarea"
            rows={4}
            maxLength={500}
          />
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

        {/* Social Links */}
        <div className="space-y-2">
          <label className="text-[11px] font-medium text-slate-400">Online Presence</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label="Website / Portfolio"
              placeholder="yourwebsite.com"
              value={resume.social.website}
              onChange={(v) => updateSocial("website", v)}
              type="url"
            />
          </div>
        </div>
      </SectionContent>
    </SectionCard>
  );
}
