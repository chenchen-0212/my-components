// src/api/interceptorManager.ts
import type {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from '../type/interceptors.type';

class InterceptorManager<T> {
  private handlers: T[] = [];

  use(handler: T): () => void {
    this.handlers.push(handler);
    // 返回取消函数，方便移除
    return () => {
      const idx = this.handlers.indexOf(handler);
      if (idx > -1) this.handlers.splice(idx, 1);
    };
  }

  get all(): T[] {
    return this.handlers;
  }
}

export const requestInterceptors = new InterceptorManager<RequestInterceptor>();
export const responseInterceptors = new InterceptorManager<ResponseInterceptor>();
export const errorInterceptors = new InterceptorManager<ErrorInterceptor>();
