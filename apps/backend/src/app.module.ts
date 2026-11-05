import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module.js';
import { LlmModule } from './llm/llm.module.js';

@Module({
  imports: [QueueModule, LlmModule],
})
export class AppModule {}
