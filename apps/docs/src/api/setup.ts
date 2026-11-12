import RequestError from "./error"
import { QueryParams, RequestOptions } from './type/apiConfig.type'
import type { InternalRequestConfig } from './type/interceptors.type'
import {
  requestInterceptors,
  responseInterceptors,
  errorInterceptors,
} from './Interceptor'

const baseUrl = import.meta.env.VITE_BASE_URL
const DEFAULT_TIMEOUT = 10000

async function request<T = unknown>(url: string, option: RequestOptions = {}, isStream: boolean = false):Promise<T> {
  // 提取配置项
  const {
    method = 'GET',
    params,
    data,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
    ...rest
  } = option

  // 默认请求地址
  let fetchUrl = baseUrl + url

  // GET 请求拼接地址 QueryParams
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([_,v])=>v !== undefined && v!== null)
        .map(([k,v])=>[k,String(v)])
    ).toString()

    // 拼接 Query
    if (qs) {
      fetchUrl += (fetchUrl.includes('?') ? "&" : "?") + encodeURIComponent(qs)
    }
  }

  // 设置默认请求头
  const filterHeader: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // token 获取
  const token = localStorage.getItem('accessToken')
  if (token) filterHeader.Authorization = `Bearer ${token}`

  // 请求体设置
  let body: BodyInit | undefined
  // 如果 data 是表单数据直接放入 body，否则在 data 非空的时候 放入 body
  if (data instanceof FormData) {
    body = data
    delete filterHeader['Content-Type']
  } else if (data !== undefined && data !== null) {
    body = typeof data === 'string' ? data : JSON.stringify(data)
  }

  // 超时控制
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout)

  // 组装内部 config（供拦截器共享）
  let config: InternalRequestConfig = {
    url: fetchUrl,
    method,
    headers: filterHeader,
    body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
    timeout,
    signal: controller.signal,
    raw: option,
  };

  try {
    // ★★★ 请求拦截器（在 fetch 之前） ★★★
     for (const fn of requestInterceptors.all) {
       config = await fn(config);
     }


    const resp = await fetch(fetchUrl, {
      method,
      headers: filterHeader,
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
      signal: controller.signal,
      ...rest
    })

    clearTimeout(timer)

    // 解析响应体
    let result: unknown
    if (!isStream) {
      const contentType = resp.headers.get('content-type') ?? ""
      result = contentType.includes('application/json')
        ? await resp.json()
        : await resp.text();
    }

    // 处理错误响应
    if (!resp.ok) {
      if (resp.status === 401) localStorage.removeItem('accessToken')
      const msg = (result as { msg?: string } | null)?.msg ?? `请求失败（${resp.status}）`

      // ★★★ HTTP 错误拦截器（可统一提示/刷新 token/重试） ★★★
      for (const fn of errorInterceptors.all) {
        await fn(
          new RequestError(msg, resp.status, result),
          { config, response: resp }
        );
      }

      throw new RequestError(
        msg,
        resp.status,
        result
      )
    }

    // ★★★ 响应拦截器（业务数据处理） ★★★
     let finalResult: unknown = result;
     for (const fn of responseInterceptors.all) {
       finalResult = await fn(finalResult, {
         status: resp.status,
         headers: resp.headers,
         config,
       });
     }

    // 返回响应结果
    return isStream ? resp as T :result as T

  } catch (err) {
    clearTimeout(timer)

    if (err instanceof DOMException && err.name === 'AbortError') {
      const timeoutErr = new RequestError('请求超时', 408)

      // ★★★ 网络/超时错误拦截器（可重试、上报） ★★★
      for (const fn of errorInterceptors.all) {
        await fn(timeoutErr, { config });
      }

      throw timeoutErr
    }

    // 其他错误（含上面已经拦过的 HTTP 错误）也走错误拦截器
    for (const fn of errorInterceptors.all) {
      await fn(err, { config });
    }
    throw err
  }

}

export const http = {
  get: <T = any>(url: string, params?: QueryParams, options?: RequestOptions, isStream?: boolean) =>
    request<T>(url, { method: 'GET', params, ...options }, isStream),

  post: <T = any>(url: string, data?: unknown, options?: RequestOptions, isStream?: boolean) =>
    request<T>(url, { method: 'POST', data, ...options }, isStream),

  put: <T = any>(url: string, data?: unknown, options?: RequestOptions, isStream?: boolean) =>
    request<T>(url, { method: 'PUT', data, ...options }, isStream),

  patch: <T = any>(url: string, data?: unknown, options?: RequestOptions, isStream?: boolean) =>
    request<T>(url, { method: 'PATCH', data, ...options }, isStream),

  delete: <T = any>(url: string, params?: QueryParams, options?: RequestOptions, isStream?: boolean) =>
    request<T>(url, { method: 'DELETE', params, ...options }, isStream),
};
