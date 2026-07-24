// apps/api/src/cover-letter/dto/create-cover-letter.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCoverLetterDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}
