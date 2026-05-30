import type { MutationKey, UseMutationResult } from "@tanstack/react-query";

export type LoadingSnapshot = ReadonlySet<string>;
/** useRequestMutation 扩展配置 */
export interface IUseRequestMutationOptions<TData = unknown, TError = Error, TVariables = void> {
  /**
   * 全局唯一加载标识 key
   *
   * - **按钮级 loading**：`isLoading` 仅反映当前 mutation 状态
   * - **页面级 loading**：通过 `isAnyLoading("pagePrefix")` 检查前缀匹配的任意 key 是否在加载中
   */
  key?: string;
  /** 传递给 useMutation 的 mutationKey（用于 queryClient 操作） */
  mutationKey?: MutationKey;
  /** 在 onSettled 回调之前执行 */
  onBeforeSettled?: () => void;
  /** 透传给 useMutation 的 onSuccess */
  onSuccess?: (data: TData, variables: TVariables) => void;
  /** 透传给 useMutation 的 onError */
  onError?: (error: TError, variables: TVariables) => void;
  /** 透传给 useMutation 的 onSettled */
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  /** 透传给 useMutation 的 onMutate（返回值会作为 context 传递） */
  onMutate?: (variables: TVariables) => void | Promise<void>;
}

/** useRequestMutation 返回值（UseMutationResult 的扩展） */
export type UseRequestMutationResult<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> = UseMutationResult<TData, TError, TVariables, TContext> & {
  /** 当前 mutation 是否正在执行（按钮级 loading） */
  isLoading: boolean;
  /** 批量操作中各项的 loading 状态 Map，key 格式为 `{key}__batch__{index}` */
  batchLoading: ReadonlyMap<string, boolean>;
  /** 上一次 onMutate 时捕获的加载状态快照 */
  snapshot: LoadingSnapshot | undefined;
  /** 触发批量并行 mutation */
  batchMutate: (variablesList: TVariables[]) => Promise<PromiseSettledResult<TData>[]>;
  /** 触发批量并行 mutation（async 版本，抛出首个错误） */
  batchMutateAsync: (variablesList: TVariables[]) => Promise<TData[]>;
};
