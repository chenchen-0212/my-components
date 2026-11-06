import { nodeOps } from "vue"
import { http } from "../setup"
import { RequestOptions } from "../type/apiConfig.type"

export default {
  send_llm_msg(data: any, options?: RequestOptions) {
    return http.post('/llm',data,options, true)
  }
}
