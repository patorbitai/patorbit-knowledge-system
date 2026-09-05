"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  FileText,
  Clock,
  MoreHorizontal,
  Trash2,
  Pencil,
  Copy,
  Share2,
  ArrowRight,
  Sparkles,
  Target,
  Briefcase,
  Shield,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useResumeBuilder, isResumeEffectivelyEmpty } from "@/store/resume-builder";
import AICopilotWidget from "@/components/hub/widgets/AICopilotWidget";
import TrustWidget from "@/components/hub/widgets/TrustWidget";
import KnowledgeGraphWidget from "@/components/hub/widgets/KnowledgeGraphWidget";
import PassportWidget from "@/components/hub/widgets/PassportWidget";
import CareerInsightsWidget from "@/components/hub/widgets/CareerInsightsWidget";
import { JobApplicationsSection } from "@/components/hub/applications/JobApplicationsSection";
import type { IdentityScoreData } from "@/lib/identity-score";
import { MiniaturePreview } from "@/components/resume-builder/MiniaturePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { ShareResumeModal } from "@/components/resume-builder/ShareResumeModal";
import { OnboardingModal } from "@/components/hub/OnboardingModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { FeatureGate } from "@/components/ProBadge";

type Props = {
  name: string;
  email: string;
  data: IdentityScoreData;
  onboardingCompleted?: boolean;
  subscriptionTier?: "Free" | "Professional" | "Enterprise";
};

/* ── Helpers ── */

