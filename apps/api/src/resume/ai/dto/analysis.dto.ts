import { ApiProperty } from '@nestjs/swagger';

class ScoreBreakdownDto {
  @ApiProperty()
  completeness: number;
  @ApiProperty()
  atsCompatibility: number;
  @ApiProperty()
  readability: number;
  @ApiProperty()
  professionalTone: number;
  @ApiProperty()
  impact: number;
  @ApiProperty()
  keywordOptimization: number;
}

class SuggestionDto {
  @ApiProperty()
  category: string;
  @ApiProperty()
  severity: 'high' | 'medium' | 'low';
  @ApiProperty()
  explanation: string;
  @ApiProperty()
  recommendation: string;
  @ApiProperty()
  example: string;
}

class AtsReportDto {
  @ApiProperty()
  missingKeywords: string[];
  @ApiProperty()
  formattingIssues: string[];
  @ApiProperty()
  missingSections: string[];
  @ApiProperty()
  lengthIssues: string[];
  @ApiProperty()
  risks: string[];
}

export class ResumeAnalysisDto {
  @ApiProperty()
  overallScore: number;
  @ApiProperty({ type: ScoreBreakdownDto })
  scoreBreakdown: ScoreBreakdownDto;
  @ApiProperty({ type: [SuggestionDto] })
  suggestions: SuggestionDto[];
  @ApiProperty({ type: AtsReportDto })
  atsReport: AtsReportDto;
}
