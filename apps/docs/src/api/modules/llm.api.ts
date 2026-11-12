import { http } from "../setup"
import { RequestOptions } from "../type/apiConfig.type"

export default {
  send_llm_msg(data: any, options?: RequestOptions) {
    return http.post('/llm',data,options, true)
  },

  // rag测试接口
  rag_send_msg(data:any) {
    return http.post('/llm/rag',data)
  },

  // 重建向量索引
  resetIndex() {
    return http.get('/llm/build-index')
  },
}
