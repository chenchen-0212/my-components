import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import OpenAI from 'openai';
import { join } from 'path';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const embeddingClient = new OpenAI({
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: process.env.EMB_API_KEY,
});

@Injectable()
export class LlmService {
  async ask(question: string) {
    const filePath = join(process.cwd(), 'data', 'rag.txt')
    const text: string = await readFile(filePath, 'utf-8')

    const chunks = text
      .split(/\r?\n\s*\r?\n/)
      .map((chunk)=>chunk.trim())
      .filter(Boolean)

    // 一次请求把问题和所有段落都向量化，返回顺序与入参一致
    const [questionVector, ...docVectors] = await this.embed([question, ...chunks])

    const ranked = chunks
      .map((text, i) => ({
        text,
        score: this.cosineSimilarity(questionVector, docVectors[i]),
      }))
      .sort((a, b) => b.score - a.score)

    const topK = ranked.slice(0, 2)

    // const keyWords = ['申请', '变更', '取消']
    // const matchKeyWords = keyWords.filter((word) => question.includes(word))
    // const matchedChunks = chunks.filter((chunk) => {
    //   return matchKeyWords.some((word) => chunk.includes(word))
    // })


    console.log(ranked)

    // if (matchedChunks.length === 0) {
    //   return { answer: '没有找到相关资料，暂时无法根据文档回答。', sources: [] };
    // }

    const response = await openai.chat.completions.create({
          model: 'deepseek-flash',
          messages: [
            {
              role: 'system',
              content: '请根据参考资料回答；资料不足时说明无法确定。',
            },
            {
              role: 'user',
              content: `参考资料：\n${topK.map((item) => item.text).join('\n\n')}\n\n问题：${question}`,
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
    const { data } = await embeddingClient.embeddings.create({
      model: 'Qwen/Qwen3-Embedding-4B',
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
}
