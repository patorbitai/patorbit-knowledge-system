// apps/web/src/components/resume/resume-preview.tsx
'use client';

import { type ReactNode } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely extract a string from unknown content — returns '' if not a string. */
function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Safely extract a string or null from unknown content. */
function strOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Safely extract a string for use as ReactNode. */
function node(value: unknown): ReactNode {
  return strOrNull(value);
}

/** Safely extract an array from unknown content. */
function arr<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// ── Templates ────────────────────────────────────────────────────────────────
// Extensible template interface for future template switching

type TemplateStyle = {
  id: string;
  name: string;
  containerClass: string;
  headerClass: string;
  sectionTitleClass: string;
  entryTitleClass: string;
  dateClass: string;
  descriptionClass: string;
  skillBadgeClass: string;
  dividerClass: string;
};

const TEMPLATES: Record<string, TemplateStyle> = {
  default: {
    id: 'default',
    name: 'Default',
    containerClass: 'bg-white shadow-sm rounded-lg p-8',
    headerClass: 'text-2xl font-bold text-gray-900',
    sectionTitleClass: 'text-lg font-semibold text-gray-800 border-b pb-1 mb-3',
    entryTitleClass: 'font-semibold text-gray-800',
    dateClass: 'text-sm text-gray-500',
    descriptionClass: 'text-sm text-gray-700 leading-relaxed',
    skillBadgeClass: 'inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded mr-1 mb-1',
    dividerClass: 'border-gray-200',
  },
  // Future templates can be added here (e.g., 'modern', 'minimal', 'executive')
};

// ── Section Renderers ────────────────────────────────────────────────────────

function PersonalInfoSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const name = str(content.fullName);
  const email = str(content.email);
  const phone = str(content.phone);
  const location = str(content.location);
  const linkedin = str(content.linkedinUrl);
  const website = str(content.website);

  return (
    <div className="text-center mb-6">
      {name && <h1 className={style.headerClass}>{name}</h1>}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
        {email && <span>{email}</span>}
        {phone && <span>{phone}</span>}
        {location && <span>{location}</span>}
      </div>
      {(linkedin || website) && (
        <div className="flex flex-wrap justify-center gap-x-4 text-sm text-blue-600 mt-1">
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noreferrer">
              Portfolio
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SummarySection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const summary = str(content.summary);
  if (!summary) return null;
  return <p className={cn(style.descriptionClass, 'mb-6')}>{summary}</p>;
}

function ExperienceSection({
  content,
  style,
  label,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
  label: string;
}) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>{label}</h2>
      {entries.map((entry, i) => (
        <div key={i} className="mb-4 last:mb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className={style.entryTitleClass}>{node(entry.title)}</p>
              {str(entry.company) && <p className="text-sm text-gray-600">{str(entry.company)}</p>}
            </div>
            {(str(entry.startDate) || str(entry.endDate)) && (
              <p className={style.dateClass}>
                {str(entry.startDate)} – {str(entry.endDate)}
              </p>
            )}
          </div>
          {str(entry.description) && (
            <p className={cn(style.descriptionClass, 'mt-1')}>{str(entry.description)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EducationSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>Education</h2>
      {entries.map((entry, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className={style.entryTitleClass}>{node(entry.degree)}</p>
              {str(entry.institution) && (
                <p className="text-sm text-gray-600">{str(entry.institution)}</p>
              )}
            </div>
            {(entry.startDate || entry.endDate) && (
              <p className={style.dateClass}>
                {str(entry.startDate)} – {str(entry.endDate)}
              </p>
            )}
          </div>
          {entry.description && (
            <p className={cn(style.descriptionClass, 'mt-1')}>{str(entry.description)}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function SkillsSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const items = arr<string>(content.items);
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>Skills</h2>
      <div>
        {items.map((skill, i) => (
          <span key={i} className={style.skillBadgeClass}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectsSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>Projects</h2>
      {entries.map((entry, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <p className={style.entryTitleClass}>{node(entry.name)}</p>
          {entry.description && (
            <p className={cn(style.descriptionClass, 'mt-1')}>{str(entry.description)}</p>
          )}
          {entry.url && (
            <a
              href={str(entry.url)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 mt-1 inline-block"
            >
              {str(entry.url)}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function CertificationsSection({
  content,
  style,
  label,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
  label: string;
}) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>{label}</h2>
      {entries.map((entry, i) => (
        <div key={i} className="mb-2 last:mb-0 flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-800">{node(entry.name)}</p>
            {entry.issuer && <p className="text-xs text-gray-500">{str(entry.issuer)}</p>}
          </div>
          {entry.date && <p className={style.dateClass}>{str(entry.date)}</p>}
        </div>
      ))}
    </div>
  );
}

function LanguagesSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const items = arr<Record<string, string>>(content.items);
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>Languages</h2>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-800">{str(item.language)}</span>
            <span className="text-gray-500">{str(item.proficiency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterestsSection({
  content,
  style,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
}) {
  const items = arr<string>(content.items);
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className={style.sectionTitleClass}>Interests</h2>
      <p className="text-sm text-gray-700">{items.join(', ')}</p>
    </div>
  );
}

function CustomSection({
  content,
  style,
  title: sectionTitle,
}: {
  content: Record<string, unknown>;
  style: TemplateStyle;
  title: string | null;
}) {
  const text = str(content.text);
  return (
    <div className="mb-6">
      {sectionTitle && <h2 className={style.sectionTitleClass}>{sectionTitle}</h2>}
      {text && <p className={style.descriptionClass}>{text}</p>}
    </div>
  );
}

// ── Section dispatcher ───────────────────────────────────────────────────────

const SECTION_RENDERERS: Record<
  string,
  React.ComponentType<{
    content: Record<string, unknown>;
    style: TemplateStyle;
    label?: string;
  }>
> = {
  PERSONAL_INFORMATION: PersonalInfoSection,
  PROFESSIONAL_SUMMARY: SummarySection,
  WORK_EXPERIENCE: (props) => <ExperienceSection {...props} label="Experience" />,
  VOLUNTEER_EXPERIENCE: (props) => <ExperienceSection {...props} label="Volunteer Experience" />,
  EDUCATION: EducationSection,
  SKILLS: SkillsSection,
  PROJECTS: ProjectsSection,
  CERTIFICATIONS: (props) => <CertificationsSection {...props} label="Certifications" />,
  ACHIEVEMENTS: (props) => <CertificationsSection {...props} label="Achievements" />,
  PUBLICATIONS: (props) => <CertificationsSection {...props} label="Publications" />,
  AWARDS: (props) => <CertificationsSection {...props} label="Awards" />,
  LANGUAGES: LanguagesSection,
  INTERESTS: InterestsSection,
  CUSTOM: (props) => <CustomSection {...props} title={null} />,
};

// ── Section wrapper ──────────────────────────────────────────────────────────

function PreviewSection({
  section,
  templateId,
}: {
  section: {
    type: string;
    content: Record<string, unknown> | null;
    title: string | null;
    isVisible: boolean;
  };
  templateId: string;
}) {
  if (!section.isVisible) return null;

  const style = TEMPLATES[templateId] ?? TEMPLATES.default;
  const Renderer = SECTION_RENDERERS[section.type];

  if (!Renderer) {
    return (
      <div className="mb-6">
        <h2 className={style.sectionTitleClass}>{section.title ?? section.type}</h2>
        <p className="text-sm text-gray-500 italic">Unsupported section type: {section.type}</p>
      </div>
    );
  }

  return (
    <Renderer content={section.content ?? {}} style={style} label={section.title ?? undefined} />
  );
}

// ── Main Preview Component ───────────────────────────────────────────────────

export interface ResumePreviewProps {
  templateId?: string;
  className?: string;
}

export function ResumePreview({ templateId = 'default', className }: ResumePreviewProps) {
  const resume = useResumeStore((s) => s.resume);
  const style = TEMPLATES[templateId] ?? TEMPLATES.default;

  if (!resume) {
    return (
      <div className={cn('flex items-center justify-center h-full text-gray-400', className)}>
        <p className="text-sm">No resume loaded</p>
      </div>
    );
  }

  const visibleSections = resume.sections.filter((s) => s.isVisible);
  const hiddenCount = resume.sections.filter((s) => !s.isVisible).length;

  return (
    <div className={cn('h-full overflow-y-auto', className)}>
      {/* Preview canvas */}
      <div className="max-w-[210mm] mx-auto py-6 px-4">
        {/* Page-like card */}
        <div className={style.containerClass}>
          {visibleSections.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">
              No visible sections to preview. Edit your resume to add content.
              {hiddenCount > 0 && (
                <span className="block mt-2">
                  {hiddenCount} section{hiddenCount > 1 ? 's are' : ' is'} hidden — click the eye
                  icon to show them.
                </span>
              )}
            </p>
          ) : (
            visibleSections.map((section, idx) => (
              <div key={section.id}>
                <PreviewSection section={section} templateId={templateId} />
                {/* Divider between sections except last */}
                {idx < visibleSections.length - 1 && section.type !== 'PERSONAL_INFORMATION' && (
                  <hr className={cn('my-4', style.dividerClass)} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
