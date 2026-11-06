// src/api/setup.ts
import {
  requestInterceptors,
  responseInterceptors,
  errorInterceptors,
} from './index';
import RequestError from '../error';

// —— ① 请求拦截：加时间戳 + 灰度标记 ——
requestInterceptors.use((config) => {
  config.headers['X-Timestamp'] = String(Date.now());
  config.headers['X-Env'] = 'web';
  return config;
});

// —— ② 响应拦截：拆业务信封 ——
responseInterceptors.use((res: any) => {
  // 后端约定：{ code: 0, data: {...}, message: 'ok' }
  // if (res && typeof res === 'object' && 'code' in res) {
  //   if (res.code !== 0) {
  //     throw new RequestError(res.message ?? '业务错误', 200, res);
  //   }
  //   return res.data;
  // }
  return res;
});

// —— ③ HTTP 错误拦截：统一提示 ——
errorInterceptors.use((err, ctx) => {
  if (err instanceof RequestError) {
    if (err.status === 401) {
      // 跳登录
      // location.href = '/login';
    } else if (err.status === 403) {
      // 无权限
    } else if (ctx.response) {
      // 统一 toast
      // toast.error(err.message);
    }
  }
});

// —— ④ 网络错误拦截：上报 ——
errorInterceptors.use((err, ctx) => {
  if (!ctx.response && err instanceof Error) {
    // Sentry.captureException(err);
  }
});
