export { requestBus, showMessage } from "./utils";

import instance from "./core";
export type { ApiResponse, RequestEventName, RequestEventPayload, RequestEventHandler } from "./types";
import type { RequestOptions } from "./types";

// ─── 封装的请求方法 ───────────────────────────────────────

/** GET 请求 */
function get<T = unknown>(url: string, config?: RequestOptions): Promise<T> {
  return instance.get(url, config) as unknown as Promise<T>;
}

/** POST 请求 */
function post<T = unknown>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
  return instance.post(url, data, config) as unknown as Promise<T>;
}

/** PUT 请求 */
function put<T = unknown>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
  return instance.put(url, data, config) as unknown as Promise<T>;
}

/** PATCH 请求 */
function patch<T = unknown>(url: string, data?: unknown, config?: RequestOptions): Promise<T> {
  return instance.patch(url, data, config) as unknown as Promise<T>;
}

/** DELETE 请求 */
function del<T = unknown>(url: string, config?: RequestOptions): Promise<T> {
  return instance.delete(url, config) as unknown as Promise<T>;
}

export default instance;
export { get, post, put, patch, del };
