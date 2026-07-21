// apps/api/src/knowledge/dto/create-knowledge-edge.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateKnowledgeEdgeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromNodeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toNodeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
