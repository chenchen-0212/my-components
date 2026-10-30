import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

export const DEMO_QUEUE = 'demo';

export interface DemoJob {
  message: string;
}

@Processor(DEMO_QUEUE)
export class DemoProcessor extends WorkerHost {
  private readonly logger = new Logger(DemoProcessor.name);

  async process(job: Job<DemoJob>) {
    this.logger.log(`job ${job.id}: ${job.data.message}`);
    // if (job.attemptsMade < 3) throw new Error('假装失败'); //测试失败
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { echo: job.data.message, at: new Date().toISOString() };
  }
}
