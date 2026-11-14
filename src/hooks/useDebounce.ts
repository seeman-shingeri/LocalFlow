import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Enterprise Debounce Hook
 * Delays updating the debounced value until after the specified delay has elapsed
 * since the last change. Prevents excessive API queries while users type.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, Math.max(0, delayMs));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

export interface DebouncedFunction<F extends (...args: any[]) => void> {
  (...args: Parameters<F>): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * Creates a debounced function that delays invoking func until after waitMs milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<F extends (...args: any[]) => void>(
  func: F,
  waitMs: number = 300
): DebouncedFunction<F> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<F> | null = null;

  const debounced = function (this: any, ...args: Parameters<F>) {
    lastArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs) {
        func.apply(this, lastArgs);
        lastArgs = null;
      }
    }, Math.max(0, waitMs));
  } as DebouncedFunction<F>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId !== null && lastArgs) {
      clearTimeout(timeoutId);
      timeoutId = null;
      func(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}
