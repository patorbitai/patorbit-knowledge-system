// apps/api/src/resume/export/shared/resume-text-serializer.ts

interface ResumeSectionItem {
  title: string;
  company: string;
  description: string;
}

interface ResumeSection {
  type: string;
  title?: string;
  content: string | ResumeSectionItem[];
}

interface SerializableResume {
  id: string;
  title?: string;
  sections?: ResumeSection[];
}

export function serializeResumeToText(resume: SerializableResume): string {
  const lines: string[] = [];
  lines.push(resume.title || 'Resume');
  lines.push('='.repeat(50));
  lines.push('');

  const sections = resume.sections || [];
  for (const section of sections) {
    const label = (section.title || section.type || 'Section').replace(/_/g, ' ');
    lines.push(label);
    lines.push('-'.repeat(label.length));
    if (section.content) {
      if (Array.isArray(section.content)) {
        for (const item of section.content) {
          if (typeof item === 'object' && item !== null) {
            lines.push(
              `  • ${[item.title, item.company, item.description].filter(Boolean).join(' — ')}`,
            );
          } else {
            lines.push(`  • ${item}`);
          }
        }
      } else if (typeof section.content === 'string') {
        lines.push(`  ${section.content}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}
