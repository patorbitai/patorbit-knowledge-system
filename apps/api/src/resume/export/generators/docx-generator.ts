import { Logger } from '@nestjs/common';

import { serializeResumeToText } from '../shared/resume-text-serializer';

const logger = new Logger('DocxGenerator');

export async function generateDocx(resume: any): Promise<Buffer> {
  logger.log(`Generating DOCX for resume: ${resume.id}`);

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

    const children: any[] = [];

    // Title
    children.push(
      new Paragraph({
        text: resume.title || 'Resume',
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
    );

    // Section loop
    const sections = resume.sections || [];
    for (const section of sections) {
      const label = (section.title || section.type || 'Section').replace(/_/g, ' ');
      children.push(
        new Paragraph({
          text: label,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        }),
      );

      if (section.content) {
        if (Array.isArray(section.content)) {
          for (const item of section.content) {
            const parts =
              typeof item === 'object'
                ? [item.title, item.company, item.description].filter(Boolean).join(' — ')
                : String(item);
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `• ${parts}`, size: 22 })],
                spacing: { after: 80 },
              }),
            );
          }
        } else if (typeof section.content === 'string') {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: section.content, size: 22 })],
              spacing: { after: 80 },
            }),
          );
        }
      }
    }

    const doc = new Document({ sections: [{ children }] });
    return await Packer.toBuffer(doc);
  } catch (error) {
    logger.warn(`docx library unavailable, using text fallback: ${(error as Error).message}`);
    const serializedText = serializeResumeToText(resume);
    return Buffer.from(serializedText, 'utf-8');
  }
}
