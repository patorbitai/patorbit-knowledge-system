// apps/api/src/knowledge/knowledge.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from "@patorbit/database";

import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [DatabaseModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
