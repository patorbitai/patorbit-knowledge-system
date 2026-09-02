"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Search,
  ArrowLeft,
  Check,
  Eye,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
import { TEMPLATES, type ResumeTemplate } from "@/app/resume-builder/templates";
import { useResumeBuilder } from "@/store/resume-builder";
import { MiniaturePreview } from "@/components/resume-builder/MiniaturePreview";
import { FullTemplatePreview } from "@/components/resume-builder/FullTemplatePreview";
import { filterTemplates } from "@/lib/template-search";

/* ── Categories ── */

const CATEGORIES = [
  { id: "all", label: "All", count: TEMPLATES.length },
  {
    id: "ats",
    label: "ATS Friendly",
    count: TEMPLATES.filter((t) => t.atsRating >= 95).length,
  },
  {
    id: "professional",
    label: "Professional",
    count: TEMPLATES.filter(
      (t) =>
        t.category === "Software Engineer" ||
        t.category === "Business" ||
        t.category === "Corporate"
    ).length,
  },
  {
    id: "executive",
    label: "Executive",
    count: TEMPLATES.filter(
      (t) =>
        t.experienceLevel === "Executive" ||
        t.category === "Executive" ||
        t.category.includes("Consulting")
    ).length,
  },
  {
    id: "modern",
    label: "Modern",
    count: TEMPLATES.filter(
      (t) =>
        t.layout === "two-column" ||
        t.layout === "sidebar-right" ||
        t.layout === "banner"
    ).length,
  },
  {
    id: "creative",
    label: "Creative",
    count: TEMPLATES.filter(
      (t) =>
        t.category === "Creative" ||
        t.category === "Designer" ||
        t.category.includes("Creative")
    ).length,
  },
  {
    id: "academic",
    label: "Academic",
    count: TEMPLATES.filter(
      (t) =>
        t.category === "Academic" ||
        t.category.includes("Academic") ||
        t.category.includes("Scientific")
    ).length,
  },
  {
    id: "engineering",
    label: "Engineering",
    count: TEMPLATES.filter(
      (t) =>
        t.category === "Software Engineer" ||
        t.category.includes("Engineering") ||
        t.category.includes("Tech")
    ).length,
  },
];

function matchesCategory(template: ResumeTemplate, catId: string): boolean {
  if (catId === "all") return true;
  if (catId === "ats") return template.atsRating >= 95;
  if (catId === "professional")
    return (
      template.category === "Software Engineer" ||
      template.category === "Business" ||
      template.category === "Corporate"
    );
  if (catId === "executive")
    return (
      template.experienceLevel === "Executive" ||
      template.category === "Executive" ||
      template.category.includes("Consulting")
    );
  if (catId === "modern")
    return (
      template.layout === "two-column" ||
      template.layout === "sidebar-right" ||
      template.layout === "banner"
    );
  if (catId === "creative")
    return (
      template.category === "Creative" ||
      template.category === "Designer" ||
      template.category.includes("Creative")
    );
  if (catId === "academic")
    return (
      template.category === "Academic" ||
      template.category.includes("Academic") ||
      template.category.includes("Scientific")
    );
  if (catId === "engineering")
    return (
      template.category === "Software Engineer" ||
      template.category.includes("Engineering") ||
      template.category.includes("Tech")
    );
  return true;
}

/* ── ATS Badge ── */
function AtsBadge({ score }: { score: number }) {
  const dot =
    score >= 95
      ? "🟢"
      : score >= 90
        ? "🔵"
        : score >= 85
          ? "🟡"
          : "⚪";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 dark:text-slate-400">
      <span className="text-[8px]">{dot}</span>
      ATS {score}%
    </span>
  );
}

