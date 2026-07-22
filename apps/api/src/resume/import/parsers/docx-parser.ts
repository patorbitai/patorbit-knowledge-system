import { Injectable } from '@nestjs/common';
import { ParserResult } from './json-parser';

/**
 * DOCX parser placeholder.
 * Actual DOCX extraction will be implemented when mammoth or a similar library is integrated.
 */
@Injectable()
export class DocxParser {
  async parse(_storageKey: string): Promise<ParserResult> {
    // TODO: Implement DOCX extraction using mammoth or docx library
    return {
      success: false,
      error: 'DOCX parsing is not yet implemented',
    };
  }
}
