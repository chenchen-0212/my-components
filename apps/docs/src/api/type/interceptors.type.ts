// src/api/interceptors.ts
import type { RequestOptions } from './apiConfig.type';

/** 请求拦截器：可修改 config，返回新 config（或原地修改后返回） */
export type RequestInterceptor = (
  config: InternalRequestConfig
) => InternalRequestConfig | Promise<InternalRequestConfig>;

/** 响应拦截器：可修改/替换返回值 */
export type ResponseInterceptor = <T>(
  response: T,
  context: ResponseContext
) => T | Promise<T>;

/** 错误拦截器：可吞掉错误（返回新值）或重新抛出 */
export type ErrorInterceptor = (
  error: unknown,
  context: ErrorContext
) => unknown | Promise<unknown>;

/** 内部配置（request 内部流通的结构） */
export interface InternalRequestConfig {
  url: string;              // 已拼好 baseURL + query 的完整 URL
  method: string;
  headers: Record<string, string>;
  body: BodyInit | undefined;
  timeout: number;
  signal?: AbortSignal;
  raw: RequestOptions;      // 原始 options，便于拦截器读取自定义字段
}

export interface ResponseContext {
  status: number;
  headers: Headers;
  config: InternalRequestConfig;
}

export interface ErrorContext {
  config?: InternalRequestConfig;
  response?: Response;
}
