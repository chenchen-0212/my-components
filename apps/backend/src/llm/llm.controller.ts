import { BadRequestException, Body, Controller, Query, Sse, Get, Post, Res, Logger } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import {Response} from 'express'
import { knowledgeBase,fakeEmbedding,cosineSimilarity } from './RAG.test.js';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

@Controller('llm')
export class LlmController {
  private readonly logger = new Logger(LlmController.name);

  constructor(
    private readonly llmService: LlmService
  ) { }

  @Sse()
  test(@Query('msg') message: any): Observable<{ data: string }> {
    console.log('有请求到了',message)
    return new Observable((s) => {
      const run = async () => {
        try {
          const stream = await openai.chat.completions.create({
            model: 'deepseek-flash',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: message || '你好' },
            ],
            temperature: 1,
            stream: true,
            reasoning_effort: "none",
          });

          // 4. 遍历流数据
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Nest 的 SSE 只认 data 字段，别的字段会被直接丢掉
              s.next({ data: content });
            }
          }

          // 5. 发结束符，前端据此关闭连接（EventSource 收到断开会自动重连，必须自己关）
          s.next({ data: '[DONE]' });
          s.complete();
        } catch (error) {
          s.next({ data: '[ERROR] ' + (error as Error).message });
          s.complete();
        }
      };

      // 执行异步任务
      run();
    })
  }

  @Post()
  async testStream(@Body() body: any, @Res() res:Response){
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // 1. 把用户的问题向量化
      const questionVector = fakeEmbedding(body.message);

      // 2. 检索：计算问题与知识库里每一句话的相似度
      const scoredDocs = knowledgeBase.map(doc => {
        const docVector = fakeEmbedding(doc);
        return {
          text: doc,
          score: cosineSimilarity(questionVector, docVector)
        };
      });

      // 3. 排序并取相似度最高的前 2 条（Top-K）
      scoredDocs.sort((a, b) => b.score - a.score);
      const topKDocs = scoredDocs.slice(0, 2).map(item => item.text);

      // 4. 构造增强版 Prompt（RAG 的核心灵魂）
      const contextText = topKDocs.join('\n');


      // ==================  分隔线  ==========================
      const message = [
        {
          role: 'system',
         content: `你是一个公司财务助手。请严格根据以下参考资料回答用户的问题。
            如果参考资料中没有相关信息，请直接回答“根据现有规定，我无法回答该问题”，绝对不要编造。
            【参考资料】：${contextText}`
        },
        ...body.history,
        { role: 'user', content: body.message }
      ]
      if (!message) throw new BadRequestException('message 必须是 1..200 个字符的字符串')
      const completion   = await openai.chat.completions.create({
        model: "deepseek-flash",
        temperature: 0,
        messages: message,
        stream: true,
        reasoning_effort: "none",
      });

      let fullMsg = ''
      for await (const chunk of completion) {
        const c = chunk.choices[0]?.delta?.content
        if (c) {
          fullMsg += c
          res.write(`data: ${JSON.stringify({c})}\n\n`)
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, fullMsg })}\n\n`)
      this.logger.log(`
        LLM data: ${JSON.stringify({ done: true, fullMsg })}
        CHECK docx: ${topKDocs}
        `)
      res.end()
    } catch (e) {
      res.write(`data: ${JSON.stringify({error:'生成失败'})}\n\n`)
      res.end()
    }

    // return {msg:completion}
  }

  @Post('/rag')
  async ragTest(@Body() body: any) {
   return await this.llmService.ask(body?.msg)
  }

  @Get('lance-test')
  testLanceDb() {
    // return this.llmService.testLanceDb();
    return '测试 lance'
  }

}
