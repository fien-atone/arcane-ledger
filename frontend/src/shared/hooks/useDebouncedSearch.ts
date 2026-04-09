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
  // Track the last value the caller wrote through `setValue`. We use this
  // to distinguish a true external `initialValue` change (back/forward
  // navigation, link click) from the echo that happens when a caller
  // updates the URL synchronously on every keystroke — in that case the
  // URL reflects the value we JUST set, and we must not bypass the debounce.
  const lastSelfValueRef = useRef(initialValue);

  // Re-sync only when the external `initialValue` actually differs from
  // what we wrote ourselves last time. Handles back/forward navigation
  // without clobbering debounced input that is being echoed back via URL.
  useEffect(() => {
    if (initialValue !== lastSelfValueRef.current) {
      lastSelfValueRef.current = initialValue;
      setValueState(initialValue);
      setDebouncedValue(initialValue);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [initialValue]);

  const setValue = useCallback(
    (next: string) => {
      lastSelfValueRef.current = next;
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
