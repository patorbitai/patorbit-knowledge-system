"use client";

import React from "react";
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

/** Catches rendering errors in individual sections so one section crash
 *  doesn't take down the entire builder. */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionId: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; sectionId: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SectionErrorBoundary] ${this.props.sectionId}`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <SectionCard
          id="error"
          title="Section Error"
          description="This section encountered an error."
          icon="⚠️"
        >
          <div className="py-6 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              Something went wrong loading this section.
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 font-mono break-all">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              Try again
            </button>
          </div>
        </SectionCard>
      );
    }
    return this.props.children;
  }
}

export function CenterWorkspace() {
  const activeSection = useResumeBuilder((s) => s.activeSection);
  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="flex-1 bg-gray-50 dark:bg-[#070d18] overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
        <div className="space-y-4">
          {ActiveComponent ? (
            <SectionErrorBoundary sectionId={activeSection}>
              <ActiveComponent />
            </SectionErrorBoundary>
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
