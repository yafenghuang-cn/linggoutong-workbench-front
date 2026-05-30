import { MutationObserver } from "@tanstack/react-query";

import type {
  MutationOptionRecord,
  RequestMutationObserver,
  UnknownMutationOption,
  UnknownMutationResult,
} from "./types";
import { toInternalMutationResult, toRequestMutationResult } from "./utils";

import type { QueryClient } from "@tanstack/react-query";

type MutationListener = () => void;

export default class RequestMutationStore {
  private listeners = new Set<MutationListener>();

  private mutationOptionRecord: MutationOptionRecord = {};

  private observerUnsubscribes = new Map<string, () => void>();

  private observers = new Map<string, RequestMutationObserver>();

  private snapshot: Record<string, UnknownMutationResult> = {};

  constructor(
    private readonly queryClient: QueryClient,
    initialMutationOptionRecord: MutationOptionRecord,
  ) {
    this.sync(initialMutationOptionRecord);
  }

  public destroy(): void {
    this.observerUnsubscribes.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.observerUnsubscribes.clear();
    this.observers.clear();
    this.listeners.clear();
  }

  public getSnapshot = (): Record<string, UnknownMutationResult> => this.snapshot;

  public subscribe = (listener: MutationListener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  public sync(mutationOptionRecord: MutationOptionRecord): void {
    this.mutationOptionRecord = mutationOptionRecord;
    const nextKeys = new Set(Object.keys(mutationOptionRecord));

    Object.keys(mutationOptionRecord).forEach((key) => {
      const currentOptions = mutationOptionRecord[key];
      const observer = this.observers.get(key);

      if (!observer) {
        this.createObserver(key, currentOptions);
        return;
      }

      observer.setOptions({
        ...currentOptions,
        mutationFn: currentOptions.mutationFn,
      });
    });

    Array.from(this.observers.keys()).forEach((key) => {
      if (!nextKeys.has(key)) {
        this.removeObserver(key);
      }
    });

    this.updateSnapshot(false);
  }

  private createObserver(key: string, options: UnknownMutationOption): void {
    const observer = new MutationObserver(this.queryClient, {
      ...options,
      mutationFn: options.mutationFn,
    });

    this.observers.set(key, observer);
    this.observerUnsubscribes.set(
      key,
      observer.subscribe(() => {
        this.updateSnapshot(true);
      }),
    );
  }

  private emit(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }

  private removeObserver(key: string): void {
    this.observerUnsubscribes.get(key)?.();
    this.observerUnsubscribes.delete(key);
    this.observers.delete(key);
  }

  private buildSnapshot(): Record<string, UnknownMutationResult> {
    const nextSnapshot: Record<string, UnknownMutationResult> = {};

    Object.keys(this.mutationOptionRecord).forEach((key) => {
      const currentOptions = this.mutationOptionRecord[key];
      const observer = this.observers.get(key);

      if (!observer) {
        nextSnapshot[key] = createIdleRequestMutationResult(currentOptions);
        return;
      }

      nextSnapshot[key] = toRequestMutationResult(
        toInternalMutationResult(observer),
        currentOptions.loadingMode ?? "button",
      );
    });

    return nextSnapshot;
  }

  private updateSnapshot(shouldNotify: boolean): void {
    const nextSnapshot = this.buildSnapshot();

    if (isSnapshotEqual(this.snapshot, nextSnapshot)) {
      return;
    }

    this.snapshot = nextSnapshot;

    if (shouldNotify) {
      this.emit();
    }
  }
}

const createIdleRequestMutationResult = (options: UnknownMutationOption): UnknownMutationResult => {
  const loadingMode = options.loadingMode ?? "button";

  return {
    buttonLoading: false,
    data: undefined,
    error: null,
    isError: false,
    isSuccess: false,
    loading: false,
    loadingMode,
    pageLoading: false,
    reset: () => undefined,
    submit: () => undefined,
    submitAsync: async () => {
      throw new Error("Mutation observer is not ready yet.");
    },
  };
};

const isSnapshotEqual = (
  previousSnapshot: Record<string, UnknownMutationResult>,
  nextSnapshot: Record<string, UnknownMutationResult>,
): boolean => {
  const previousKeys = Object.keys(previousSnapshot);
  const nextKeys = Object.keys(nextSnapshot);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => {
    const previousMutation = previousSnapshot[key];
    const nextMutation = nextSnapshot[key];

    if (!previousMutation || !nextMutation) {
      return false;
    }

    return (
      previousMutation.buttonLoading === nextMutation.buttonLoading &&
      previousMutation.data === nextMutation.data &&
      previousMutation.error === nextMutation.error &&
      previousMutation.isError === nextMutation.isError &&
      previousMutation.isSuccess === nextMutation.isSuccess &&
      previousMutation.loading === nextMutation.loading &&
      previousMutation.loadingMode === nextMutation.loadingMode &&
      previousMutation.pageLoading === nextMutation.pageLoading
    );
  });
};
