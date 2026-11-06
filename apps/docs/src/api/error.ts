export default class RequestError<T = unknown> extends Error{
  status: number;
  readonly data: T;

  constructor(msg:string ,status:number,data?: T) {
    super(msg)

    this.name = 'RequestError';
    this.status = status;
    this.data = data as T

    // 修复原型链（ts 编译到 ES5 时需要）
    Object.setPrototypeOf(this, RequestError.prototype);

  }
}
