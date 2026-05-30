import { useEffect, useRef, useSyncExternalStore } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import RequestMutationStore from './store';
import type {
  IUseRequestMutationConfig,
  IUseRequestMutationGroupResult,
  IUseRequestMutationOptions,
  IUseRequestMutationResult,
  MutationOptionRecord,
} from './types';
import {
  createMutationOptionRecord,
  getMutationOverview,
  isSingleMutationOptions,
  normalizeMutationOptionRecord,
  toSingleMutationResult,
  toMutationResultRecord,
} from './utils';

interface IUseRequestMutationHook {
  <TData, TVariables>(
    options: IUseRequestMutationOptions<TData, TVariables>,
    config?: IUseRequestMutationConfig,
  ): IUseRequestMutationResult<TData, TVariables>;
  <TOptionRecord extends MutationOptionRecord>(
    options: TOptionRecord,
    config?: IUseRequestMutationConfig,
  ): IUseRequestMutationGroupResult<TOptionRecord>;
}

const useRequestMutation = (<
  TData,
  TVariables,
  TOptionRecord extends MutationOptionRecord,
>(
  options: IUseRequestMutationOptions<TData, TVariables> | TOptionRecord,
  config?: IUseRequestMutationConfig,
):
  | IUseRequestMutationResult<TData, TVariables>
  | IUseRequestMutationGroupResult<TOptionRecord> => {
  const isSingle = isSingleMutationOptions(options);
  const mutationOptionRecord = normalizeMutationOptionRecord(
    createMutationOptionRecord(options, isSingle),
    config,
  );
  const queryClient = useQueryClient();
  const storeRef = useRef<RequestMutationStore | null>(null);

  if (storeRef.current === null) {
    storeRef.current = new RequestMutationStore(
      queryClient,
      mutationOptionRecord,
    );
  }

  useEffect(() => {
    storeRef.current?.sync(mutationOptionRecord);
  }, [mutationOptionRecord]);

  useEffect(() => {
    return () => {
      storeRef.current?.destroy();
      storeRef.current = null;
    };
  }, []);

  const rawMutations = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getSnapshot,
  );

  if (isSingle) {
    return toSingleMutationResult<TData, TVariables>(rawMutations.__default);
  }

  const mutationResults = toMutationResultRecord<TOptionRecord>(rawMutations);
  const mutationOverview = getMutationOverview<TOptionRecord>(rawMutations);
  const groupResult: IUseRequestMutationGroupResult<TOptionRecord> = {
    ...mutationResults,
    ...mutationOverview,
    resetByKey: (key) => {
      rawMutations[String(key)]?.reset();
    },
    resetAll: () => {
      Object.values(rawMutations).forEach((mutation) => {
        mutation.reset();
      });
    },
  };

  return groupResult;
}) as IUseRequestMutationHook;

export default useRequestMutation;
