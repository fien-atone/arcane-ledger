/**
 * useDebouncedSearch — small utility for debounced text input state.
 *
 * Returns `{ value, debouncedValue, setValue }`:
 *  - `value` updates synchronously on every `setValue` call (drive the input)
 *  - `debouncedValue` lags behind by `delay` ms (drive the network query)
 *
 * The debounce timer is cleared on every new input and on unmount, so a fast
 * typer only triggers a single query for the final value.
 *
 * Used by list pages that push search into GraphQL variables (F-11) — we
 * want the URL and the input to stay live while only firing a new query
 * when the user stops typing.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseDebouncedSearchResult {
  /** Latest value — updates immediately on setValue. Drive the <input>. */
  value: string;
  /** Debounced value — lags behind by `delay` ms. Drive the query variable. */
  debouncedValue: string;
  /** Setter — updates `value` immediately, schedules `debouncedValue`. */
  setValue: (v: string) => void;
}

export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300,
): UseDebouncedSearchResult {
  const [value, setValueState] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync when the caller changes `initialValue` (e.g., URL param restored
  // from back/forward navigation). This deliberately bypasses the debounce
  // so the URL drives the query instantly on navigation.
  useEffect(() => {
    setValueState(initialValue);
    setDebouncedValue(initialValue);
  }, [initialValue]);

  const setValue = useCallback(
    (next: string) => {
      setValueState(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDebouncedValue(next);
        timerRef.current = null;
      }, delay);
    },
    [delay],
  );

  // Clear pending timer on unmount to avoid setState-after-unmount warnings.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { value, debouncedValue, setValue };
}
