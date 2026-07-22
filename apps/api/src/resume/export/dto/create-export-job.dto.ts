import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum ExportFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  JSON = 'json',
}

export class CreateExportJobDto {
  @IsString()
  @IsNotEmpty()
  resumeId: string;

  @IsEnum(ExportFormat)
  @IsNotEmpty()
  format: ExportFormat;
}
