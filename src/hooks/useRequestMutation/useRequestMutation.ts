import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import type { IUseRequestMutationOptions, LoadingSnapshot, UseRequestMutationResult } from "./types";

const activeLoadingKeys = new Set<string>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

function setLoading(key: string, loading: boolean): void {
  if (loading) {
    activeLoadingKeys.add(key);
  } else {
    activeLoadingKeys.delete(key);
  }
  notify();
}

/** 订阅加载状态变化（用于外部状态管理或调试） */
export function subscribeLoading(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 获取当前所有活跃加载 key 的只读快照 */
export function getActiveLoadingKeys(): ReadonlySet<string> {
  return new Set(activeLoadingKeys);
}

/**
 * 检查指定 key 是否正在加载
 * @example
 * isKeyLoading("user:submit")   // 精确匹配按钮级
 * isKeyLoading("order")         // 前缀匹配，等同于 isAnyLoading("order")
 */
export function isKeyLoading(key: string): boolean {
  if (activeLoadingKeys.has(key)) return true;
  // 前缀回退：若精确匹配失败，检查以 `${key}:` 或 `${key}__` 开头的 key
  for (const k of activeLoadingKeys) {
    if (k.startsWith(key + ":") || k.startsWith(key + "__")) return true;
  }
  return false;
}

export function isAnyLoading(prefix: string): boolean {
  for (const k of activeLoadingKeys) {
    if (k === prefix || k.startsWith(prefix + ":") || k.startsWith(prefix + "__")) {
      return true;
    }
  }
  return false;
}

export function useRequestMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: IUseRequestMutationOptions<TData, TError, TVariables> | string,
): UseRequestMutationResult<TData, TError, TVariables> {
  // ── 归一化 options ─────────────────────────────────────────────────────────
  const opts: IUseRequestMutationOptions<TData, TError, TVariables> =
    typeof options === "string" ? { key: options } : (options ?? {});

  const { key, mutationKey, onBeforeSettled, onSuccess, onError, onSettled, onMutate } = opts;

  // ── snapshot ref ────────────────────────────────────────────────────────────
  const snapshotRef = useRef<LoadingSnapshot | undefined>(undefined);

  // ── 批量 loading 状态（ref 避免触发额外渲染，由 useMutation 渲染周期驱动） ──
  const batchLoadingRef = useRef<Map<string, boolean>>(new Map());

  // ── 内部 mutation 函数（注入 loading 追踪逻辑）─────────────────────────────
  const trackedMutationFn = useCallback(
    async (variables: TVariables): Promise<TData> => {
      if (key) setLoading(key, true);
      try {
        return await mutationFn(variables);
      } finally {
        if (key) setLoading(key, false);
      }
    },
    [mutationFn, key],
  );

  // ── 调用 useMutation（不显式标注类型，由 TS 自动推断回调签名）──────────────
  const mutation = useMutation<TData, TError, TVariables>({
    ...(mutationKey ? { mutationKey } : key ? { mutationKey: [key] } : {}),
    mutationFn: trackedMutationFn,
    onMutate: async (variables) => {
      // 捕获当前活跃 key 快照（可在 onError 时用于回滚）
      snapshotRef.current = getActiveLoadingKeys();
      if (onMutate) {
        await onMutate(variables);
      }
      return undefined;
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      onError?.(error, variables);
    },
    onSettled: (data, error, variables) => {
      onBeforeSettled?.();
      onSettled?.(data, error, variables);
    },
  });

  // ── 封装 mutate（同步触发，附带 loading 追踪）─────────────────────────────
  const mutate = useCallback(
    (
      variables: TVariables,
      mutateOpts?: {
        onSuccess?: (data: TData) => void;
        onError?: (error: TError) => void;
        onSettled?: (data: TData | undefined, error: TError | null) => void;
      },
    ) => {
      if (key) setLoading(key, true);
      mutation.mutate(variables, {
        ...mutateOpts,
        onSettled: (data, error, _vars, _ctx) => {
          if (key) setLoading(key, false);
          mutateOpts?.onSettled?.(data, error);
        },
      });
    },
    [mutation, key],
  );

  // ── 封装 mutateAsync ────────────────────────────────────────────────────────
  const mutateAsync = useCallback(
    async (
      variables: TVariables,
      mutateOpts?: {
        onSuccess?: (data: TData) => void;
        onError?: (error: TError) => void;
        onSettled?: (data: TData | undefined, error: TError | null) => void;
      },
    ): Promise<TData> => {
      if (key) setLoading(key, true);
      try {
        return await mutation.mutateAsync(variables, mutateOpts);
      } finally {
        if (key) setLoading(key, false);
      }
    },
    [mutation, key],
  );

  // ── 批量并行 mutation ───────────────────────────────────────────────────────
  const batchMutate = useCallback(
    async (variablesList: TVariables[]): Promise<PromiseSettledResult<TData>[]> => {
      const batchKey = key ? `${key}__batch` : undefined;
      if (batchKey) setLoading(batchKey, true);

      try {
        const results = await Promise.allSettled(
          variablesList.map(async (vars, index) => {
            const itemKey = batchKey ? `${batchKey}__${index}` : undefined;
            if (itemKey) {
              batchLoadingRef.current.set(itemKey, true);
              setLoading(itemKey, true);
            }
            try {
              return await mutationFn(vars);
            } finally {
              if (itemKey) {
                batchLoadingRef.current.delete(itemKey);
                setLoading(itemKey, false);
              }
            }
          }),
        );
        return results;
      } finally {
        if (batchKey) setLoading(batchKey, false);
      }
    },
    [mutationFn, key],
  );

  const batchMutateAsync = useCallback(
    async (variablesList: TVariables[]): Promise<TData[]> => {
      const results = await batchMutate(variablesList);
      return results.map((r, index) => {
        if (r.status === "fulfilled") return r.value;
        throw new AggregateError([r.reason], `batchMutateAsync: item [${index}] failed`);
      });
    },
    [batchMutate],
  );

  // ── 重置时清空 batchLoading ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    batchLoadingRef.current.clear();
    mutation.reset();
  }, [mutation]);

  // ── 返回值 ──────────────────────────────────────────────────────────────────
  return {
    ...mutation,
    mutate,
    mutateAsync,
    reset,
    isLoading: mutation.isPending,
    batchLoading: batchLoadingRef.current,
    snapshot: snapshotRef.current,
    batchMutate,
    batchMutateAsync,
  } as UseRequestMutationResult<TData, TError, TVariables>;
}

export default useRequestMutation;
