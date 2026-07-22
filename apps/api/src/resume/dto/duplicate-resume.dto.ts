
import { IsOptional, IsString } from 'class-validator';

export class DuplicateResumeDto {
  @IsString()
  @IsOptional()
  title?: string;
}
