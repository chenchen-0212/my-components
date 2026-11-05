import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { LlmController } from './llm.controller.js';

@Module({
  controllers: [LlmController],
  providers: [LlmService],
})
export class LlmModule {}
