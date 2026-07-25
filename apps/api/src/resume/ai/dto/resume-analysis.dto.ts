// apps/api/src/resume/ai/dto/resume-analysis.dto.ts
export class ResumeAnalysisDto {
  overallScore: number;
  scoreBreakdown: {
    completeness: number;
    atsCompatibility: number;
    readability: number;
    professionalTone: number;
    impact: number;
  };
  strengths: string[];
  areasForImprovement: {
    section: string;
    suggestion: string;
  }[];
  atsKeywords: {
    found: string[];
    missing: string[];
  };
}
