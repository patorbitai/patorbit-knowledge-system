import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';

@Injectable()
export class AiHooksService {
  private readonly logger = new Logger(AiHooksService.name);
  private readonly apiKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('CLAUDE_API_KEY');
  }

  /**
   * Improve a professional summary using Claude AI.
   */
  async improveSummary(summary: string): Promise<string> {
    if (!this.apiKey) {
      this.logger.warn('CLAUDE_API_KEY not set — returning summary unchanged');
      return summary;
    }

    try {
      const prompt = `Improve this professional summary for a resume. Make it concise, impactful, and ATS-friendly:\n\n${summary}`;
      return await this.callClaude(prompt, summary);
    } catch (error) {
      this.logger.error(`improveSummary failed: ${(error as Error).message}`);
      return summary;
    }
  }

  /**
   * Improve a single bullet point using Claude AI.
   */
  async improveBullet(text: string): Promise<string> {
    if (!this.apiKey) {
      return text;
    }

    try {
      const prompt = `Rewrite this resume bullet point to be more impactful, using strong action verbs and quantifiable results:\n\n${text}`;
      return await this.callClaude(prompt, text);
    } catch (error) {
      this.logger.error(`improveBullet failed: ${(error as Error).message}`);
      return text;
    }
  }

  /**
   * Suggest skills based on a job title or experience using Claude AI.
   */
  async suggestSkills(title: string): Promise<string[]> {
    if (!this.apiKey) {
      this.logger.warn('CLAUDE_API_KEY not set — returning empty skills');
      return [];
    }

    try {
      const prompt = `Given the job title "${title}", suggest 10 relevant skills as a comma-separated list. Return only the skills, nothing else.`;
      const result = await this.callClaude(prompt, '');
      return result
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
    } catch (error) {
      this.logger.error(`suggestSkills failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Optimize resume content for ATS parsing.
   */
  async optimizeATS(content: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.apiKey) {
      return content;
    }

    try {
      const prompt = `Optimize this resume content for ATS (Applicant Tracking System) parsing. Ensure standard section headers, keyword-rich descriptions, and clean formatting:\n\n${JSON.stringify(content, null, 2)}\n\nReturn the optimized JSON with the same structure.`;
      const result = await this.callClaude(prompt, JSON.stringify(content));
      try {
        return JSON.parse(result);
      } catch {
        return content;
      }
    } catch (error) {
      this.logger.error(`optimizeATS failed: ${(error as Error).message}`);
      return content;
    }
  }

  /**
   * Perform grammar review on text using Claude AI.
   */
  async grammarReview(
    text: string,
  ): Promise<Array<{ start: number; end: number; suggestion: string }>> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const prompt = `Review this text for grammar, spelling, and style issues. Return a JSON array of corrections, each with "start" (index), "end" (index), and "suggestion" (replacement text). If no issues, return empty array.\n\nText: "${text}"`;
      const result = await this.callClaude(prompt, '[]');
      try {
        return JSON.parse(result);
      } catch {
        return [];
      }
    } catch (error) {
      this.logger.error(`grammarReview failed: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Analyze a full resume and return a structured analysis.
   */
  async analyzeResume(resume: Record<string, unknown>): Promise<ResumeAnalysisDto> {
    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY not set');
    }

    const prompt = `
      You are an expert resume reviewer and career coach.
      Analyze the following resume JSON and provide a structured analysis.

      Resume JSON:
      ${JSON.stringify(resume, null, 2)}

      Your response MUST be a single valid JSON object matching this exact structure:
      {
        "overallScore": number, // 0-100
        "scoreBreakdown": {
          "completeness": number, // 0-100
          "atsCompatibility": number, // 0-100
          "readability": number, // 0-100
          "professionalTone": number, // 0-100
          "impact": number, // 0-100
          "keywordOptimization": number // 0-100
        },
        "suggestions": [
          {
            "category": string, // e.g., "Summary", "Work Experience"
            "severity": "high" | "medium" | "low",
            "explanation": string,
            "recommendation": string,
            "example": string // A "before" and "after" example
          }
        ],
        "atsReport": {
          "missingKeywords": string[],
          "formattingIssues": string[],
          "missingSections": string[],
          "lengthIssues": string[],
          "risks": string[]
        }
      }
    `;

    try {
      const result = await this.callClaude(prompt, '{}');
      return JSON.parse(result) as ResumeAnalysisDto;
    } catch (error) {
      this.logger.error(`analyzeResume failed: ${(error as Error).message}`);
      throw new Error('Failed to analyze resume');
    }
  }

  private async callClaude(prompt: string, fallback: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-20250723',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { content: Array<{ text: string }> };
    return data.content?.[0]?.text ?? fallback;
  }
}
