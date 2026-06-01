import React, { lazy, Suspense } from "react";
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import RootLayout from "@/Layout";

const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Mine = lazy(() => import("@/pages/Mine"));
const Register = lazy(() => import("@/pages/register"));

const RoutePendingPage = (): React.JSX.Element => (
  <div className="flex items-center justify-center h-screen">加载中...</div>
);

const LazyNotFound = () => (
  <Suspense fallback={<RoutePendingPage />}>
    <NotFoundPage />
  </Suspense>
);

const rootRoute = createRootRoute({
  errorComponent: LazyNotFound,
  notFoundComponent: LazyNotFound,
  pendingComponent: RoutePendingPage,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "lingxi-workbench-front",
  beforeLoad(ctx) {
    console.log(ctx, "ctx");
  },
  component: RootLayout,
  preload: true,
});

const homeRoute = createRoute({
  path: "/",
  component: Home,
  getParentRoute: () => appLayoutRoute,
  preload: true,
  caseSensitive: true,
});

const loginRoute = createRoute({
  path: "/login",
  component: Login,
  getParentRoute: () => appLayoutRoute,
  preload: true,
  caseSensitive: true,
});

const RegisterRoute = createRoute({
  path: "/register",
  component: Register,
  getParentRoute: () => appLayoutRoute,
  preload: true,
  caseSensitive: true,
});

const mineRoute = createRoute({
  path: "/mine",
  component: Mine,
  getParentRoute: () => appLayoutRoute,
  preload: true,
  caseSensitive: true,
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([homeRoute, loginRoute, mineRoute, RegisterRoute]),
]);

export const routers = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreloadDelay: 200,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof routers;
  }
}
