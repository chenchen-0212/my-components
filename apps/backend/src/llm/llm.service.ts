import { Inject, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';
import { join } from 'path';
import type { Connection } from '@lancedb/lancedb';
const threshold = 0.45

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  constructor(
    @Inject('LANCE_DB_CONNECTION')
    private readonly Lance_DB: Connection,

    @Inject('LLM_MODAL_CLIENT')
    private readonly LLM_Client: OpenAI,

    @Inject('EMB_MODAL_CLIENT')
    private readonly EMB_Client: OpenAI,

  ) {
    this.testRAG().catch((e)=>this.logger.error(e))
  }


  async ask(question: string) {

    // 一次请求把问题和所有段落都向量化，返回顺序与入参一致
    const [questionVector] = await this.embed(question)
    const table = await this.Lance_DB.openTable('test').catch(() => null)

    if (!table) {
      return { answer: '知识库还没建好，请先确认 data/rag.txt', sources: [] }
    }

    const topK = (await (table.search(questionVector) as any)
      .distanceType('cosine')   // 关键：指定余弦距离
      .limit(5)                 // 取最相似的 5 条
      .toArray()) as { text: string; _distance: number }[]

    // LanceDB 返回的是余弦距离（越小越相似），不是相似度
    if (topK.length === 0 || topK[0]._distance > threshold) {
      return { answer: '没有找到相关资料，暂时无法根据文档回答。', sources: [] };
    }

    console.log(topK.map((i) => i.text))
    const response = await this.LLM_Client.chat.completions.create({
          model: 'deepseek-flash',
          messages: [
            {
              role: 'system',
              content: '请根据参考资料回答；资料不足时说明无法确定。',
            },
            {
              role: 'user',
              content: `参考资料：\n${topK.map(item => item.text).join('\n\n')}\n\n问题：${question}`,
            },
          ],
          temperature: 0,
          // stream: true,
          reasoning_effort: "none",
        });

        return {
          answer: response.choices[0]?.message.content ?? '模型没有返回内容。',
          sources: topK.map((item) => item.text),
        };
  }

  async embed(q: string | string[]) {
    const { data } = await this.EMB_Client.embeddings.create({
      model: process.env.EMDEDDING_MODAL as string,
      input: q,
      encoding_format: 'float',
    });

    // 返回完整向量，余弦相似度必须用全部维度
    return data.map((item) => item.embedding);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('向量维度不一致，无法比较');
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      throw new Error('零向量无法计算余弦相似度');
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
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

  private async testRAG() {
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
    await this.Lance_DB.createTable('test', rows, { mode: 'overwrite' })
  }




}
