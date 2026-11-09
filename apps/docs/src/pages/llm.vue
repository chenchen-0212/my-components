<template>
  <div>
    <ElInput
      v-model="msg"
    />
      <!-- <ElButton v-loading="loading"   @click="chatMextMsg">发送</ElButton> -->
      <ElButton v-loading="loading"   @click="sendMsg">发送</ElButton>
    <pre class="msg_pennel">{{ pre }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElInput } from 'element-plus';
import { ref, onUnmounted } from 'vue';
import llmApi from '../api/modules/llm.api';


definePage({
  meta: {
    title:'LLM测试', order: 12
  }
})

const url = '/api/llm'
const method = 'POST'

const msg = ref('')
const pre = ref('')
let es: EventSource | null = null
const loading = ref<boolean>(false)

const history:any[] = []

// 单条信息
const sendMsg = async () => {
  const resp = await llmApi.rag_send_msg({
    msg: msg.value
  })

  pre.value = resp
}

// 流信息
const sendStreamMsg = () => {
  es?.close()
  pre.value = ''
  es = new EventSource(url + `?msg=${encodeURIComponent(msg.value)}`)
  es.onmessage = (e) => {
    // e.data 是字符串，多行内容浏览器已按 SSE 规则拼好
    if (e.data === '[DONE]') {
      es?.close()
      return
    }
    pre.value += e.data
  }
}

// 连续对话流
async function chatNextMsg() {
  loading.value = true
  // const response = await fetch('/api/llm', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ history: history, message: msg.value })
  // });

  const data = { history: history, message: msg.value }

  try {
    const response = await llmApi.send_llm_msg(data)

    // console.log(response)

    const reader = response.body?.getReader()
    const decoder = new TextDecoder();
    // let aiReply = '';
    pre.value += '\n'

    while (true) {
      const { done, value } = await reader?.read() || {};
      if (done) break;

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.c) {
            pre.value += data.c;
            // 渲染到页面（打字机效果）
          }
          // console.log(data?.done)
          if (data?.done) {
            // 一次对话结束，把用户的问题和 AI 的回答存入历史
            history.push({ role: 'user', content: msg.value });
            history.push({ role: 'assistant', content: data?.fullMsg });
          }
        }
      }
    }
  } catch (e) {
    console.error('生成对话失败',e)
  } finally {
    loading.value = false
  }
}

onUnmounted(() => es?.close())
</script>

<style scoped>
.msg_pennel{
  background-color: #cccccc;
  width: 100%;
  height: fit-content;
  white-space: pre-wrap;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
