import { Module } from '@nestjs/common';
import { AiHooksService } from './ai-hooks.service';

@Module({
  providers: [AiHooksService],
  exports: [AiHooksService],
})
export class AiModule {}
