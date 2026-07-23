import { Injectable, Logger } from '@nestjs/common';

import { type ParserResult } from './json-parser';

/**
 * Transforms LinkedIn profile export data into the internal resume format.
 * Accepts JSON exports or HTML profile data and extracts structured fields.
 */
@Injectable()
export class LinkedinParser {
  private readonly logger = new Logger(LinkedinParser.name);

  async parse(data: Buffer): Promise<ParserResult> {
    try {
      const raw = data.toString('utf-8');

      // Attempt JSON parsing first (LinkedIn data export format)
      if (this.isJson(raw)) {
        return this.parseJsonData(raw);
      }

      // Fall back to HTML scraping for profile-page dumps
      return this.parseHtmlData(raw);
    } catch (error) {
      this.logger.error(`LinkedIn parsing failed: ${(error as Error).message}`);
      return {
        success: false,
        error: `LinkedIn parsing failed: ${(error as Error).message}`,
      };
    }
  }

  private isJson(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  private parseJsonData(raw: string): ParserResult {
    const profile = JSON.parse(raw);

    const sections: Record<string, string[]> = {};
    sections.summary = profile.summary ? [profile.summary] : [];
    sections.experience = (profile.positions || []).map(
      (p: any) => `${p.title} at ${p.companyName} (${p.startDate} - ${p.endDate || 'Present'})`,
    );
    sections.education = (profile.education || []).map(
      (e: any) => `${e.degree} in ${e.fieldOfStudy} at ${e.schoolName}`,
    );
    sections.skills = profile.skills || [];

    return {
      success: true,
      data: {
        rawText: raw,
        sections,
        metadata: { source: 'linkedin-json' },
      },
    };
  }

  private parseHtmlData(html: string): ParserResult {
    // Strip HTML tags and extract text
    const text = html
      .replace(/<[^>]*>/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const sections: Record<string, string[]> = {};
    let currentSection = 'general';

    const sectionHeaders = ['experience', 'education', 'skills', 'about', 'summary'];
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

    return {
      success: true,
      data: {
        rawText: text,
        sections,
        metadata: { source: 'linkedin-html' },
      },
    };
  }
}
