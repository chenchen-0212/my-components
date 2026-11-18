import { ServiceUnavailableException } from '@nestjs/common';

/**
 * 极简熔断器：连续失败达到阈值就短路，冷却期内直接抛错不再打接口；
 * 冷却结束后放一个请求试探（半开），成功即恢复。
 */
export class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;

  constructor(
    private readonly name: string,
    private readonly threshold = 3,
    private readonly cooldownMs = 30_000,
  ) {}

  get state(): 'closed' | 'open' {
    return Date.now() < this.openUntil ? 'open' : 'closed';
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new ServiceUnavailableException(`${this.name} 服务熔断中，请稍后重试`);
    }

    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (err) {
      if (++this.failures >= this.threshold) {
        this.openUntil = Date.now() + this.cooldownMs;
        this.failures = 0;
      }
      throw err;
    }
  }
}
