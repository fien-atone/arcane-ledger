/**
 * Tests for useDebouncedSearch.
 *
 * Uses vitest fake timers to control the debounce window precisely and
 * verify that rapid successive updates collapse into a single debounced
 * emission.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedSearch } from './useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes value and debouncedValue to the given initial value', () => {
    const { result } = renderHook(() => useDebouncedSearch('hello', 300));
    expect(result.current.value).toBe('hello');
    expect(result.current.debouncedValue).toBe('hello');
  });

  it('defaults to empty string when no initial value is provided', () => {
    const { result } = renderHook(() => useDebouncedSearch());
    expect(result.current.value).toBe('');
    expect(result.current.debouncedValue).toBe('');
  });

  it('updates value immediately on setValue', () => {
    const { result } = renderHook(() => useDebouncedSearch('', 300));
    act(() => result.current.setValue('a'));
    expect(result.current.value).toBe('a');
  });

  it('delays debouncedValue update by the configured delay', () => {
    const { result } = renderHook(() => useDebouncedSearch('', 300));
    act(() => result.current.setValue('abc'));
    expect(result.current.debouncedValue).toBe('');
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.debouncedValue).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedValue).toBe('abc');
  });

  it('collapses rapid successive updates into a single debounced emission', () => {
    const { result } = renderHook(() => useDebouncedSearch('', 300));
    act(() => result.current.setValue('a'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.setValue('ab'));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.setValue('abc'));
    // Only 200 ms has passed on the latest value's clock — still debounced
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current.debouncedValue).toBe('');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.debouncedValue).toBe('abc');
  });

  it('respects a custom delay', () => {
    const { result } = renderHook(() => useDebouncedSearch('', 50));
    act(() => result.current.setValue('x'));
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.debouncedValue).toBe('x');
  });

  it('clears pending timer on unmount (no debounced update after unmount)', () => {
    const { result, unmount } = renderHook(() => useDebouncedSearch('', 300));
    act(() => result.current.setValue('queued'));
    unmount();
    // Advancing timers must not throw (no setState-after-unmount warning)
    expect(() => {
      vi.advanceTimersByTime(300);
    }).not.toThrow();
  });

  it('re-syncs instantly when initialValue changes (URL navigation case)', () => {
    const { result, rerender } = renderHook(
      ({ initial }: { initial: string }) => useDebouncedSearch(initial, 300),
      { initialProps: { initial: 'first' } },
    );
    expect(result.current.debouncedValue).toBe('first');
    rerender({ initial: 'second' });
    expect(result.current.value).toBe('second');
    expect(result.current.debouncedValue).toBe('second');
  });

  it('setValue schedules only one pending update (old timer cancelled)', () => {
    const { result } = renderHook(() => useDebouncedSearch('', 300));
    act(() => result.current.setValue('a'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    act(() => result.current.setValue('b'));
    // If the first timer had fired, debouncedValue would be 'a' here
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.debouncedValue).toBe('');
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.debouncedValue).toBe('b');
  });

  it('does NOT bypass debounce when initialValue echoes a value we just setValue (URL-sync case)', () => {
    // Simulates the list-page wiring where the caller updates the URL
    // synchronously on every keystroke, and then passes the URL param back
    // in as `initialValue` on the next render. The hook must ignore that
    // echo — otherwise debounce is defeated.
    const { result, rerender } = renderHook(
      ({ initial }: { initial: string }) => useDebouncedSearch(initial, 300),
      { initialProps: { initial: '' } },
    );
    act(() => result.current.setValue('a'));
    expect(result.current.value).toBe('a');
    expect(result.current.debouncedValue).toBe(''); // still debouncing
    // The caller pushes 'a' into the URL, which re-renders the hook with
    // the new initialValue. This used to bypass the debounce.
    rerender({ initial: 'a' });
    expect(result.current.debouncedValue).toBe(''); // STILL debouncing
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedValue).toBe('a'); // only now
  });

  it('exposes stable setValue reference across re-renders (same delay)', () => {
    const { result, rerender } = renderHook(() => useDebouncedSearch('', 300));
    const first = result.current.setValue;
    rerender();
    expect(result.current.setValue).toBe(first);
  });
});
