# BullMQ 队列学习计划

以 `apps/backend/src/queue/` 下的 demo 代码为起点，按「先看懂 → 动手改 → 再补概念」的顺序推进。
每个实验都能在当前代码上直接改，不需要新建项目。

- [ ] 阶段一：看懂现有代码
- [ ] 阶段二：五个实验
- [ ] 阶段三：概念进阶
- [ ] 阶段四：换成一个真实需求

---

## 一、先看清这套东西的角色

```
POST /jobs  →  Queue.add(...)   →   Redis（任务数据全部存在这里）
                                        ↑ 拉取
                                  Worker（@Processor → process()）
                                        ↓ 写回结果
GET /jobs/:id → Queue.getJob → Redis
```

三个新手最容易漏的认知：

1. **Controller 和 Worker 是两个独立的东西。**
   Controller 只负责往 Redis 塞一张纸条，`process()` 在 Worker 里跑，两者之间没有直接调用。
   `POST /jobs` 能立刻返回 `{ id }`，正是因为这个原因。
2. **任务的生命周期是一串状态。**
   `waiting → active → completed / failed`，另有 `delayed`、`paused`。
   `GET /jobs/:id` 返回的 `state` 就是这一串里的某一个。
3. **进程死了任务不会丢，但会卡在 `active`。**
   任务被 Worker 领走后进程被杀，锁不会立刻释放，要等 `lockDuration`（默认 30s）过期才被判定为
   stalled 并重新入队。看到任务一直 active，先想这件事。

涉及的文件：

| 文件 | 职责 |
| --- | --- |
| `src/queue/queue.module.ts` | Redis 连接、注册队列名 |
| `src/queue/demo.processor.ts` | 消费者：`process()` 里写真正的业务 |
| `src/queue/demo.controller.ts` | 生产者：`queue.add()` 投递任务、查状态 |

---

## 二、五个可以立刻做的实验

### 实验 1：让任务失败，看重试

```ts
async process(job: Job<DemoJob>) {
  if (job.attemptsMade < 2) throw new Error('假装失败');
  return { echo: job.data.message };
}
```

反复 `GET /jobs/:id`，观察 `state` 在 `failed` 和 `waiting` 之间抖动。

要点：

- `attempts: 3` 是**总共**尝试 3 次（含第一次），不是「重试 3 次」
- `backoff: { type: 'fixed', delay: 1000 }` 是固定 1s，换成 `exponential` 会指数增长
- 失败后 `failedReason` 才有值

### 实验 2：并发

```ts
@Processor(DEMO_QUEUE, { concurrency: 4 })
```

连续点 4 次「添加任务」，观察 4 个任务同时 active。

- 默认 `concurrency: 1`，一个 Worker 一次只处理一个任务
- 这就是 `process()` 里加了 5s sleep 之后，第二个任务要排队的原因
- 并发不是越大越好：IO 密集可以调大，CPU 密集别超过核数

### 实验 3：延迟与定时

```ts
// 10 秒后才可被消费，此时 state 是 delayed
await this.queue.add('demo', { message }, { delay: 10_000 });

// 每 5 秒跑一次
await this.queue.add('demo', { message }, { repeat: { every: 5_000 } });
```

`repeat` 是 BullMQ 里最容易踩坑的功能（重复任务的 jobId 规则、如何删除重复任务），
单独试一次再决定要不要用。

### 实验 4：清理，不然 Redis 会一直涨

```ts
await this.queue.add('demo', { message }, {
  attempts: 3,
  backoff: { type: 'fixed', delay: 1000 },
  removeOnComplete: { count: 100 }, // 只保留最近 100 个完成的任务
  removeOnFail: { count: 500 },
});
```

跑一阵子后执行 `redis-cli --scan --pattern "bull:demo:*"` 看 key 数量，再对比加上这两行之后的差别。

> 这是个人项目里「Redis 内存莫名暴涨」最常见的原因。

### 实验 5：用事件代替轮询

前端目前是 1s 一次的 `setInterval` 轮询。Worker 侧可以直接发事件（`WorkerHost` 已提供钩子）：

```ts
import { OnWorkerEvent } from '@nestjs/bullmq';

@OnWorkerEvent('completed')
onCompleted(job: Job) {
  this.logger.log(`done ${job.id}`);
}

@OnWorkerEvent('failed')
onFailed(job: Job, err: Error) {
  this.logger.error(`fail ${job.id}: ${err.message}`);
}
```

需要把结果实时推给前端，再往上就是 SSE / WebSocket。

---

## 三、概念进阶的顺序（别跳）

1. **幂等性**
   BullMQ 是「至少一次」投递，进程崩溃会导致任务重跑。`process()` 必须可重复执行
   （例如「发邮件」要先查是否已发）。
2. **锁与 stalled**
   `lockDuration`、`stalledInterval`、任务卡在 active 的原因、`job.extendLock()` 什么时候用。
3. **生产者 / 消费者分离**
   `Queue` 可以只在 API 进程里，Worker 另起一个进程。多个 Worker 抢同一个队列是正常扩容方式，
   但不要把同一个任务重复 `add`。
4. **失败处理策略**
   失败之后是人工 `job.retry()`、进「死信队列」（另一个 queue 存失败任务），还是定时任务扫描。
5. **限流**
   `limiter: { max: 10, duration: 1000 }`，防止打爆下游第三方 API。
6. **可观测性**
   装 `bull-board`（`@bull-board/nestjs`）得到网页面板，能直接看每个队列的
   waiting / active / failed 和失败原因，比 `redis-cli` 直观得多。建议作为下一步。

---

## 四、真正能学到东西的做法

把 demo 换成一件真事，代码结构完全不用动，只改 `process()` 的内容：

| 练习 | 练到什么 |
| --- | --- |
| 图片缩略图（`sharp`，任务参数传文件路径） | 队列最经典的用法：耗时任务异步化 |
| 模拟发邮件（假 sleep + 随机失败） | 重试、退避、失败补偿 |
| 抓取网页（传 URL，fetch + 存库） | 限流、超时、重试三个真实问题 |

做第二个的时候会自然想明白：**任务参数要尽量小，只传 ID，数据放数据库。**

---

## 五、资料（按性价比排序）

1. `docs.bullmq.io` 的 Guide 里只看三页：**Jobs**、**Workers**、**Retrying failing jobs**
2. NestJS 官方文档 **Techniques → Queues**（当前代码的出处）
3. Redis 数据结构只看 `LIST` 和 `ZSET`：
   BullMQ 的 waiting / active 是 list，completed / failed 是 zset
