import type {
  IUseRequestMutationConfig,
  IUseRequestMutationOverview,
  IUseRequestMutationOptions,
  IUseRequestMutationResult,
  IUseRequestMutationResultRecord,
  MutationOptionRecord,
  RequestLoadingMode,
  RequestMutationObserver,
  RequestMutationObserverResult,
  UnknownMutationOption,
  UnknownMutationResult,
} from './types';

import type { DefaultError, UseMutationResult } from '@tanstack/react-query';

export const toRequestMutationResult = <TData, TVariables>(
  mutation: Pick<
    UseMutationResult<TData, DefaultError, TVariables, void>,
    | 'data'
    | 'error'
    | 'isError'
    | 'isPending'
    | 'isSuccess'
    | 'mutate'
    | 'mutateAsync'
    | 'reset'
  >,
  loadingMode: RequestLoadingMode,
): IUseRequestMutationResult<TData, TVariables> => {
  const isPending = mutation.isPending;
  const pageLoading =
    isPending && (loadingMode === 'page' || loadingMode === 'both');
  const buttonLoading =
    isPending && (loadingMode === 'button' || loadingMode === 'both');

  return {
    buttonLoading,
    data: mutation.data,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    loading: isPending,
    loadingMode,
    pageLoading,
    reset: mutation.reset,
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
  };
};

export const isSingleMutationOptions = <TData, TVariables>(
  options: IUseRequestMutationOptions<TData, TVariables> | MutationOptionRecord,
): options is IUseRequestMutationOptions<TData, TVariables> =>
  typeof options === 'object' && options !== null && 'mutationFn' in options;

export const toInternalMutationResult = (
  observer: RequestMutationObserver,
): RequestMutationObserverResult => {
  return {
    ...observer.getCurrentResult(),
    mutate: (variables) => {
      void observer.mutate(variables);
    },
    mutateAsync: (variables) => observer.mutate(variables),
    reset: () => {
      observer.reset();
    },
  };
};

export const toMutationResultRecord = <
  TOptionRecord extends MutationOptionRecord,
>(
  resultMap: Record<string, UnknownMutationResult>,
): IUseRequestMutationResultRecord<TOptionRecord> =>
  resultMap as IUseRequestMutationResultRecord<TOptionRecord>;

export const toSingleMutationResult = <TData, TVariables>(
  result: UnknownMutationResult,
): IUseRequestMutationResult<TData, TVariables> =>
  result as IUseRequestMutationResult<TData, TVariables>;

export const toUnknownMutationOption = <TData, TVariables>(
  options: IUseRequestMutationOptions<TData, TVariables>,
): UnknownMutationOption => options as UnknownMutationOption;

export const createMutationOptionRecord = <
  TData,
  TVariables,
  TOptionRecord extends MutationOptionRecord,
>(
  options: IUseRequestMutationOptions<TData, TVariables> | TOptionRecord,
  isSingle: boolean,
): MutationOptionRecord => {
  if (isSingle) {
    const singleOptions: MutationOptionRecord = {
      __default: toUnknownMutationOption(
        options as IUseRequestMutationOptions<TData, TVariables>,
      ),
    };

    return singleOptions;
  }

  return options as MutationOptionRecord;
};

export const normalizeMutationOptionRecord = (
  optionRecord: MutationOptionRecord,
  config?: IUseRequestMutationConfig,
): MutationOptionRecord => {
  const defaultLoadingMode = config?.defaultLoadingMode ?? 'button';

  return Object.keys(optionRecord).reduce<MutationOptionRecord>(
    (result, key) => {
      const currentOptions = optionRecord[key];

      result[key] = {
        ...currentOptions,
        loadingMode: currentOptions.loadingMode ?? defaultLoadingMode,
      };

      return result;
    },
    {},
  );
};

export const getMutationOverview = <TOptionRecord extends MutationOptionRecord>(
  rawMutations: Record<string, UnknownMutationResult>,
): Omit<
  IUseRequestMutationOverview<TOptionRecord>,
  'resetAll' | 'resetByKey'
> => {
  const mutationList = Object.values(rawMutations);
  const firstErrorMutation = mutationList.find(
    (mutation) => mutation.error !== null,
  );

  return {
    buttonLoading: mutationList.some((mutation) => mutation.buttonLoading),
    errorCount: mutationList.filter((mutation) => mutation.isError).length,
    firstError: firstErrorMutation?.error ?? null,
    hasError: mutationList.some((mutation) => mutation.isError),
    loading: mutationList.some((mutation) => mutation.loading),
    pageLoading: mutationList.some((mutation) => mutation.pageLoading),
    successCount: mutationList.filter((mutation) => mutation.isSuccess).length,
  };
};
