import { Injectable } from '@nestjs/common';

import { DocxParser } from './parsers/docx-parser';
import { JsonParser, type ParserResult } from './parsers/json-parser';
import { PdfParser } from './parsers/pdf-parser';

interface ResumeParser {
  parse(data: Buffer): Promise<ParserResult>;
}

@Injectable()
export class ResumeParserService {
  private parsers: Map<string, ResumeParser> = new Map();

  constructor() {
    this.register('pdf', new PdfParser());
    this.register('docx', new DocxParser());
    this.register('json', new JsonParser());
  }

  register(type: string, parser: ResumeParser): void {
    this.parsers.set(type, parser);
  }

  async parse(type: string, data: Buffer): Promise<ParserResult> {
    const parser = this.parsers.get(type);
    if (!parser) {
      return { success: false, error: `No parser found for type: ${type}` };
    }
    try {
      return await parser.parse(data);
    } catch (error) {
      return { success: false, error: `Failed to parse ${type}: ${(error as Error).message}` };
    }
  }
}
