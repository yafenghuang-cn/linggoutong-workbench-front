import type { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number | string;
  data: T;
  message: string;
}

/** 扩展请求配置 */
export interface RequestOptions extends AxiosRequestConfig {
  /** 是否返回完整的 { code, data, message }，默认 false 只返回 data */
  returnFullResponse?: boolean;
  /** 是否在请求头中自动携带 token，默认 true */
  withToken?: boolean;
  /** 自定义请求头中 token 的字段名，默认 'Authorization' */
  tokenHeaderKey?: string;
  /** 自定义获取 token 的方法，默认从 localStorage 取 */
  getToken?: () => string | null | undefined;
  /** 是否静默请求（不显示全局 loading / 错误提示），默认 false */
  silent?: boolean;
  /** 自定义错误提示文案 */
  errorMessage?: string;
}

/** 事件总线支持的事件类型 */
export type RequestEventName =
  | 'response:success'      // 请求成功
  | 'response:error'        // 响应错误（非 2xx）
  | 'response:unauthorized' // 401 未授权
  | 'response:forbidden'    // 403 禁止访问
  | 'response:notfound'     // 404 资源不存在
  | 'response:servererror'  // 5xx 服务端错误
  | 'response:network'      // 网络异常
  | 'response:timeout'      // 请求超时
  | 'response:bizerror';    // 业务错误（code 非成功值）

/** 事件回调参数 */
export interface RequestEventPayload {
  code?: number | string;
  message?: string;
  data?: unknown;
  config?: InternalAxiosRequestConfig | RequestOptions;
  response?: AxiosResponse;
  error?: Error;
}

/** 事件处理函数 */
export type RequestEventHandler = (payload: RequestEventPayload) => void;
