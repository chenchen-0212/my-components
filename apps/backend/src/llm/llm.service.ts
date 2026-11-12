import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';
import { join } from 'path';
import type { Connection } from '@lancedb/lancedb';
import { CircuitBreaker } from './circuit-breaker.js';
import { table } from 'console';
const threshold = 0.45

@Injectable()
export class LlmService {
  private breakerIndex = 0
  private readonly logger = new Logger(LlmService.name);
  // 两个上游分开计数：向量服务挂了不该连累对话，反之亦然
  private readonly embBreakers: CircuitBreaker[];
  private readonly llmBreaker = new CircuitBreaker('对话模型');

  constructor(
    @Inject('LANCE_DB_CONNECTION')
    private readonly Lance_DB: Connection,

    @Inject('LLM_MODAL_CLIENT')
    private readonly LLM_Client: OpenAI,

    @Inject('EMB_MODAL_CLIENTS')
    private readonly EMB_Clients: OpenAI[],

  ) {
    // 每个端点独立熔断，挂了的下次直接跳过
    this.embBreakers = this.EMB_Clients.map(
      (_, i) => new CircuitBreaker(`向量服务#${i + 1}`),
    );
    // 启动期的预热失败不能变成未处理拒绝，否则 Node 直接退出
    this.evaluateRetrieval()
      .then((data)=>this.logger.log(data))
      .catch((err) => this.logger.error(`启动评估失败：${err?.message ?? err}`))
  }

  async evaluateRetrieval() {
    const cases = [
      {
        kind: 'answerable' as const,
        question: '休假已经开始了还能取消吗？',
        expected: ['休假一旦开始，原则上不再适用本取消流程'],
      },
      {
        kind: 'answerable' as const,
        question: '假期计划改了以后，团队的排班信息要怎么保持一致？',
        expected: ['及时更新团队休假记录'],
      },
      {
        kind: 'unanswerable' as const,
        question: '员工婚假可以休几天？',
        expected: [],
      },
    ];

    // 提前校验 Table Index
    await this.embed('q')
    const table = await this.getTable()
    // const DB_NAME = this.breakerIndex === 0 ? 'test' : 'breaker_test'

    // await this.buildIndex(DB_NAME)
    // const table = await this.Lance_DB.openTable(DB_NAME)
    const results = []

    for (const testCase of cases) {
      const instruction =
            'Given a question about employee leave policy, retrieve relevant policy clauses that answer the question';
      const query = `Instruct: ${instruction}\nQuery: ${testCase.question}`;
      const [questionVector] = await this.embed(query);

      const candidates = (await table
        .vectorSearch(questionVector)
        .distanceType('cosine')
        .limit(5)
        .toArray()
      ) as { text: string; _distance: number }[]

      const comparisons = [0.3, 0.45].map((thr) => {
        const matches = candidates.filter((item) => {
          return item._distance <= thr
        })

        const checks = testCase.expected.map((marker) => ({
          marker,
          found: matches.some((item)=> item.text.includes(marker))
        }))

        return {
          thr,
          checks,
          passed: testCase.kind === 'answerable'
            ? checks.every((check) => check.found)
            : matches.length === 0,
          sources: matches.map((item) => ({
            text: item.text,
            distance: item._distance,
          }))
        }
      })

      results.push({
        question: testCase.question,
        comparisons
      })
    }

    return results
  }

  async ask(question: string) {

    // 一次请求把问题和所有段落都向量化，返回顺序与入参一致
    // 查询指令
    const instruction = "Given a question about employee leave policy, retrieve relevant policy clauses that answer the question"
    // 按模板拼接 userQuestion
    const queryWithInstruction = `Instruct: ${instruction}\nQuery: ${question}`;
    const [questionVector] = await this.embed(queryWithInstruction)
    const table = await this.Lance_DB.openTable('test').catch(() => null)

    if (!table) {
      return { answer: '知识库还没建好，请先确认 data/rag.txt', sources: [] }
    }

    const topK = (await (table.search(questionVector) as any)
      .distanceType('cosine')   // 关键：指定余弦距离
      .limit(5)                 // 取最相似的 5 条
      .toArray()) as { text: string; _distance: number }[]

    // console.log('未过滤：',topK.map((i) => `${i.text}: ${i._distance}`))

    const matches = topK.filter((item) => {
      return item._distance <= threshold
    })

    // LanceDB 返回的是余弦距离（越小越相似），不是相似度
    if (topK.length === 0 || matches?.length === 0) {
      return { answer: '没有找到相关资料，暂时无法根据文档回答。', sources: [] };
    }
    const topK_text = matches.map(item => item.text)
    // console.log(matches.map((i) => `${i.text}: ${i._distance}`))
    const response = await this.llmBreaker.run(() =>
      this.LLM_Client.chat.completions.create({
          model: 'deepseek-flash',
          messages: [
            {
              role: 'system',
              content: '请根据参考资料回答；资料不足时说明无法确定。',
            },
            {
              role: 'user',
              content: `参考资料：\n${topK_text.join('\n\n')}\n\n问题：${question}`,
            },
          ],
          temperature: 0,
          // stream: true,
          reasoning_effort: "none",
        }),
    );

        return {
          answer: response.choices[0]?.message.content ?? '模型没有返回内容。',
          sources: topK_text,
        };
  }