function formatRelativeTime(date: string | number | Date | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTemplateName(templateId: string) {
  const t = TEMPLATES.find((t) => t.id === templateId);
  return t?.name || templateId;
}

/* ── Loading Skeleton ── */

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <section className="space-y-3">
        <div className="h-8 w-64 bg-gray-200 dark:bg-white/[0.06] rounded-lg" />
        <div className="h-4 w-80 bg-gray-200 dark:bg-white/[0.06] rounded-lg" />
      </section>
      {/* Resume cards skeleton */}
      <section className="space-y-4">
        <div className="h-5 w-32 bg-gray-200 dark:bg-white/[0.06] rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
              <div className="h-32 bg-gray-100 dark:bg-white/[0.03]" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-40 bg-gray-200 dark:bg-white/[0.06] rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-white/[0.06] rounded" />
                <div className="h-9 w-full bg-gray-200 dark:bg-white/[0.06] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Main Component ── */

export function OverviewCommandCenter({ name, email, data, onboardingCompleted = true, subscriptionTier = "Free" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shareModalResume, setShareModalResume] = useState<{ id: string; name: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(!onboardingCompleted);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    if (!openMenuId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [openMenuId]);

  const toggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  const firstName = name.split(" ")[0] || "there";

  const resumes = useResumeBuilder((s) => s.resumes);
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const createResume = useResumeBuilder((s) => s.createResume);
  const deleteResume = useResumeBuilder((s) => s.deleteResume);
  const duplicateResume = useResumeBuilder((s) => s.duplicateResume);
  const switchResume = useResumeBuilder((s) => s.switchResume);
  const renameResume = useResumeBuilder((s) => s.renameResume);

  const resumeList = mounted && resumes ? resumes : [];
  const hasResumes = resumeList.some((r) => !isResumeEffectivelyEmpty(r));

  const sortedResumes = [...resumeList]
    .filter((r) => !isResumeEffectivelyEmpty(r))
    .sort((a, b) => {
      const aTime = (a as any).updatedAt || (a as any).createdAt || 0;
      const bTime = (b as any).updatedAt || (b as any).createdAt || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  const handleCreateResume = () => {
    const id = createResume();
    switchResume(id);
    window.location.href = "/resume-builder";
  };

  const commitRename = useCallback(() => {
    if (renamingId) {
      const trimmed = renameValue.trim();
      if (trimmed && trimmed.length <= 100) {
        renameResume(renamingId, trimmed);
      }
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renamingId, renameValue, renameResume]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  /* ── Show skeleton while loading ── */
  if (!mounted) return <DashboardSkeleton />;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 space-y-10">
      {/* ── A. WELCOME HEADER ── */}
      <section className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-[#f8fafc]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#94a3b8] max-w-xl leading-relaxed">
          {!hasResumes
            ? "Start by creating or importing your first resume."
            : sortedResumes.length === 1
            ? `Your resume "${sortedResumes[0].resumeName || "Untitled"}" is ready. Continue improving it or create another.`
            : `You have ${sortedResumes.length} resumes. Pick one to continue where you left off.`}
        </p>
      </section>

      {/* ── B. EMPTY STATE — New user ── */}
      {!hasResumes && (
        <section className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-12 text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Create your first resume
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Build from scratch or import an existing resume. Patorbit will organize your information into a professional format.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCreateResume}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-sm font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                Create Resume
              </button>
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-sm font-medium text-gray-700 dark:text-[#cbd5e1] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
              >
                <Upload className="h-4 w-4" />
                Import Resume
              </Link>
            </div>
            {/* Capability hints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
              {[
                { icon: <Pencil className="w-3.5 h-3.5" />, label: "Edit & customize", desc: "32 templates" },
                { icon: <Target className="w-3.5 h-3.5" />, label: "Tailor to any job", desc: "AI-powered matching" },
                { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Improve with AI", desc: "Bullets, summary, skills" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
                  <span className="text-blue-500 dark:text-cyan-400">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300">{item.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── C. RESUMES SECTION ── */}
      {hasResumes && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your resumes
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {sortedResumes.length} resume{sortedResumes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateResume}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-xs font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                New Resume
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedResumes.map((r) => {
              const resumeId = r.resumeId ?? "";
              const isActive = resumeId === activeResumeId;
              const resumeName = r.resumeName || "Untitled Resume";
              const templateId = r.templateId || "modern-clean";
              const professionalTitle = (r as any).title || "";
              const experienceCount = r.experience?.length || 0;
              const educationCount = r.education?.length || 0;
              const skillsCount = r.skills?.length || 0;
              const updatedAt = (r as any).updatedAt || (r as any).createdAt;
              const timeAgo = formatRelativeTime(updatedAt);
              const isMenuOpen = openMenuId === resumeId;

              return (
                <div
                  key={resumeId}
                  className={`group relative rounded-2xl border transition-all overflow-hidden ${
                    isActive
                      ? "border-blue-300 dark:border-[#22d3ee]/40 bg-blue-50/50 dark:bg-[#22d3ee]/[0.03] shadow-sm"
                      : "border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20"
                  }`}
                >
                  {/* Preview thumbnail */}
                  <div className="border-b border-gray-100 dark:border-white/[0.04] bg-gray-50 dark:bg-white/[0.01]">
                    <div className="px-5 pt-4 pb-2">
                      <MiniaturePreview templateId={templateId} resume={r} />
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    {/* Name + actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {renamingId === resumeId ? (
                          <input
                            ref={renameInputRef}
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") commitRename();
                              if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                            }}
                            onBlur={commitRename}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Resume name"
                            maxLength={100}
                            className="w-full px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/[0.08] border border-cyan-500/40 text-sm font-semibold text-gray-900 dark:text-white outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 group/rename">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {resumeName}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRenamingId(resumeId);
                                setRenameValue(resumeName);
                              }}
                              className="p-0.5 rounded text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-white opacity-0 group-hover/rename:opacity-100 transition-opacity cursor-pointer"
                              aria-label={`Rename ${resumeName}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {professionalTitle && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                            {professionalTitle}
                          </p>
                        )}
                      </div>

                      {/* Context menu */}
                      <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          onClick={() => toggleMenu(resumeId)}
                          className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                          aria-label={`Actions for ${resumeName}`}
                          aria-expanded={isMenuOpen}
                          aria-haspopup="menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {isMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl"
                          >
                            <button
                              role="menuitem"
                              onClick={() => {
                                closeMenu();
                                switchResume(resumeId);
                                window.location.href = "/resume-builder";
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] rounded-t-xl"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => {
                                closeMenu();
                                const newId = duplicateResume(resumeId);
                                if (newId) switchResume(newId);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                            >
                              <Copy className="h-3 w-3" />
                              Duplicate
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => {
                                closeMenu();
                                setShareModalResume({ id: resumeId, name: resumeName });
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                            >
                              <Share2 className="h-3 w-3" />
                              Share
                            </button>
                            {resumeList.length > 1 && (
                              <button
                                role="menuitem"
                                onClick={() => {
                                  closeMenu();
                                  setDeleteTarget({ id: resumeId, name: resumeName });
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-b-xl"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {getTemplateName(templateId)}
                      </span>
                      {(experienceCount > 0 || educationCount > 0 || skillsCount > 0) && (
                        <span className="text-gray-300 dark:text-slate-600">·</span>
                      )}
                      {experienceCount > 0 && <span>{experienceCount} exp</span>}
                      {educationCount > 0 && <span>{educationCount} edu</span>}
                      {skillsCount > 0 && <span>{skillsCount} skills</span>}
                      {timeAgo && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    {/* Primary action */}
                    <Link
                      href="/resume-builder"
                      onClick={() => switchResume(resumeId)}
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-xs font-semibold text-white hover:brightness-110 transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                      Continue editing
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── D. CAREER WORKSPACE — Journey Section ── */}
      {hasResumes && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Career workspace
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: <FileText className="w-4 h-4" />,
                label: "Build",
                desc: "Resume Builder",
                href: "/resume-builder",
                color: "from-blue-500 to-cyan-500",
                bg: "bg-blue-500/10 dark:bg-blue-500/10",
                text: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: <BarChart3 className="w-4 h-4" />,
                label: "Understand",
                desc: "Career Intelligence",
                href: "/ai",
                color: "from-purple-500 to-indigo-500",
                bg: "bg-purple-500/10 dark:bg-purple-500/10",
                text: "text-purple-600 dark:text-purple-400",
              },
              {
                icon: <Shield className="w-4 h-4" />,
                label: "Strengthen",
                desc: "Professional Identity",
                href: "/overview#identity",
                color: "from-emerald-500 to-green-500",
                bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
                text: "text-emerald-600 dark:text-emerald-400",
              },
              {
                icon: <Briefcase className="w-4 h-4" />,
                label: "Apply",
                desc: "Job Applications",
                href: "/overview#applications",
                color: "from-amber-500 to-orange-500",
                bg: "bg-amber-500/10 dark:bg-amber-500/10",
                text: "text-amber-600 dark:text-amber-400",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-md transition-all text-center"
              >
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.text}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">{item.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600 group-hover:text-gray-500 dark:group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── E. JOB APPLICATIONS ── */}
      <div id="applications">
        <JobApplicationsSection />
      </div>

      {/* ── F. PROFESSIONAL IDENTITY WIDGETS ── */}
      {hasResumes && (
        <div id="identity">
          <FeatureGate
            gated={subscriptionTier === "Free"}
            featureName="Professional Identity"
            proIncludes={["Trust Score", "Professional Passport", "Knowledge Graph", "Career Insights"]}
          >
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Professional Identity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TrustWidget />
                <PassportWidget />
                <KnowledgeGraphWidget />
                <CareerInsightsWidget />
              </div>
            </section>
          </FeatureGate>
        </div>
      )}

      {/* ── G. AI TOOLS ── */}
      <section>
        <AICopilotWidget />
      </section>

      {/* ── Modals ── */}
      {shareModalResume && (
        <ShareResumeModal
          open={true}
          onClose={() => setShareModalResume(null)}
          resumeId={shareModalResume.id}
          resumeName={shareModalResume.name}
        />
      )}

      <ConfirmationDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        message="This resume will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete Resume"
        variant="danger"
        onConfirm={() => { if (deleteTarget?.id) deleteResume(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
