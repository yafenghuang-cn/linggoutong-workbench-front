import axios from "axios";
import type { AxiosError } from "axios";
import { getLocalStorage } from "@/utils/StorageValue";
import { requestBus, showMessage } from "./utils";
import type { ApiResponse, RequestOptions } from "./types";

const TOKEN_KEY = "token";
const SUCCESS_CODE = 0; // 业务成功状态码，根据后端约定调整
const apiPrefix = import.meta.env.VITE_APP_BASE_API || "api";

const instance = axios.create({
  timeout: 5_000,
  headers: { "Content-Type": "application/json" },
  baseURL: `/${apiPrefix}`,
});

instance.interceptors.request.use(
  (config) => {
    const reqOpts = config as unknown as RequestOptions;
    const withToken = reqOpts.withToken ?? true;
    const tokenHeaderKey = reqOpts.tokenHeaderKey ?? "Authorization";
    const getToken = reqOpts.getToken ?? (() => getLocalStorage(TOKEN_KEY) as string | null);

    if (withToken) {
      const token = getToken();
      if (token) {
        config.headers.set(tokenHeaderKey, `Bearer ${token}`);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => {
    const reqOpts = response.config as unknown as RequestOptions;
    const silent = reqOpts.silent ?? false;
    const apiData = response.data as ApiResponse;

    // 业务错误：code 不是成功码
    if (apiData.code !== undefined && apiData.code !== SUCCESS_CODE) {
      const payload = {
        code: apiData.code,
        message: apiData.message,
        data: apiData.data,
        config: response.config,
        response,
      };
      requestBus.emit("response:bizerror", payload);

      if (!silent) {
        showMessage.error(reqOpts.errorMessage ?? apiData.message ?? "请求失败");
      }
      return Promise.reject(new Error(apiData.message ?? "BizError"));
    }

    // 成功
    requestBus.emit("response:success", {
      code: apiData.code,
      message: apiData.message,
      data: apiData.data,
      config: response.config,
      response,
    });

    // 根据配置决定返回完整响应还是仅返回 data
    if (reqOpts.returnFullResponse) {
      return apiData as unknown as typeof response;
    }
    return apiData.data as unknown as typeof response;
  },
  (error: AxiosError<ApiResponse>) => {
    const reqOpts = (error.config ?? {}) as RequestOptions;
    const silent = reqOpts.silent ?? false;

    let eventName: string;
    let msg: string;

    if (error.code === "ECONNABORTED" || error.name === "CanceledError") {
      eventName = "response:timeout";
      msg = "请求超时，请稍后重试";
    } else if (!error.response) {
      eventName = "response:network";
      msg = "网络异常，请检查网络连接";
    } else {
      const status = error.response.status;
      switch (status) {
        case 401:
          eventName = "response:unauthorized";
          msg = "登录已过期，请重新登录";
          break;
        case 403:
          eventName = "response:forbidden";
          msg = "没有权限访问该资源";
          break;
        case 404:
          eventName = "response:notfound";
          msg = "请求的资源不存在";
          break;
        default:
          eventName = status >= 500 ? "response:servererror" : "response:error";
          msg = `服务器错误 (${status})`;
      }
    }

    const payload = {
      code: error.response?.data?.code,
      message: error.response?.data?.message ?? msg,
      data: error.response?.data?.data,
      config: error.config,
      response: error.response,
      error,
    };

    requestBus.emit(eventName as any, payload);

    if (!silent) {
      showMessage.error(reqOpts.errorMessage ?? msg);
    }

    return Promise.reject(error);
  },
);

export default instance;