  async embed(q: string | string[]) {
    let lastError: unknown = null

    for (let i = 0; i < this.EMB_Clients.length; i++) {
      try {
        this.breakerIndex = i
        return await this.embBreakers[i].run(async () => {
          // this.logger.log(i === 0 ? process.env.EMDEDDING_MODAL as string : process.env.EMDEDDING_FALLBACK_MODAL as string)
          const { data } = await this.EMB_Clients[i].embeddings.create({
            model: i === 0 ? process.env.EMDEDDING_MODAL as string : process.env.EMDEDDING_FALLBACK_MODAL as string,
            input: q,
            encoding_format: 'float',
          });
          // 返回完整向量，余弦相似度必须用全部维度
          return data.map((item) => item.embedding);
        });
      } catch (err) {
        lastError = err
        this.logger.warn(`向量端点 #${i + 1} 失败，尝试下一个：${(err as Error).message}`)
      }
    }

    throw new ServiceUnavailableException('所有向量服务都不可用，请稍后重试', {
      cause: lastError as Error,
    })
  }

  /**
   * 章节 + 目标长度打包：句末对齐、带重叠，超长句退到分号/逗号再切。
   * 每条拼回所属小节标题，避免句子脱离上下文后被别的章节抢走。
   */
  private chunkDocument(raw: string) {
    const TARGET = 180   // 目标字数：中文政策类文本 150~250 较稳，再大语义会被平均掉
    const OVERLAP = 40   // 相邻块重叠字数
    const seg = new Intl.Segmenter('zh-CN', { granularity: 'sentence' })
    const out: { section: string; text: string }[] = []

    for (const section of raw.split(/\r?\n\s*\r?\n/).map((s) => s.trim()).filter(Boolean)) {
      const m = section.match(/^([^：:\n]{1,20})[：:]\s*([\s\S]*)$/)
      const title = m?.[1]?.trim() ?? ''
      const body = (m?.[2] ?? section).trim()

      const parts = [...seg.segment(body)]
        .map((x) => x.segment.trim())
        .filter(Boolean)
        .flatMap((s) => (s.length > TARGET ? s.split(/(?<=[；，、])/).filter(Boolean) : [s]))

      let buf: string[] = []
      const push = () => {
        const content = buf.join('').trim()
        if (content) out.push({ section: title, text: title ? `${title}：${content}` : content })
      }

      for (const part of parts) {
        if (buf.length && buf.join('').length + part.length > TARGET) {
          push()
          // 用上一块尾部做重叠，避免边界处的信息被切断
          const prev = buf
          buf = []
          let len = 0
          for (let i = prev.length - 1; i >= 0 && len < OVERLAP; i--) {
            buf.unshift(prev[i])
            len += prev[i].length
          }
        }
        buf.push(part)
      }
      push()
    }

    return out
  }

  async buildIndex(name = 'test') {
    const filePath = join(process.cwd(), 'data', 'rag.txt')
    const text: string = await readFile(filePath, 'utf-8')

    const chunks = this.chunkDocument(text)

    // 先算完再建表：LanceDB 用首行推断 schema，不能塞 Promise 或嵌套数组
    const rows = await Promise.all(
      chunks.map(async (chunk) => ({
        section: chunk.section,
        text: chunk.text,
        vector: (await this.embed(chunk.text))[0],
      })),
    )

    // 每次启动整表重建，维度跟着真实向量走，不会残留旧的占位 schema
    await this.Lance_DB.createTable(name, rows, { mode: 'overwrite' })
  }

  private async getTable() {
    const DB_NAME = this.breakerIndex === 0 ? 'test' : 'breaker_test'
    let table = null
    try {
      table = await this.Lance_DB.openTable(DB_NAME)
    } catch (e:any) {
      // this.logger.error((e as Error))
      if (e?.code === 'GenericFailure') {
        await this.buildIndex(DB_NAME)
        table = await this.Lance_DB.openTable(DB_NAME)
      }
    }
    if (!table) {
      throw new Error('获取向量库失败, buildIndex table 为 null',)
    }

    this.logger.log(`使用向量库：${DB_NAME}`)
    return table
  }


}
