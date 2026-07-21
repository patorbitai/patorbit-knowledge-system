
import { IsObject } from 'class-validator';

export class CreateCareerPassportVersionDto {
  @IsObject()
  readonly snapshot: Record<string, unknown>;
}
