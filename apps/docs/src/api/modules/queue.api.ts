import { http } from "../setup"
import { RequestOptions } from "../type/apiConfig.type"

export default {
  // 发送队列消息
  send_demo_msg(data: any, options?: RequestOptions) {
    return http.post('/jobs',data, options)
  },

  // 轮询队列请求
  poll_queue(id: any, options?: RequestOptions) {
    return http.get(`/jobs/${id}`, {},options)
  }
}
