import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiHooksService {
  private readonly logger = new Logger(AiHooksService.name);

  /**
   * Extension point: Improve a professional summary using AI.
   * Placeholder — returns the input unchanged.
   */
  async improveSummary(summary: string): Promise<string> {
    this.logger.debug('improveSummary called (placeholder)');
    return summary;
  }

  /**
   * Extension point: Improve a single bullet point using AI.
   * Placeholder — returns the input unchanged.
   */
  async improveBullet(text: string): Promise<string> {
    this.logger.debug('improveBullet called (placeholder)');
    return text;
  }

  /**
   * Extension point: Suggest skills based on a job title or experience.
   * Placeholder — returns empty array.
   */
  async suggestSkills(title: string): Promise<string[]> {
    this.logger.debug(`suggestSkills called for "${title}" (placeholder)`);
    return [];
  }

  /**
   * Extension point: Optimize resume content for ATS parsing.
   * Placeholder — returns the content unchanged.
   */
  async optimizeATS(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.logger.debug('optimizeATS called (placeholder)');
    return content;
  }

  /**
   * Extension point: Perform grammar review on text.
   * Placeholder — returns no suggestions.
   */
  async grammarReview(text: string): Promise<Array<{ start: number; end: number; suggestion: string }>> {
    this.logger.debug('grammarReview called (placeholder)');
    return [];
  }
}
