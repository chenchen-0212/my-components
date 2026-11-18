import { Module } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import { LlmController } from './llm.controller.js';
import * as lancedb from '@lancedb/lancedb';
import { join } from 'path';
import OpenAI from 'openai';

const LANCE_DB_PATH  = join(process.cwd(), 'data', process.env.LANCE_DB_NAME as string)

// 主端点 + 可选备用端点。备用端点必须跑同一个 embedding 模型，
// 不同模型的向量空间不可比，混用会让检索结果完全错乱。
const EMB_ENDPOINTS = [
  { baseURL: 'https://api.siliconflow.cn/v1', apiKey: process.env.EMB_API_KEY },
  ...(process.env.EMB_FALLBACK_API_KEY
    ? [{
        baseURL: process.env.EMB_FALLBACK_BASE_URL ?? 'https://api.siliconflow.cn/v1',
        apiKey: process.env.EMB_FALLBACK_API_KEY,
      }]
    : []),
]

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
      provide: 'EMB_MODAL_CLIENTS',
      useFactory: () => EMB_ENDPOINTS.map(
        (config) => new OpenAI({ ...config, timeout: 20_000, maxRetries: 1 }),
      ),
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
