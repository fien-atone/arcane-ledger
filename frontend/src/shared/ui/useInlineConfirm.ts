/**
 * useInlineConfirm — state machine for the inline "Remove? Yes/No" pattern
 * that sits inline with a list row or hero toolbar.
 *
 * Owns only the pending id. The section decides what the "idle" button
 * (usually an × icon or a "Delete" text button) looks like, and pairs
 * this hook with the <InlineConfirm> component to render the asking-state
 * UI when `isAsking(id)` returns true.
 *
 * Generic over the id type. For boolean cases (hero delete) pass the
 * entity id as the sentinel — cleaner than a separate boolean flag.
 */
import { useState, useCallback } from 'react';

export interface InlineConfirmState<T> {
  pendingId: T | null;
  ask: (id: T) => void;
  cancel: () => void;
  isAsking: (id: T) => boolean;
}

export function useInlineConfirm<T = string>(): InlineConfirmState<T> {
  const [pendingId, setPendingId] = useState<T | null>(null);
  const ask = useCallback((id: T) => setPendingId(id), []);
  const cancel = useCallback(() => setPendingId(null), []);
  const isAsking = useCallback((id: T) => pendingId === id, [pendingId]);
  return { pendingId, ask, cancel, isAsking };
}
