import { Profiler, useEffect, useState } from "react";
import type { Router } from "@tanstack/react-router";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import type { PerformanceReportCallback } from "@/hooks/usePerformanceMonitor";

interface PerformanceProviderProps {
  children: React.ReactNode;
  /** TanStack Router 实例，用于监听路由变化 */
  router: Router<any, any, any>;
  /** 自定义上报回调（可选，用于发送到埋点平台） */
  onReport?: PerformanceReportCallback;
  /** 是否在控制台打印，默认仅 development 环境 */
  enableLog?: boolean;
}

/**
 * 性能监控 Provider
 *
 * 包裹在应用根组件外层，自动追踪：
 *  - 首次加载性能（FCP / LCP / CLS / TTFB 等）
 *  - 每次路由切换的性能指标
 *  - React 组件渲染耗时（通过 Profiler）
 *
 * 用法（在 main.tsx 中）：
 * ```tsx
 * <PerformanceProvider router={router}>
 *   <RouterProvider router={router} />
 * </PerformanceProvider>
 * ```
 */
export function PerformanceProvider({ children, router, onReport, enableLog }: PerformanceProviderProps) {
  // 通过 router.history 订阅当前路径（无需 Router Context）
  const [currentPath, setCurrentPath] = useState(() => router.history.location.pathname);

  useEffect(() => {
    const unsubscribe = router.history.subscribe(() => {
      setCurrentPath(router.history.location.pathname);
    });
    return unsubscribe;
  }, [router]);

  const { onRenderCallback } = usePerformanceMonitor({
    route: currentPath,
    onReport,
    enableLog,
  });

  return (
    <Profiler id={currentPath} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}
