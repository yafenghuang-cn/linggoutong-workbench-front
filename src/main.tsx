import React from "react";

import { RouterProvider } from "@tanstack/react-router";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { createRoot } from "react-dom/client";
import { router } from "./router";
import { PerformanceProvider } from "@/components/PerformanceProvider";
import "@/styles/global.scss";

const rootEl = document.getElementById("root") as HTMLElement;

createRoot(rootEl).render(
  <React.StrictMode>
    <PerformanceProvider router={router}>
      <ConfigProvider locale={zhCN}>
        <RouterProvider router={router} />
      </ConfigProvider>
    </PerformanceProvider>
  </React.StrictMode>,
);
