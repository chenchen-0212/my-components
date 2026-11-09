import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { LlmController } from './llm.controller.js';
import * as lancedb from '@lancedb/lancedb';
import { join } from 'path';
import OpenAI from 'openai';

const LANCE_DB_PATH  = join(process.cwd(), 'data', process.env.LANCE_DB_NAME as string)

@Module({
  controllers: [LlmController],
  providers: [
    {
      provide: 'LANCE_DB_CONNECTION',
      useFactory: async () => {
        const db = await lancedb.connect(LANCE_DB_PATH);
        return db
      },
    },
    {
      provide: 'EMB_MODAL_CLIENT',
      useFactory: () => {
        return new OpenAI({
          baseURL: 'https://api.siliconflow.cn/v1',
          apiKey: process.env.EMB_API_KEY,
        })
      }
    },
    {
      provide: 'LLM_MODAL_CLIENT',
      useFactory: () => {
        return new OpenAI({
          baseURL: 'https://api.deepseek.com',
          apiKey: process.env.DEEPSEEK_API_KEY,
        })
      }
    },
    LlmService
  ],
})
export class LlmModule {}
