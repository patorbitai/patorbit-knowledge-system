import { Injectable } from '@nestjs/common';

import { type ParserResult } from './json-parser';

/**
 * LinkedIn data adapter placeholder.
 * Will transform LinkedIn export data into the internal resume format
 * when LinkedIn API integration is implemented.
 */
@Injectable()
export class LinkedinParser {
  async parse(_rawData: string): Promise<ParserResult> {
    // TODO: Transform LinkedIn profile data into internal resume format
    return {
      success: false,
      error: 'LinkedIn import is not yet implemented',
    };
  }
}
