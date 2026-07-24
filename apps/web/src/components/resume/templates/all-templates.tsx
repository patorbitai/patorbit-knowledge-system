'use client';

import { type ResumeTheme } from './section-renderers';
import { type TemplateConfig } from './template-factory';
import { TemplateFromConfig } from './template-factory';
import { type ResumeData } from './types';

// ── 30 Template Configurations ────────────────────────────────────────────────

export const ALL_TEMPLATES: TemplateConfig[] = [
  // ── Classic (1-6) ──────────────────────────────────────────────────
  {
    id: 'classic-1',
    name: 'Classic',
    description: 'Clean traditional layout.',
    category: 'classic',
    thumbnail: '📄',
    wrapperClass: 'font-sans',
  },
  {
    id: 'classic-2',
    name: 'Classic Serif',
    description: 'Elegant serif typography.',
    category: 'classic',
    thumbnail: '📜',
    wrapperClass: 'font-serif',
    defaultTheme: { fontFamily: 'Georgia, serif' },
  },
  {
    id: 'classic-3',
    name: 'Classic Compact',
    description: 'Space-efficient classic.',
    category: 'classic',
    thumbnail: '📋',
    wrapperClass: 'text-sm',
    defaultTheme: { fontSize: '12px', sectionSpacing: '1rem' },
  },
  {
    id: 'classic-4',
    name: 'Classic Wide',
    description: 'Spacious readable layout.',
    category: 'classic',
    thumbnail: '📖',
    wrapperClass: 'px-12',
    defaultTheme: { pageMargins: '3rem' },
  },
  {
    id: 'classic-5',
    name: 'Classic Blue',
    description: 'Traditional with blue accents.',
    category: 'classic',
    thumbnail: '🔵',
    defaultTheme: { accentColor: '#2563eb' },
  },
  {
    id: 'classic-6',
    name: 'Classic Warm',
    description: 'Warm amber-toned classic.',
    category: 'classic',
    thumbnail: '🟠',
    defaultTheme: { accentColor: '#d97706', primaryColor: '#292524' },
  },

  // ── Modern (7-12) ───────────────────────────────────────────────────
  {
    id: 'modern-1',
    name: 'Modern',
    description: 'Bold contemporary design.',
    category: 'modern',
    thumbnail: '🎨',
    defaultTheme: { headerStyle: 'centered', accentColor: '#4f46e5' },
  },
  {
    id: 'modern-2',
    name: 'Modern Teal',
    description: 'Teal-accented modern.',
    category: 'modern',
    thumbnail: '🩱',
    defaultTheme: { headerStyle: 'centered', accentColor: '#0d9488' },
  },
  {
    id: 'modern-3',
    name: 'Modern Rose',
    description: 'Rose-tinted modern layout.',
    category: 'modern',
    thumbnail: '🌹',
    defaultTheme: { headerStyle: 'centered', accentColor: '#e11d48' },
  },
  {
    id: 'modern-4',
    name: 'Modern Purple',
    description: 'Purple-forward modern.',
    category: 'modern',
    thumbnail: '🟣',
    defaultTheme: { headerStyle: 'centered', accentColor: '#9333ea' },
  },
  {
    id: 'modern-5',
    name: 'Modern Split',
    description: 'Split-header modern design.',
    category: 'modern',
    thumbnail: '✂️',
    defaultTheme: { headerStyle: 'sidebar', accentColor: '#0891b2' },
  },
  {
    id: 'modern-6',
    name: 'Modern Dark',
    description: 'Dark mode modern resume.',
    category: 'modern',
    thumbnail: '🌙',
    defaultTheme: { primaryColor: '#0f172a', accentColor: '#6366f1', headerStyle: 'centered' },
  },

  // ── Minimal (13-18) ─────────────────────────────────────────────────
  {
    id: 'minimal-1',
    name: 'Minimal',
    description: 'Clean and minimal.',
    category: 'minimal',
    thumbnail: '⚪',
    defaultTheme: {
      fontSize: '13px',
      sectionSpacing: '1rem',
      headerStyle: 'centered',
      primaryColor: '#334155',
    },
  },
  {
    id: 'minimal-2',
    name: 'Minimal Light',
    description: 'Airy light design.',
    category: 'minimal',
    thumbnail: '🕊️',
    defaultTheme: { fontSize: '12px', sectionSpacing: '0.75rem', primaryColor: '#475569' },
  },
  {
    id: 'minimal-3',
    name: 'Minimal Mono',
    description: 'Monospace minimal.',
    category: 'minimal',
    thumbnail: '⌨️',
    wrapperClass: 'font-mono',
    defaultTheme: { fontFamily: '"Courier New", monospace', fontSize: '12px' },
  },
  {
    id: 'minimal-4',
    name: 'Minimal Sans',
    description: 'Sans-serif minimal.',
    category: 'minimal',
    thumbnail: '📝',
    defaultTheme: { fontFamily: 'Inter, sans-serif', fontSize: '13px', headerStyle: 'centered' },
  },
  {
    id: 'minimal-5',
    name: 'Minimal Border',
    description: 'Bordered minimal sections.',
    category: 'minimal',
    thumbnail: '⊞',
    wrapperClass: 'border-2 border-gray-200',
    defaultTheme: { sectionSpacing: '1rem' },
  },
  {
    id: 'minimal-6',
    name: 'Minimal Compact',
    description: 'Ultra-compact minimal.',
    category: 'minimal',
    thumbnail: '▪️',
    wrapperClass: 'text-xs',
    defaultTheme: { fontSize: '11px', sectionSpacing: '0.5rem', lineHeight: '1.4' },
  },

  // ── Professional (19-24) ─────────────────────────────────────────────
  {
    id: 'pro-1',
    name: 'Professional',
    description: 'Corporate-ready refined.',
    category: 'professional',
    thumbnail: '💼',
    wrapperClass: 'font-serif',
    defaultTheme: { fontFamily: 'Georgia, serif', primaryColor: '#1e293b', accentColor: '#0f766e' },
  },
  {
    id: 'pro-2',
    name: 'Executive',
    description: 'Executive premium styling.',
    category: 'professional',
    thumbnail: '⭐',
    defaultTheme: {
      fontFamily: 'Cambria, serif',
      primaryColor: '#0f172a',
      accentColor: '#b45309',
      headerStyle: 'sidebar',
    },
  },
  {
    id: 'pro-3',
    name: 'Professional Navy',
    description: 'Navy-accented corporate.',
    category: 'professional',
    thumbnail: '⚓',
    defaultTheme: { accentColor: '#1e3a5f', primaryColor: '#0a1628' },
  },
  {
    id: 'pro-4',
    name: 'Professional Slate',
    description: 'Subtle slate professional.',
    category: 'professional',
    thumbnail: '🏛️',
    defaultTheme: { accentColor: '#475569', primaryColor: '#0f172a' },
  },
  {
    id: 'pro-5',
    name: 'Professional Emerald',
    description: 'Green-accent executive.',
    category: 'professional',
    thumbnail: '💚',
    defaultTheme: { accentColor: '#059669', primaryColor: '#0c4a6e' },
  },
  {
    id: 'pro-6',
    name: 'Professional Gold',
    description: 'Gold-accent premium.',
    category: 'professional',
    thumbnail: '🥇',
    wrapperClass: 'border-t-4 border-yellow-500',
    defaultTheme: { accentColor: '#ca8a04', primaryColor: '#1c1917' },
  },

  // ── Creative (25-30) ─────────────────────────────────────────────────
  {
    id: 'creative-1',
    name: 'Creative Bold',
    description: 'Bold color-block header.',
    category: 'creative',
    thumbnail: '🎯',
    defaultTheme: { headerStyle: 'sidebar', accentColor: '#7c3aed' },
  },
  {
    id: 'creative-2',
    name: 'Creative Gradient',
    description: 'Gradient header panel.',
    category: 'creative',
    thumbnail: '🌈',
    defaultTheme: { headerStyle: 'centered', accentColor: '#8b5cf6' },
  },
  {
    id: 'creative-3',
    name: 'Creative Colorful',
    description: 'Multi-color accents.',
    category: 'creative',
    thumbnail: '🦋',
    defaultTheme: { accentColor: '#ec4899', primaryColor: '#831843' },
  },
  {
    id: 'creative-4',
    name: 'Creative Sunset',
    description: 'Warm sunset-inspired.',
    category: 'creative',
    thumbnail: '🌅',
    defaultTheme: { accentColor: '#f97316', headerStyle: 'centered' },
  },
  {
    id: 'creative-5',
    name: 'Creative Ocean',
    description: 'Ocean blue tones.',
    category: 'creative',
    thumbnail: '🌊',
    defaultTheme: { accentColor: '#06b6d4', primaryColor: '#164e63', headerStyle: 'sidebar' },
  },
  {
    id: 'creative-6',
    name: 'Creative Forest',
    description: 'Forest green palette.',
    category: 'creative',
    thumbnail: '🌲',
    defaultTheme: { accentColor: '#16a34a', primaryColor: '#14532d', headerStyle: 'centered' },
  },
];

/** Render a template by its config */
export function TemplateByConfig({
  resume,
  theme,
  configId,
}: {
  resume: ResumeData;
  theme?: ResumeTheme;
  configId: string;
}) {
  const config = ALL_TEMPLATES.find((t) => t.id === configId) ?? ALL_TEMPLATES[0]!;
  return <TemplateFromConfig resume={resume} theme={theme} config={config} />;
}
