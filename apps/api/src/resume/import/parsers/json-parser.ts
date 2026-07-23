import { Injectable } from '@nestjs/common';

import { type ImportResultDto } from '../dto/import-result.dto';

export interface ParserResult {
  success: boolean;
  data?: ImportResultDto;
  error?: string;
}

@Injectable()
export class JsonParser {
  async parse(data: Buffer): Promise<ParserResult> {
    try {
      const rawJson = data.toString('utf-8');
      const parsed = JSON.parse(rawJson);

      const result: ImportResultDto = {
        title: parsed.title || 'Imported Resume',
        sections: Array.isArray(parsed.sections)
          ? parsed.sections.map((section: any) => ({
              type: section.type || 'CUSTOM',
              title: section.title,
              content: section.content || {},
            }))
          : [],
      };

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `Failed to parse JSON: ${(error as Error).message}` };
    }
  }
}
