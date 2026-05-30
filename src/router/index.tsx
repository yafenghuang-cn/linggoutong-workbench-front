import React, { lazy, Suspense } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet, // ✅ 新增导入
} from "@tanstack/react-router";
import type { RouteComponent } from "@tanstack/react-router";

const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Mine = lazy(() => import("@/pages/Mine"));

interface CreateAppRouteProps {
  path: string;
  component: RouteComponent;
  beforeLoad?: any;
  validateSearch?: any;
}

const RoutePendingPage = (): React.JSX.Element => (
  <div className="flex items-center justify-center h-screen">加载中...</div>
);

// ✅ 用 Suspense 包裹 lazy 错误页
const LazyNotFound = () => (
  <Suspense fallback={<RoutePendingPage />}>
    <NotFoundPage />
  </Suspense>
);

// ✅ 先声明 rootRoute，再声明 appLayoutRoute（顺序更清晰）
const rootRoute = createRootRoute({
  errorComponent: LazyNotFound,
  notFoundComponent: LazyNotFound,
  pendingComponent: RoutePendingPage,
});

// ✅ RootLayout 渲染 Outlet
const RootLayout = () => (
  <div>
    <Outlet />
  </div>
);

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "lingxi-workbench-front",
  beforeLoad(ctx) {
    console.log(ctx, "ctx");
  },
  component: RootLayout,
  preload: true,
});

const createAppRoute = (payload: CreateAppRouteProps) =>
  createRoute({
    path: payload.path,
    component: () => (
      <Suspense fallback={<RoutePendingPage />}>
        <payload.component />
      </Suspense>
    ),
    beforeLoad: payload.beforeLoad,
    validateSearch: payload.validateSearch,
    getParentRoute: () => appLayoutRoute,
    preload: true,
    caseSensitive: true,
  });

const homeRoute = createAppRoute({
  path: "/",
  component: Home,
});

const loginRoute = createAppRoute({
  path: "/login",
  component: Login,
});

const mineRoute = createAppRoute({
  path: "/mine",
  component: Mine,
});

// ✅ appLayoutRoute 必须加入路由树
const routeTree = rootRoute.addChildren([appLayoutRoute.addChildren([homeRoute, loginRoute, mineRoute])]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreloadDelay: 200,
  defaultPreload: "intent",
});

// ✅ Register（不是 IRegister）
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
