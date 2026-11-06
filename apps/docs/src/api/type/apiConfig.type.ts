
// query 参数
export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;


export interface RequestOptions
  extends Omit<RequestInit, 'method' | 'body' | 'headers'> {
  method?: string;
  params?: QueryParams;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}
