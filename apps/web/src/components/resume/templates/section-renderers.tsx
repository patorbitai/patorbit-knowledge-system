'use client';

import { type ReactNode } from 'react';

import { arr, node, str } from './types';

// ── Renderer Props ───────────────────────────────────────────────────────────

export type SectionRendererProps = {
  content: Record<string, unknown>;
  /** Override for the label/heading of this section type */
  label?: string;
  /** Runtime theme overrides injected by the customization system */
  theme?: ResumeTheme;
};

export type ResumeTheme = {
  fontFamily: string;
  fontSize: string;
  primaryColor: string;
  accentColor: string;
  sectionSpacing: string;
  lineHeight: string;
  pageMargins: string;
  headerStyle: 'default' | 'centered' | 'sidebar';
};

const DEFAULT_THEME: ResumeTheme = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  primaryColor: '#1e293b',
  accentColor: '#3b82f6',
  sectionSpacing: '1.5rem',
  lineHeight: '1.6',
  pageMargins: '2rem',
  headerStyle: 'default',
};

const T = (t: ResumeTheme | undefined) => t ?? DEFAULT_THEME;

// ── Styling helpers ──────────────────────────────────────────────────────────

function sectionHeading(cls: string, label: string, theme?: ResumeTheme) {
  return (
    <h2
      key={label}
      className={`font-semibold border-b pb-1 mb-3 ${cls}`}
      style={{ borderColor: T(theme).accentColor + '40', color: T(theme).primaryColor }}
    >
      {label}
    </h2>
  );
}

// ── Personal Information ─────────────────────────────────────────────────────

