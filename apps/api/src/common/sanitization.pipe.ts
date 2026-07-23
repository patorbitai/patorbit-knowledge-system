// apps/api/src/common/sanitization.pipe.ts
import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';

/**
 * Strips HTML tags and common XSS patterns from string inputs.
 * Applied globally to all user-supplied data.
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query' && metadata.type !== 'param') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      return this.sanitize(value);
    }
    return value;
  }

  sanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitizedObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitizedObj[key] = this.sanitize(obj[key]);
        }
      }
      return sanitizedObj;
    }
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    return obj;
  }

  private sanitizeString(input: string): string {
    // Strip HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    // Strip script-related event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');
    // Strip javascript: and data: URIs
    sanitized = sanitized.replace(/(javascript|data|vbscript):/gi, '');
    return sanitized;
  }
}
