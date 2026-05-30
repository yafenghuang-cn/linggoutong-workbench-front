/**
 * 页面渲染性能统计 Hook
 *
 * 采集指标：
 *  - FCP  (First Contentful Paint)        首次内容绘制
 *  - LCP  (Largest Contentful Paint)      最大内容绘制
 *  - CLS  (Cumulative Layout Shift)       累积布局偏移
 *  - FID  (First Input Delay)             首次输入延迟
 *  - INP  (Interaction to Next Paint)     交互到下一次绘制
 *  - TTFB (Time to First Byte)            首字节到达时间
 *  - 路由切换耗时（基于 Performance API mark/measure）
 *  - React 组件渲染耗时（基于 React Profiler API）
 */

export interface PerformanceMetrics {
  /** 当前路由路径 */
  route: string;
  /** 是否为首次加载（非路由切换） */
  isFirstLoad: boolean;
  /** First Contentful Paint (ms) */
  fcp?: number;
  /** Largest Contentful Paint (ms) */
  lcp?: number;
  /** Cumulative Layout Shift (score) */
  cls?: number;
  /** First Input Delay (ms) */
  fid?: number;
  /** Interaction to Next Paint (ms) */
  inp?: number;
  /** Time to First Byte (ms) */
  ttfb?: number;
  /** 路由切换耗时 (ms) */
  routeChangeDuration?: number;
  /** React 组件渲染耗时 (ms) */
  renderDuration?: number;
  /** 采集时间戳 */
  timestamp: number;
}

export type PerformanceReportCallback = (metrics: PerformanceMetrics) => void;
