import { Injectable, Logger } from '@nestjs/common';

import { type ParserResult } from './json-parser';

/**
 * Parses DOCX files into structured resume data using mammoth.
 */
@Injectable()
export class DocxParser {
  private readonly logger = new Logger(DocxParser.name);

  async parse(data: Buffer): Promise<ParserResult> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: data });
      const text = result.value;

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'No extractable text found in DOCX',
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
          metadata: { format: 'docx', warnings: result.messages },
        },
      };
    } catch (error) {
      this.logger.error(`DOCX parsing failed: ${(error as Error).message}`);
      return {
        success: false,
        error: `DOCX parsing failed: ${(error as Error).message}`,
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
