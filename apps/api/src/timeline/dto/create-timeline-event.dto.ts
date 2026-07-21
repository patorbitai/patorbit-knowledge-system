import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateTimelineEventDto {
  @IsString()
  readonly entityType: string;

  @IsString()
  readonly entityId: string;

  @IsString()
  readonly type: string;

  @IsOptional()
  @IsObject()
  readonly data?: Record<string, unknown>;
}