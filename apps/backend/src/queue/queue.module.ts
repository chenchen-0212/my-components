import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Redis } from 'ioredis';
import { DemoController } from './demo.controller.js';
import { DEMO_QUEUE, DemoProcessor } from './demo.processor.js';

// bullmq 6 把 ioredis 当可选 peer，ESM 下它自己 require 不到，必须由我们传入实例
const connection = new Redis({
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB ?? 0),
  maxRetriesPerRequest: null,
});

@Module({
  imports: [
    BullModule.forRoot({ connection }),
    BullModule.registerQueue({ name: DEMO_QUEUE }),
  ],
  controllers: [DemoController],
  providers: [DemoProcessor],
})
export class QueueModule {}
                      