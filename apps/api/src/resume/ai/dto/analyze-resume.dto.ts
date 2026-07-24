import { IsNotEmpty, IsObject } from 'class-validator';

export class AnalyzeResumeDto {
  @IsObject()
  @IsNotEmpty()
  resume: Record<string, unknown>;
}
