'use client';
import { type ResumeTheme, SECTION_RENDERERS } from './section-renderers';
import { type ResumeData } from './types';

/** A template is just a configuration object + a shared renderer */
export type TemplateConfig = {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'modern' | 'minimal' | 'professional' | 'creative';
  thumbnail: string;
  /** Optional override applied when the template is selected */
  defaultTheme?: Partial<ResumeTheme>;
  /** CSS class or style overrides applied to the root wrapper */
  wrapperClass?: string;
  /** Whether to render personal info in a sidebar */
  sidebarHeader?: boolean;
};

/** Render any template from its config + resume data */
export function TemplateFromConfig({
  resume,
  theme,
  config,
}: {
  resume: ResumeData;
  theme?: ResumeTheme;
  config: TemplateConfig;
}) {
  const visibleSections = resume.sections.filter((s) => s.isVisible);
  const personalInfo = visibleSections.find((s) => s.type === 'PERSONAL_INFORMATION');
  const rest = visibleSections.filter((s) => s.type !== 'PERSONAL_INFORMATION');

  return (
    <div
      className={`max-w-[210mm] mx-auto bg-white shadow-sm rounded-lg ${config.wrapperClass ?? ''}`}
    >
      {config.sidebarHeader ? (
        <div className="flex">
          {personalInfo && (
            <div
              className="w-56 shrink-0 p-6 text-white"
              style={{ backgroundColor: theme?.accentColor ?? '#0f172a' }}
            >
              {renderSection(personalInfo, theme)}
            </div>
          )}
          <div className="flex-1 p-8">{rest.map((s) => renderSection(s, theme))}</div>
        </div>
      ) : (
        <div className="p-8">{visibleSections.map((s) => renderSection(s, theme))}</div>
      )}
    </div>
  );
}

function renderSection(section: ResumeData['sections'][number], theme?: ResumeTheme) {
  const Renderer = SECTION_RENDERERS[section.type];
  if (!Renderer) return null;
  return (
    <Renderer
      key={section.id}
      content={section.content ?? {}}
      label={section.title ?? undefined}
      theme={theme}
    />
  );
}
