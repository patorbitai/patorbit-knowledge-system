import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { AiHooksService } from './ai-hooks.service';

@Module({
  controllers: [AiController],
  providers: [AiHooksService],
  exports: [AiHooksService],
})
export class AiModule {}
