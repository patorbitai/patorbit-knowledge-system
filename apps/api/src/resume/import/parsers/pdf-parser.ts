import { Injectable, Logger } from '@nestjs/common';

import { type ParserResult } from './json-parser';

/**
 * Parses PDF files into structured resume data.
 * Uses pdf-parse for text extraction and heuristics for structure.
 */
@Injectable()
export class PdfParser {
  private readonly logger = new Logger(PdfParser.name);

  async parse(data: Buffer): Promise<ParserResult> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(data);
      const text = pdfData.text;

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'No extractable text found in PDF',
        };
      }

      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const sections = this.extractSections(lines);
      const mappedSections = Object.entries(sections).map(([section, linesArr]) => ({
        type: section.toUpperCase(),
        title: undefined,
        content: { lines: linesArr },
      }));

      return {
        success: true,
        data: {
          rawText: text,
          sections: mappedSections,
          metadata: {
            pageCount: pdfData.numpages,
            format: 'pdf',
          },
        },
      };
    } catch (error) {
      this.logger.error(`PDF parsing failed: ${(error as Error).message}`);
      return {
        success: false,
        error: `PDF parsing failed: ${(error as Error).message}`,
      };
    }
  }

  private extractSections(lines: string[]): Record<string, string[]> {
    const sections: Record<string, string[]> = {};
    const sectionHeaders = [
      'experience',
      'education',
      'skills',
      'summary',
      'objective',
      'projects',
      'certifications',
      'achievements',
      'publications',
      'languages',
      'volunteer',
      'references',
      'contact',
      'profile',
    ];

    let currentSection = 'general';
    for (const line of lines) {
      const lower = line.toLowerCase();
      const matched = sectionHeaders.find((h) => lower.includes(h));
      if (matched && line.length < 60) {
        currentSection = matched;
        continue;
      }
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line);
    }

    return sections;
  }
}
