/**
 * Smoke test for usePartyPage.
 *
 * Verifies the hook returns the expected shape with sensible defaults
 * (empty lists, isEmpty=true, isGm=false) and that the drawer state
 * helpers are wired up correctly.
 */
import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { usePartyPage } from './usePartyPage';
import { renderHookWithProviders } from '@/test/helpers';

describe('usePartyPage', () => {
  it('returns the expected shape with defaults when no data is loaded', () => {
    const { result } = renderHookWithProviders(() => usePartyPage('camp-1'));

    expect(result.current.campaignId).toBe('camp-1');
    expect(result.current.isGm).toBe(false);
    expect(result.current.memberSlots).toEqual([]);
    expect(result.current.otherSlots).toEqual([]);
    expect(result.current.invitationSlots).toEqual([]);
    expect(result.current.unassignedCharacters).toEqual([]);
    expect(result.current.membersWithoutCharacter).toEqual([]);
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.invitePanelOpen).toBe(false);
    expect(result.current.addCharOpen).toBe(false);
    expect(result.current.createForUserId).toBeNull();
  });

  it('toggles invite panel state via setInvitePanelOpen', () => {
    const { result } = renderHookWithProviders(() => usePartyPage('camp-1'));
    act(() => result.current.setInvitePanelOpen(true));
    expect(result.current.invitePanelOpen).toBe(true);
    act(() => result.current.setInvitePanelOpen(false));
    expect(result.current.invitePanelOpen).toBe(false);
  });

  it('openAddCharacter sets the add drawer open and tracks the target user id', () => {
    const { result } = renderHookWithProviders(() => usePartyPage('camp-1'));

    act(() => result.current.openAddCharacter('user-42'));
    expect(result.current.addCharOpen).toBe(true);
    expect(result.current.createForUserId).toBe('user-42');

    act(() => result.current.closeAddCharacter());
    expect(result.current.addCharOpen).toBe(false);
    expect(result.current.createForUserId).toBeNull();
  });

  it('openAddCharacter without an id leaves createForUserId null', () => {
    const { result } = renderHookWithProviders(() => usePartyPage('camp-1'));
    act(() => result.current.openAddCharacter());
    expect(result.current.addCharOpen).toBe(true);
    expect(result.current.createForUserId).toBeNull();
  });
});
