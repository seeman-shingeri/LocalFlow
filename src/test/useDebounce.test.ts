import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, debounce } from '@/hooks/useDebounce';

describe('Enterprise Debounced Search (useDebounce & debounce)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays updating the debounced value until specified delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    expect(result.current).toBe('initial');

    // Simulate typing 'S'
    rerender({ value: 'S', delay: 300 });
    expect(result.current).toBe('initial');

    // Advance 150ms (halfway through delay)
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial');

    // User types 'Su'
    rerender({ value: 'Su', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial');

    // Advance remaining full 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('Su');
  });

  it('debounces function execution and preserves last arguments', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 200);

    debounced('first');
    debounced('second');
    debounced('third');

    expect(mockFn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('third');
  });

  it('supports cancelling debounced callbacks', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 200);

    debounced('test');
    debounced.cancel();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('supports flushing debounced callbacks immediately', () => {
    const mockFn = vi.fn();
    const debounced = debounce(mockFn, 500);

    debounced('immediate');
    debounced.flush();

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('immediate');
  });
});
