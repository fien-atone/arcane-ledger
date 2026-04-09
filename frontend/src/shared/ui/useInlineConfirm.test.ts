/**
 * Unit tests for useInlineConfirm — the state machine hook backing the
 * inline Yes/No confirm pattern.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInlineConfirm } from './useInlineConfirm';

describe('useInlineConfirm', () => {
  it('starts with no pending id', () => {
    const { result } = renderHook(() => useInlineConfirm<string>());
    expect(result.current.pendingId).toBeNull();
    expect(result.current.isAsking('anything')).toBe(false);
  });

  it('ask(id) sets the pending id and isAsking(id) returns true', () => {
    const { result } = renderHook(() => useInlineConfirm<string>());
    act(() => result.current.ask('row-1'));
    expect(result.current.pendingId).toBe('row-1');
    expect(result.current.isAsking('row-1')).toBe(true);
    expect(result.current.isAsking('row-2')).toBe(false);
  });

  it('cancel() clears the pending id', () => {
    const { result } = renderHook(() => useInlineConfirm<string>());
    act(() => result.current.ask('row-1'));
    act(() => result.current.cancel());
    expect(result.current.pendingId).toBeNull();
    expect(result.current.isAsking('row-1')).toBe(false);
  });

  it('ask(other) swaps the pending id (only one row can be asking at a time)', () => {
    const { result } = renderHook(() => useInlineConfirm<string>());
    act(() => result.current.ask('row-1'));
    act(() => result.current.ask('row-2'));
    expect(result.current.pendingId).toBe('row-2');
    expect(result.current.isAsking('row-1')).toBe(false);
    expect(result.current.isAsking('row-2')).toBe(true);
  });

  it('is generic over the id type', () => {
    const { result } = renderHook(() => useInlineConfirm<number>());
    act(() => result.current.ask(42));
    expect(result.current.pendingId).toBe(42);
    expect(result.current.isAsking(42)).toBe(true);
  });
});
