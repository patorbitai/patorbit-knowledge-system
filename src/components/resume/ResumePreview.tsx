import { ExecutivePreview, ExecutiveProPreview, MinimalAtsPreview, EngineeringCleanPreview, ModernCleanPreview, PatorbitModernPreview, ClassicSerifPreview, TechMonoPreview, CreativeBurstPreview, CompactProPreview, CorporateBluePreview, MinimalEdgePreview, BannerBoldPreview, SidebarElegancePreview, GradientFlowPreview, AcademicFormalPreview, StartupVibePreview, DarkElegancePreview, TimelineProPreview, PremiumSlatePreview, NatureGreenPreview, LuxuryGoldPreview, SwissDesignPreview, ScientificPreview, CreativePortfolioPreview, ConsultingElitePreview, ProductManagerPreview, CreativeProfessionalPreview, AcademicCvPreview } from "@/app/resume-builder/template-components";
import { TEMPLATES, type ResumeTemplate } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";

export function getActiveTemplate(resume: Resume): ResumeTemplate {
  return TEMPLATES.find(t => t.id === resume.templateId) || TEMPLATES[0];
}

export function ResumePreview({ resume, template }: { resume: Resume; template: ResumeTemplate }) {
  const empty = !resume.name && !resume.title && !resume.email && !resume.summary;

  if (empty) {
    return (
      <div className="bg-white text-black rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.06)] overflow-hidden min-h-[735px]">
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <p className="text-xs text-slate-400 font-medium">Preview</p>
          <p className="text-[10px] text-slate-300 mt-1">Add details to populate</p>
        </div>
      </div>
    );
  }

  switch (template.id) {
    case "executive": return <ExecutivePreview resume={resume} />;
    case "executive-pro": return <ExecutiveProPreview resume={resume} />;
    case "minimal-ats": return <MinimalAtsPreview resume={resume} />;
    case "engineering-clean": return <EngineeringCleanPreview resume={resume} />;
    case "modern-clean": return <ModernCleanPreview resume={resume} />;
    case "patorbit-modern": return <PatorbitModernPreview resume={resume} />;
    case "classic-serif": return <ClassicSerifPreview resume={resume} />;
    case "tech-mono": return <TechMonoPreview resume={resume} />;
    case "creative-burst": return <CreativeBurstPreview resume={resume} />;
    case "compact-pro": return <CompactProPreview resume={resume} />;
    case "corporate-blue": return <CorporateBluePreview resume={resume} />;
    case "minimal-edge": return <MinimalEdgePreview resume={resume} />;
    case "banner-bold": return <BannerBoldPreview resume={resume} />;
    case "sidebar-elegance": return <SidebarElegancePreview resume={resume} />;
    case "gradient-flow": return <GradientFlowPreview resume={resume} />;
    case "academic-formal": return <AcademicFormalPreview resume={resume} />;
    case "startup-vibe": return <StartupVibePreview resume={resume} />;
    case "dark-elegance": return <DarkElegancePreview resume={resume} />;
    case "timeline-pro": return <TimelineProPreview resume={resume} />;
    case "premium-slate": return <PremiumSlatePreview resume={resume} />;
    case "nature-green": return <NatureGreenPreview resume={resume} />;
    case "luxury-gold": return <LuxuryGoldPreview resume={resume} />;
    case "swiss-design": return <SwissDesignPreview resume={resume} />;
    case "scientific": return <ScientificPreview resume={resume} />;
    case "creative-portfolio": return <CreativePortfolioPreview resume={resume} />;
    case "consulting-elite": return <ConsultingElitePreview resume={resume} />;
    case "product-manager": return <ProductManagerPreview resume={resume} />;
    case "creative-professional": return <CreativeProfessionalPreview resume={resume} />;
    case "academic-cv": return <AcademicCvPreview resume={resume} />;
    default: return <ModernCleanPreview resume={resume} />;
  }
}
