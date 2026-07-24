import { ALL_TEMPLATES } from './all-templates';
import { type ResumeTheme } from './section-renderers';
import { type TemplateConfig } from './template-factory';

// ── Template IDs ─────────────────────────────────────────────────────────────

export type TemplateId = string;

// ── All 30 templates are lazy-loaded via a single chunk ──────────────────────

export const TEMPLATES: Record<
  string,
  React.ComponentType<{ resume: any; theme?: ResumeTheme }>
> = {};

// ── Metadata (derived from all-templates config) ─────────────────────────────

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  defaultTheme?: Partial<ResumeTheme>;
}

/** Synchronously available metadata from the static import */
const _meta: TemplateMeta[] = ALL_TEMPLATES.map((t: TemplateConfig) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  category: t.category,
  thumbnail: t.thumbnail,
  defaultTheme: t.defaultTheme,
}));

export const TEMPLATE_METADATA: TemplateMeta[] = _meta;

export function getTemplateMeta(id: string): TemplateMeta {
  return TEMPLATE_METADATA.find((t) => t.id === id) ?? TEMPLATE_METADATA[0]!;
}

export function getTemplatesByCategory(category: string): TemplateMeta[] {
  return TEMPLATE_METADATA.filter((t) => t.category === category);
}
