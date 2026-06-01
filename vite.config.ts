import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

import { resolve } from "path";
import stylelint from "vite-plugin-stylelint";

// Lightning CSS 目标浏览器版本
const lightningCssTargets: Record<string, number> = {
  chrome: 90,
  firefox: 88,
  safari: 14,
  edge: 90,
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      stylelint({
        fix: true,
        include: ["src/**/*.{css,scss,sass}"],
        exclude: ["node_modules"],
        lintOnStart: false,
        cache: true,
      }),
    ],
    server: {
      port: 8000,
      open: true,
      host: "0.0.0.0",
      strictPort: false,
      cors: true,
      proxy: {
        [`/${env.VITE_APP_BASE_API || "api"}`]: {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => {
            const apiPrefix = env.VITE_APP_BASE_API || "api";
            return path.replace(new RegExp(`^/${apiPrefix}`), "");
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
      // 优化模块解析
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    },
    css: {
      // 预处理器选项
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["legacy-js-api"],
        },
        sass: {
          silenceDeprecations: ["legacy-js-api"],
        },
      },
      // Lightning CSS 配置（用于 CSS 压缩和转换）
      lightningcss: {
        targets: lightningCssTargets,
        // 错误处理：true 表示跳过无效 CSS 规则并发出警告，false 表示构建失败
        errorRecovery: true,
      },
      modules: {
        generateScopedName: "[hash:base64:8]",
        hashPrefix: "prefix",
        localsConvention: "camelCase",
      },
    },
    // 依赖预构建优化
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "antd", "@ant-design/icons", "axios", "dayjs", "lodash"],
      exclude: [],
    },
    build: {
      // 输出目录
      outDir: "dist",
      // 静态资源目录（仅用于未指定的资源）
      assetsDir: "",
      // 小于此阈值的导入或引用资源会被内联为 base64，以避免额外的 http 请求
      assetsInlineLimit: 4096,
      // 启用 CSS 代码拆分
      cssCodeSplit: true,
      // 构建后是否生成 source map 文件
      sourcemap: false,
      // 启用/禁用 gzip 压缩大小报告
      reportCompressedSize: false,
      // chunk 大小警告限制（单位 kb）
      chunkSizeWarningLimit: 1000,
      // 压缩配置
      minify: "oxc",
    },
  };
});
