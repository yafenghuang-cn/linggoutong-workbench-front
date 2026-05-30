import { useCallback, useEffect, useRef } from "react";
import type { PerformanceMetrics, PerformanceReportCallback } from "./types";

/**
 * Web Vitals 指标阈值（用于控制台彩色输出）
 */
const THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  fid: { good: 100, poor: 300 },
  inp: { good: 200, poor: 500 },
  ttfb: { good: 800, poor: 1800 },
  renderDuration: { good: 16, poor: 100 },
} as const;

type MetricName = keyof typeof THRESHOLDS;

/**
 * 根据阈值返回评级颜色（用于 console 输出）
 */
function getRating(metric: MetricName, value: number): { label: string; color: string } {
  const t = THRESHOLDS[metric];
  if (value <= t.good) return { label: "✅ good", color: "color: #0cce6b" };
  if (value <= t.poor) return { label: "⚠️ needs-improvement", color: "color: #ffa400" };
  return { label: "❌ poor", color: "color: #ff4e42" };
}

/**
 * 格式化性能指标日志
 */
function logMetrics(metrics: PerformanceMetrics) {
  const header = metrics.isFirstLoad ? "🚀 首次加载性能报告" : "📄 路由切换性能报告";
  const route = metrics.route;

  const lines: string[] = [];
  const styles: string[] = [];

  lines.push(`\n%c${header} — ${route}%c`);
  styles.push("font-weight: bold; font-size: 14px; color: #1677ff", "");

  const addLine = (name: string, metric: MetricName | null, value: number | undefined, unit = "ms") => {
    if (value === undefined) return;
    if (metric) {
      const { label, color } = getRating(metric, value);
      lines.push(`  %c${name}: ${value.toFixed(2)}${unit}  [${label}]%c`);
      styles.push(color, "");
    } else {
      lines.push(`  ${name}: ${value.toFixed(2)}${unit}`);
    }
  };

  addLine("TTFB", "ttfb", metrics.ttfb);
  addLine("FCP", "fcp", metrics.fcp);
  addLine("LCP", "lcp", metrics.lcp);
  addLine("CLS", "cls", metrics.cls, "");
  addLine("FID", "fid", metrics.fid);
  addLine("INP", "inp", metrics.inp);
  addLine("路由切换耗时", null, metrics.routeChangeDuration);
  addLine("React 渲染耗时", "renderDuration", metrics.renderDuration);

  // eslint-disable-next-line no-console
  console.log(lines.join("\n"), ...styles);
}

/**
 * usePerformanceMonitor
 *
 * 监听 Web Vitals 及路由切换耗时，收集后触发回调（默认 console.log）。
 * 建议在应用根组件使用一次即可。
 *
 * @param options.route      当前路由路径（用于标注来源）
 * @param options.onReport   自定义上报回调（可发送到后端/埋点平台）
 * @param options.enableLog  是否在控制台打印，默认仅在 development 开启
 */
export function usePerformanceMonitor(options: {
  route: string;
  onReport?: PerformanceReportCallback;
  enableLog?: boolean;
}) {
  const { route, onReport, enableLog = import.meta.env.DEV } = options;

  // 记录是否为首次加载
  const isFirstLoadRef = useRef(true);
  // 收集到的指标暂存
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  // 路由切换起始时间
  const routeStartRef = useRef<number>(0);

  /**
   * 提交当前收集到的指标
   */
  const report = useCallback(() => {
    const m = metricsRef.current;
    const finalMetrics: PerformanceMetrics = {
      route,
      isFirstLoad: isFirstLoadRef.current,
      ttfb: m.ttfb,
      fcp: m.fcp,
      lcp: m.lcp,
      cls: m.cls,
      fid: m.fid,
      inp: m.inp,
      routeChangeDuration: m.routeChangeDuration,
      renderDuration: m.renderDuration,
      timestamp: Date.now(),
    };

    if (enableLog) logMetrics(finalMetrics);
    onReport?.(finalMetrics);

    // 提交后重置（CLS 需要持续累加，特殊处理）
    metricsRef.current = {};
    isFirstLoadRef.current = false;
  }, [route, onReport, enableLog]);

  /**
   * 监听 Web Vitals 指标
   */
  useEffect(() => {
    // 重置
    metricsRef.current = {};
    routeStartRef.current = performance.now();

    // 路由切换耗时：使用 requestIdleCallback 或 setTimeout 估算
    let idleId: number;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => {
        metricsRef.current.routeChangeDuration = performance.now() - routeStartRef.current;
      });
    } else {
      idleId = window.setTimeout(() => {
        metricsRef.current.routeChangeDuration = performance.now() - routeStartRef.current;
      }, 0) as unknown as number;
    }

    // TTFB
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navEntry) {
      metricsRef.current.ttfb = navEntry.responseStart - navEntry.requestStart;
    }

    // 各类 Observer
    const observers: PerformanceObserver[] = [];

    const createObserver = (type: string, handler: (entries: PerformanceEntry[]) => void) => {
      try {
        const obs = new PerformanceObserver((list) => handler(list.getEntries()));
        obs.observe({ type, buffered: true });
        observers.push(obs);
      } catch {
        // 某些浏览器不支持该类型，静默忽略
      }
    };

    // FCP
    createObserver("paint", (entries) => {
      const fcp = entries.find((e) => e.name === "first-contentful-paint");
      if (fcp) metricsRef.current.fcp = fcp.startTime;
    });

    // LCP
    createObserver("largest-contentful-paint", (entries) => {
      const last = entries[entries.length - 1];
      if (last) metricsRef.current.lcp = last.startTime;
    });

    // CLS（累加）
    let clsValue = 0;
    createObserver("layout-shift", (entries) => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      metricsRef.current.cls = clsValue;
    });

    // FID
    createObserver("first-input", (entries) => {
      const first = entries[0] as PerformanceEventTiming | undefined;
      if (first) {
        metricsRef.current.fid = first.processingStart - first.startTime;
      }
    });

    // INP（取最大值）
    let maxInp = 0;
    createObserver("event", (entries) => {
      for (const entry of entries as PerformanceEventTiming[]) {
        const duration = entry.duration;
        if (duration > maxInp) maxInp = duration;
      }
      metricsRef.current.inp = maxInp;
    });

    // 在页面隐藏时（或 5s 后）触发上报，确保数据完整
    const reportTimer = window.setTimeout(() => {
      report();
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(reportTimer);
        report();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observers.forEach((obs) => obs.disconnect());
      clearTimeout(reportTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [route, report]);

  /**
   * 供 React Profiler 使用的 onRender 回调
   * 可在根组件 Profiler 中传入此函数，记录渲染耗时
   */
  const onRenderCallback = useCallback(
    (
      _id: string,
      _phase: "mount" | "update" | "nested-update",
      actualDuration: number,
    ) => {
      metricsRef.current.renderDuration = (metricsRef.current.renderDuration ?? 0) + actualDuration;
    },
    [],
  );

  return { onRenderCallback, report };
}
