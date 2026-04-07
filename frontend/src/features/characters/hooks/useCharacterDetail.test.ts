/**
 * Smoke test for useCharacterDetail.
 *
 * Verifies the hook returns the expected shape. We don't mock the Apollo
 * queries here — the hook should still return a defined object with
 * defaults (no character loaded yet, isGm false, handlers present).
 */
import { describe, it, expect } from 'vitest';
import { useCharacterDetail } from './useCharacterDetail';
import { renderHookWithProviders } from '@/test/helpers';

describe('useCharacterDetail', () => {
  it('returns the expected shape with defaults when no data is loaded', () => {
    const { result } = renderHookWithProviders(() => useCharacterDetail('camp-1', 'char-1'));
    expect(result.current.character).toBeUndefined();
    expect(result.current.isGm).toBe(false);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.canViewAll).toBe(false);
    expect(typeof result.current.saveField).toBe('function');
    expect(typeof result.current.handleImageUpload).toBe('function');
    expect(typeof result.current.handleDelete).toBe('function');
  });

  it('canViewAll derives from isGm OR isOwner', () => {
    // With no auth and no campaign, both are false.
    const { result } = renderHookWithProviders(() => useCharacterDetail('camp-x', 'char-x'));
    expect(result.current.canViewAll).toBe(result.current.isGm || result.current.isOwner);
  });
});