export function PersonalInfo({ content, theme }: SectionRendererProps) {
  const name = str(content.fullName);
  const email = str(content.email);
  const phone = str(content.phone);
  const location = str(content.location);
  const linkedin = str(content.linkedinUrl);
  const website = str(content.website);
  const t = T(theme);

  if (t.headerStyle === 'sidebar') {
    return (
      <div className="p-6 text-white mb-6 rounded-sm" style={{ backgroundColor: t.accentColor }}>
        {name && <h1 className="text-2xl font-bold tracking-tight">{name}</h1>}
        <div className="flex flex-col gap-1 text-sm mt-2 opacity-90">
          {email && <span>{email}</span>}
          {phone && <span>{phone}</span>}
          {location && <span>{location}</span>}
        </div>
        {(linkedin || website) && (
          <div className="flex gap-4 text-sm mt-1 opacity-80">
            {linkedin && <a href={linkedin}>LinkedIn</a>}
            {website && <a href={website}>Portfolio</a>}
          </div>
        )}
      </div>
    );
  }

  const centered = t.headerStyle === 'centered';
  const Wrapper = centered ? 'div' : 'div';

  return (
    <div className={`mb-6 ${centered ? 'text-center' : ''}`}>
      {name && (
        <h1 className="text-2xl font-bold" style={{ color: t.primaryColor }}>
          {name}
        </h1>
      )}
      <div
        className={`flex flex-wrap ${centered ? 'justify-center' : ''} gap-x-4 gap-y-1 text-sm mt-1`}
        style={{ color: t.primaryColor + 'cc' }}
      >
        {email && <span>{email}</span>}
        {phone && <span>{phone}</span>}
        {location && <span>{location}</span>}
      </div>
      {(linkedin || website) && (
        <div className={`flex flex-wrap ${centered ? 'justify-center' : ''} gap-x-4 text-sm mt-1`}>
          {linkedin && (
            <a href={linkedin} style={{ color: t.accentColor }}>
              LinkedIn
            </a>
          )}
          {website && (
            <a href={website} style={{ color: t.accentColor }}>
              Portfolio
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Summary ──────────────────────────────────────────────────────────────────

export function Summary({ content, theme }: SectionRendererProps) {
  const summary = str(content.summary);
  if (!summary) return null;
  return (
    <p className="text-sm leading-relaxed mb-6" style={{ lineHeight: T(theme).lineHeight }}>
      {summary}
    </p>
  );
}

// ── Experience (Work, Volunteer, Projects, etc.) ─────────────────────────────

export function Experience({ content, label, theme }: SectionRendererProps) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;
  const t = T(theme);

  return (
    <div className="mb-6" style={{ marginBottom: t.sectionSpacing }}>
      {sectionHeading('text-base', label ?? 'Experience', theme)}
      {entries.map((entry, i) => (
        <div key={i} className="mb-4 last:mb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold" style={{ color: t.primaryColor }}>
                {node(entry.title)}
              </p>
              {str(entry.company) && (
                <p className="text-sm" style={{ color: t.primaryColor + '99' }}>
                  {str(entry.company)}
                </p>
              )}
            </div>
            {(str(entry.startDate) || str(entry.endDate)) && (
              <p className="text-xs shrink-0 ml-2" style={{ color: t.primaryColor + '88' }}>
                {str(entry.startDate)} – {str(entry.endDate)}
              </p>
            )}
          </div>
          {str(entry.description) && (
            <p
              className="text-sm leading-relaxed mt-1"
              style={{ lineHeight: t.lineHeight, color: t.primaryColor + 'dd' }}
            >
              {str(entry.description)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Education ────────────────────────────────────────────────────────────────

export function Education({ content, theme }: SectionRendererProps) {
  const entries = arr<Record<string, unknown>>(content.entries);
  if (entries.length === 0) return null;
  const t = T(theme);

  return (
    <div className="mb-6" style={{ marginBottom: t.sectionSpacing }}>
      {sectionHeading('text-base', 'Education', theme)}
      {entries.map((entry, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold" style={{ color: t.primaryColor }}>
                {node(entry.degree)}
              </p>
              {str(entry.institution) && (
                <p className="text-sm" style={{ color: t.primaryColor + '99' }}>
                  {str(entry.institution)}
                </p>
              )}
            </div>
            {(str(entry.startDate) || str(entry.endDate)) && (
              <p className="text-xs shrink-0 ml-2" style={{ color: t.primaryColor + '88' }}>
                {str(entry.startDate)} – {str(entry.endDate)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skills ───────────────────────────────────────────────────────────────────

export function Skills({ content, theme }: SectionRendererProps) {
  const items = arr<string>(content.items);
  if (items.length === 0) return null;
  const t = T(theme);

  return (
    <div className="mb-6" style={{ marginBottom: t.sectionSpacing }}>
      {sectionHeading('text-base', 'Skills', theme)}
      <div className="flex flex-wrap gap-1.5">
        {items.map((skill, i) => (
          <span
            key={i}
            className="inline-block px-2.5 py-0.5 text-xs rounded-full"
            style={{
              backgroundColor: t.accentColor + '15',
              color: t.accentColor,
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Interests (Tags) ─────────────────────────────────────────────────────────

export function Interests({ content, theme }: SectionRendererProps) {
  const items = arr<string>(content.items);
  if (items.length === 0) return null;
  const t = T(theme);

  return (
    <div className="mb-6" style={{ marginBottom: t.sectionSpacing }}>
      {sectionHeading('text-base', 'Interests', theme)}
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-block px-2 py-0.5 text-xs rounded"
            style={{ backgroundColor: t.primaryColor + '10', color: t.primaryColor }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Languages ────────────────────────────────────────────────────────────────

export function Languages({ content, theme }: SectionRendererProps) {
  const items = arr<Record<string, string>>(content.items);
  if (items.length === 0) return null;
  const t = T(theme);

  return (
    <div className="mb-6" style={{ marginBottom: t.sectionSpacing }}>
      {sectionHeading('text-base', 'Languages', theme)}
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm py-0.5">
          <span style={{ color: t.primaryColor }}>{item.language}</span>
          <span style={{ color: t.primaryColor + '88' }}>{item.proficiency}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section Router ───────────────────────────────────────────────────────────

export const SECTION_RENDERERS: Record<string, React.ComponentType<SectionRendererProps>> = {
  PERSONAL_INFORMATION: PersonalInfo,
  PROFESSIONAL_SUMMARY: Summary,
  WORK_EXPERIENCE: (props) => <Experience {...props} label="Experience" />,
  VOLUNTEER_EXPERIENCE: (props) => <Experience {...props} label="Volunteer Experience" />,
  EDUCATION: Education,
  SKILLS: Skills,
  PROJECTS: (props) => <Experience {...props} label="Projects" />,
  CERTIFICATIONS: (props) => <Experience {...props} label="Certifications" />,
  ACHIEVEMENTS: (props) => <Experience {...props} label="Achievements" />,
  PUBLICATIONS: (props) => <Experience {...props} label="Publications" />,
  AWARDS: (props) => <Experience {...props} label="Awards" />,
  LANGUAGES: Languages,
  INTERESTS: Interests,
};
