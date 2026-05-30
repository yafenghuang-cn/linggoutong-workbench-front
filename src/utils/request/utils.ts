import { message } from 'antd';
import type { RequestEventName, RequestEventHandler, RequestEventPayload } from './types';

/**
 * 事件总线 —— 观察者发布/订阅模式
 * 用于处理接口不同状态的路由跳转、全局提示等
 */
class EventBus {
  private listeners = new Map<RequestEventName, Set<RequestEventHandler>>();

  /** 订阅事件 */
  on(event: RequestEventName, handler: RequestEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(handler);
      if (this.listeners.get(event)?.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /** 一次性订阅 */
  once(event: RequestEventName, handler: RequestEventHandler): () => void {
    const wrapper: RequestEventHandler = (payload) => {
      handler(payload);
      unsubscribe();
    };
    const unsubscribe = this.on(event, wrapper);
    return unsubscribe;
  }

  /** 发布事件 */
  emit(event: RequestEventName, payload: RequestEventPayload): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        console.error(`[RequestBus] handler error on "${event}":`, err);
      }
    });
  }

  /** 移除某个事件的所有监听 */
  off(event: RequestEventName): void {
    this.listeners.delete(event);
  }

  /** 清除所有监听 */
  clear(): void {
    this.listeners.clear();
  }
}

/** 全局单例 */
export const requestBus = new EventBus();

// ─── 全局提示工具 ───────────────────────────────
export const showMessage = {
  success: (content: string) => message.success(content),
  error: (content: string) => message.error(content),
  warning: (content: string) => message.warning(content),
  info: (content: string) => message.info(content),
};
