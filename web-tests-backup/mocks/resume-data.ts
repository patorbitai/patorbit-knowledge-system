import { type Resume, type ResumeSection, type ResumeVersion } from '@/lib/types';

export const mockSection: ResumeSection = {
  id: 'sec-1',
  type: 'PROFESSIONAL_SUMMARY',
  title: 'Professional Summary',
  sortOrder: 0,
  isVisible: true,
  isCollapsible: true,
  isCollapsed: false,
  content: { summary: 'A dedicated software engineer with 5 years of experience.' },
  version: 1,
};

export const mockSectionSkills: ResumeSection = {
  id: 'sec-2',
  type: 'SKILLS',
  title: 'Skills',
  sortOrder: 1,
  isVisible: true,
  isCollapsible: true,
  isCollapsed: false,
  content: { items: ['TypeScript', 'React', 'Node.js'] },
  version: 1,
};

export const mockSectionHidden: ResumeSection = {
  id: 'sec-3',
  type: 'WORK_EXPERIENCE',
  title: 'Work Experience',
  sortOrder: 2,
  isVisible: false,
  isCollapsible: true,
  isCollapsed: false,
  content: {
    entries: [
      {
        company: 'Tech Corp',
        title: 'Software Engineer',
        startDate: 'Jan 2020',
        endDate: 'Present',
        description: 'Built web applications.',
      },
    ],
  },
  version: 1,
};

export const mockResume: Resume = {
  id: 'res-1',
  title: 'My Resume',
  status: 'DRAFT',
  templateId: null,
  version: 1,
  sections: [mockSection, mockSectionSkills, mockSectionHidden],
};

export const mockVersions: ResumeVersion[] = [
  { id: 'ver-1', version: 1, note: 'First version', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'ver-2', version: 2, note: null, createdAt: '2026-02-20T14:30:00Z' },
];
