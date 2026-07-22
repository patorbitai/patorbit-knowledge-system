
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsOptional()
  templateId?: string;
}
