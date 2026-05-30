import React from "react";

import { RouterProvider } from "@tanstack/react-router";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createRoot } from "react-dom/client";
import { PerformanceProvider } from "@/components/PerformanceProvider";
import QueryProvider from "@/components/QueryProvider";
import "@/styles/global.scss";
import { routers } from "./router";

const rootEl = document.getElementById("root") as HTMLElement;

createRoot(rootEl).render(
  <React.StrictMode>
    <QueryProvider>
      <PerformanceProvider router={routers}>
        <ConfigProvider locale={zhCN}>
          <RouterProvider router={routers} />
        </ConfigProvider>
      </PerformanceProvider>
    </QueryProvider>
  </React.StrictMode>,
);
