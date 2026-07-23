'use client';

import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { arr, node, type ResumeData, str } from './types';

// ── Section renderers ────────────────────────────────────────────────────────

function PersonalInfoSection({ content }: { content: Record<string, unknown> }) {
  const name = str(content.fullName);
  const email = str(content.email);
  const phone = str(content.phone);
  const location = str(content.location);
  const linkedin = str(content.linkedinUrl);
  const website = str(content.website);

  return (
    <div className="text-center mb-6">
      {name && <h1 className="text-2xl font-bold text-gray-900">{name}</h1>}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
        {email && <span>{email}</span>}
        {phone && <span>{phone}</span>}
        {location && <span>{location}</span>}
      </div>
      {(linkedin || website) && (
        <div className="flex flex-wrap justify-center gap-x-4 text-sm text-blue-600 mt-1">
          {linkedin && <a href={linkedin}>LinkedIn</a>}
          {website && <a href={website}>Portfolio</a>}
        </div>
      )}
    </div>
  );
}

function SummarySection({ content }: { content: Record<string, unknown> }) {
  const summary = str(content.summary);
  if (!summary) return null;
  return <p className="text-sm text-gray-700 leading-relaxed mb-6">{summary}</p>;
}

function ExperienceSection({
  content,
  label,
}: {
  content: Record<string, unknown>;
  label: string;
}) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-1 mb-3">{label}</h2>
      {entries.map((entry, i) => (
        <div key={i} className="mb-4 last:mb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800">{node(entry.title)}</p>
              {str(entry.company) && <p className="text-sm text-gray-600">{str(entry.company)}</p>}
            </div>
            {(str(entry.startDate) || str(entry.endDate)) && (
              <p className="text-sm text-gray-500">
                {str(entry.startDate)} – {str(entry.endDate)}
              </p>
            )}
          </div>
          {str(entry.description) && (
            <p className="text-sm text-gray-700 leading-relaxed mt-1">{str(entry.description)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EducationSection({ content }: { content: Record<string, unknown> }) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-1 mb-3">Education</h2>
      {entries.map((entry, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-800">{node(entry.degree)}</p>
              {str(entry.institution) && (
                <p className="text-sm text-gray-600">{str(entry.institution)}</p>
              )}
            </div>
            {(entry.startDate || entry.endDate) && (
              <p className="text-sm text-gray-500">
                {str(entry.startDate)} – {str(entry.endDate)}
              </p>
            )}
          </div>
          {entry.description && (
            <p className="text-sm text-gray-700 leading-relaxed mt-1">{str(entry.description)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsSection({ content }: { content: Record<string, unknown> }) {
  const items = arr<string>(content.items);
  if (items.length === 0) return null;
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-1 mb-3">Skills</h2>
      <div className="flex flex-wrap gap-1.5">
        {items.map((skill, i) => (
          <span
            key={i}
            className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Section Router ───────────────────────────────────────────────────────────

const SECTION_RENDERERS: Record<
  string,
  React.ComponentType<{ content: Record<string, unknown>; label?: string }>
> = {
  PERSONAL_INFORMATION: PersonalInfoSection,
  PROFESSIONAL_SUMMARY: SummarySection,
  WORK_EXPERIENCE: (props) => <ExperienceSection {...props} label="Experience" />,
  VOLUNTEER_EXPERIENCE: (props) => <ExperienceSection {...props} label="Volunteer Experience" />,
  EDUCATION: EducationSection,
  SKILLS: SkillsSection,
  PROJECTS: (props) => <ExperienceSection {...props} label="Projects" />,
  CERTIFICATIONS: (props) => <ExperienceSection {...props} label="Certifications" />,
  ACHIEVEMENTS: (props) => <ExperienceSection {...props} label="Achievements" />,
  PUBLICATIONS: (props) => <ExperienceSection {...props} label="Publications" />,
  AWARDS: (props) => <ExperienceSection {...props} label="Awards" />,
  LANGUAGES: (props) => <ExperienceSection {...props} label="Languages" />,
  INTERESTS: SummarySection,
};

// ── Main template component ──────────────────────────────────────────────────

export function TemplateDefault({ resume }: { resume: ResumeData }) {
  const visibleSections = resume.sections.filter((s) => s.isVisible);

  return (
    <div className="max-w-[210mm] mx-auto bg-white shadow-sm rounded-lg">
      <div className="p-8">
        {visibleSections.map((section) => {
          const Renderer = SECTION_RENDERERS[section.type];
          if (!Renderer) return null;
          return (
            <Renderer
              key={section.id}
              content={section.content ?? {}}
              label={section.title ?? undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
