import { Injectable } from '@nestjs/common';

import { type ParserResult } from './json-parser';

/**
 * PDF parser placeholder.
 * Actual PDF extraction will be implemented when a PDF parsing library is integrated.
 */
@Injectable()
export class PdfParser {
  async parse(_storageKey: string): Promise<ParserResult> {
    // TODO: Implement PDF text extraction using pdf-parse or similar library
    return {
      success: false,
      error: 'PDF parsing is not yet implemented',
    };
  }
}
