import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { DEMO_QUEUE, DemoJob } from './demo.processor.js';

@Controller('jobs')
export class DemoController {
  constructor(@InjectQueue(DEMO_QUEUE) private readonly queue: Queue<DemoJob>) {}

  @Post()
  async add(@Body() body: { message?: unknown }) {
    const message = body?.message ?? 'hello';
    if (typeof message !== 'string' || message.length === 0 || message.length > 200) {
      throw new BadRequestException('message 必须是 1..200 个字符的字符串');
    }

    const job = await this.queue.add('demo', { message }, {
      attempts: 3,
      backoff: { type: 'fixed', delay: 1000 },
    });
    return { id: job.id };
  }

  @Get(':id')
  async status(@Param('id') id: string) {
    const job = await this.queue.getJob(id);
    if (!job) {
      throw new NotFoundException(`job ${id} 不存在`);
    }

    return {
      id,
      state: await job.getState(),
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    };
  }
}
