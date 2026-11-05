import { BadRequestException, Body, Controller, Query, Sse, Post, Res } from '@nestjs/common';
import { LlmService } from './llm.service.js';
import OpenAI from 'openai';
import { Observable } from 'rxjs';
import {Response} from 'express'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {

  }

  @Sse()
  test(@Query('msg') message: any): Observable<{ data: string }> {
    console.log('有请求到了',message)
    return new Observable((s) => {
      const run = async () => {
        try {
          const stream = await openai.chat.completions.create({
            model: 'deepseek-flash',
            temperature: 1,
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: message || '你好' },
            ],
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

    try{
      const message = [
        ...body.history,
        { role: 'user', content: body.message }
      ]
      if (!message) throw new BadRequestException('message 必须是 1..200 个字符的字符串')
      const completion   = await openai.chat.completions.create({
        model: "deepseek-flash",
        temperature: 1,
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
      res.end()
    } catch (e) {
      res.write(`data: ${JSON.stringify({error:'生成失败'})}\n\n`)
      res.end()
    }

    // return {msg:completion}
  }


}