/* ── Template Card ── */
function TemplateCard({
  template,
  isActive,
  onPreview,
  onUse,
}: {
  template: ResumeTemplate;
  isActive: boolean;
  onPreview: (t: ResumeTemplate) => void;
  onUse: (id: string) => void;
}) {
  return (
    <div
      data-template-id={template.id}
      className={clsx(
        "group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden",
        isActive
          ? "border-cyan-500 bg-cyan-500/[0.04] ring-1 ring-cyan-500/30"
          : "border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#0A0E1B] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
      )}
    >
      {/* Preview */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-[#070d18]">
        <MiniaturePreview templateId={template.id} />
        {/* Selected overlay */}
        {isActive && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-500 text-white text-[10px] font-semibold shadow-lg">
            <Check className="w-3 h-3" />
            Current
          </div>
        )}
        {/* Hover actions — always visible on mobile, hover-only on desktop */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/0 md:group-hover:bg-black/40 transition-all duration-200 flex items-end justify-center pb-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 pointer-events-auto md:pointer-events-none md:group-hover:pointer-events-auto">
          <div className="flex gap-2">
            <button
              onClick={() => onPreview(template)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-[#0A0E1B]/90 text-gray-900 dark:text-white text-xs font-medium backdrop-blur-sm hover:bg-white dark:hover:bg-[#0C1322] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => onUse(template.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-semibold hover:bg-cyan-400 transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5" />
              Use Template
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {template.name}
          </h3>
          <AtsBadge score={template.atsRating} />
        </div>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
        {template.recommendedFor && (
          <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium mt-0.5">
            Best for: {template.recommendedFor}
          </p>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Main Page Component
 * ══════════════════════════════════════════════════════════════════════════ */

export function TemplateGalleryPage() {
  const router = useRouter();
  const resume = useResumeBuilder((s) => s.resume);
  const applyTemplate = useResumeBuilder((s) => s.applyTemplate);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] =
    useState<ResumeTemplate | null>(null);

  const currentTemplateId = resume.templateId;

  /* ── Filtered templates ── */
  const filtered = useMemo(() => {
    let result = TEMPLATES;
    if (searchQuery.trim()) {
      result = filterTemplates(result, { query: searchQuery });
    }
    result = result.filter((t) => matchesCategory(t, activeCategory));
    return result;
  }, [searchQuery, activeCategory]);

  /* ── Handlers ── */
  const handleUseTemplate = useCallback(
    (templateId: string) => {
      applyTemplate(templateId);
      setPreviewTemplate(null);
      router.push("/resume-builder");
    },
    [applyTemplate, router]
  );

  const handlePreview = useCallback((template: ResumeTemplate) => {
    setPreviewTemplate(template);
  }, []);

  /* ── Full preview templates list (for prev/next navigation) ── */
  const previewTemplates = useMemo(
    () =>
      filtered.length > 0
        ? filtered
        : TEMPLATES,
    [filtered]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#070d18]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#070d18]/90 backdrop-blur-xl border-b border-gray-200 dark:border-[rgba(148,163,184,.14)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link
                href="/resume-builder"
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Builder</span>
              </Link>
              <div className="h-4 w-px bg-gray-200 dark:bg-white/[0.06]" />
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-500" />
                <h1 className="text-base font-bold text-gray-900 dark:text-white">
                  Templates
                </h1>
              </div>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              {TEMPLATES.length} templates
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Description */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Choose a template for your resume. Each template is designed for
            specific career types and optimized for ATS systems.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.filter((c) => c.count > 0).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                activeCategory === cat.id
                  ? "bg-cyan-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {cat.label}
              <span
                className={clsx(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  activeCategory === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 dark:bg-white/[0.06] text-gray-500 dark:text-slate-500"
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Template Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
              No templates match your search
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-2 text-xs text-cyan-500 hover:text-cyan-400 font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isActive={template.id === currentTemplateId}
                onPreview={handlePreview}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {filtered.length > 0 && (
          <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-slate-500">
            Showing {filtered.length} of {TEMPLATES.length} templates
          </p>
        )}
      </div>

      {/* Full Preview Modal */}
      {previewTemplate && (
        <FullTemplatePreview
          templateId={previewTemplate.id}
          templates={previewTemplates}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={handleUseTemplate}
        />
      )}
    </div>
  );
}
