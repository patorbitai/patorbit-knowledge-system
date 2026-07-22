
import { type Prisma } from '@patorbit/database';

export const starterTemplates: Prisma.ResumeTemplateCreateInput[] = [
  {
    name: 'Professional',
    description: 'A clean, traditional layout suitable for corporate and professional roles.',
    category: 'professional',
    isSystem: true,
    config: {
      fontFamily: 'Arial',
      primaryColor: '#1F2937',
      secondaryColor: '#4B5563',
      accentColor: '#2563EB',
      layout: 'single-column',
      spacing: 'normal',
      headerStyle: 'centered',
      sectionDividers: true,
    },
  },
  {
    name: 'Modern',
    description: 'A contemporary layout with accent colors and a two-column design.',
    category: 'modern',
    isSystem: true,
    config: {
      fontFamily: 'Inter',
      primaryColor: '#111827',
      secondaryColor: '#6B7280',
      accentColor: '#7C3AED',
      layout: 'two-column',
      sidebarWidth: '30%',
      spacing: 'comfortable',
      headerStyle: 'left-aligned',
      sectionDividers: false,
    },
  },
  {
    name: 'Simple',
    description: 'A minimalist design focused on readability and content.',
    category: 'simple',
    isSystem: true,
    config: {
      fontFamily: 'Georgia',
      primaryColor: '#000000',
      secondaryColor: '#374151',
      accentColor: '#000000',
      layout: 'single-column',
      spacing: 'compact',
      headerStyle: 'left-aligned',
      sectionDividers: false,
    },
  },
];
