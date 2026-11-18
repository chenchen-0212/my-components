import { http } from "../setup"
import { RequestOptions } from "../type/apiConfig.type"

export default {
  send_llm_msg(data: any, options?: RequestOptions) {
    return http.post('/llm',data,options, true)
  },

  // rag测试接口（SSE 流式，返回原始 Response）
  rag_send_msg(data:any, options?: RequestOptions) {
    return http.post('/llm/rag',data,options,true)
  },

  // 重建向量索引
  resetIndex() {
    return http.get('/llm/build-index')
  },
}
