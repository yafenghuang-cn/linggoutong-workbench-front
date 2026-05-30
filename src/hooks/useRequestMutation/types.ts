import type {
  DefaultError,
  MutationObserver,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';

export type RequestLoadingMode = 'button' | 'both' | 'page';

export interface IUseRequestMutationOptions<TData, TVariables>
  extends Omit<
    UseMutationOptions<TData, DefaultError, TVariables, void>,
    'mutationFn'
  > {
  loadingMode?: RequestLoadingMode;
  mutationFn: (variables: TVariables) => Promise<TData>;
}

export interface IUseRequestMutationResult<TData, TVariables> {
  buttonLoading: boolean;
  data: TData | undefined;
  error: DefaultError | null;
  isError: boolean;
  isSuccess: boolean;
  loading: boolean;
  loadingMode: RequestLoadingMode;
  pageLoading: boolean;
  reset: () => void;
  submit: (variables: TVariables) => void;
  submitAsync: (variables: TVariables) => Promise<TData>;
}

export type UnknownMutationOption = IUseRequestMutationOptions<
  unknown,
  unknown
>;
export type UnknownMutationResult = IUseRequestMutationResult<unknown, unknown>;
export type MutationOptionRecord = Record<string, UnknownMutationOption>;

export interface IUseRequestMutationConfig {
  defaultLoadingMode?: RequestLoadingMode;
}

export type InferMutationData<TOptions> =
  TOptions extends IUseRequestMutationOptions<infer TData, unknown>
    ? TData
    : never;

export type InferMutationVariables<TOptions> =
  TOptions extends IUseRequestMutationOptions<unknown, infer TVariables>
    ? TVariables
    : never;

export type IUseRequestMutationResultRecord<
  TOptionRecord extends MutationOptionRecord,
> = {
  [TKey in keyof TOptionRecord]: IUseRequestMutationResult<
    InferMutationData<TOptionRecord[TKey]>,
    InferMutationVariables<TOptionRecord[TKey]>
  >;
};

export interface IUseRequestMutationOverview<
  TOptionRecord extends MutationOptionRecord,
> {
  buttonLoading: boolean;
  errorCount: number;
  firstError: DefaultError | null;
  hasError: boolean;
  loading: boolean;
  pageLoading: boolean;
  resetByKey: (key: keyof TOptionRecord) => void;
  resetAll: () => void;
  successCount: number;
}

export type IUseRequestMutationGroupResult<
  TOptionRecord extends MutationOptionRecord,
> = IUseRequestMutationOverview<TOptionRecord> &
  IUseRequestMutationResultRecord<TOptionRecord>;

export type RequestMutationObserver = MutationObserver<
  unknown,
  DefaultError,
  unknown,
  void
>;
export type RequestMutationObserverResult = UseMutationResult<
  unknown,
  DefaultError,
  unknown,
  void
>;
