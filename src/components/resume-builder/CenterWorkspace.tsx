"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "./section-card";
import {
  PersonalSection,
  ExperienceSection,
  EducationSection,
  SkillsSection,
  ProjectsSection,
  CertificationsSection,
  AchievementsSection,
  LanguagesSection,
  PortfolioSection,
  ReviewSection,
} from "./sections";
import type { SectionId } from "@/types/resume";

const sectionComponents: Record<SectionId, React.ComponentType> = {
  personal: PersonalSection,
  experience: ExperienceSection,
  education: EducationSection,
  skills: SkillsSection,
  projects: ProjectsSection,
  certifications: CertificationsSection,
  achievements: AchievementsSection,
  languages: LanguagesSection,
  portfolio: PortfolioSection,
  review: ReviewSection,
};

export function CenterWorkspace() {
  const activeSection = useResumeBuilder((s) => s.activeSection);
  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="flex-1 bg-white dark:bg-[#0A0E1B] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
        <div className="space-y-4">
          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <SectionCard
              id="not-found"
              title="Section Not Found"
              description="Please select a valid section from the navigation."
              icon="❓"
            >
              <p className="text-center text-slate-500 py-8">
                The requested section could not be loaded.
              </p>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
