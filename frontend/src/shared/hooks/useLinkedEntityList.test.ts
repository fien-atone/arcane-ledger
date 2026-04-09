/**
 * Unit tests for useLinkedEntityList — the unified picker + search +
 * remove-confirm state machine used by 8 linked-entity section widgets.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLinkedEntityList } from './useLinkedEntityList';

interface Item {
  id: string;
  name: string;
}

const base = (
  linked: Item[],
  candidates: Item[],
) => ({
  linked,
  candidates,
  getCandidateId: (c: Item) => c.id,
  getCandidateSearchText: (c: Item) => c.name,
});

describe('useLinkedEntityList', () => {
  it('starts with picker closed, empty search, no pending remove', () => {
    const { result } = renderHook(() => useLinkedEntityList(base([], [])));
    expect(result.current.pickerOpen).toBe(false);
    expect(result.current.search).toBe('');
    expect(result.current.confirmRemoveId).toBeNull();
  });

  it('openPicker opens without resetting search; closePicker resets search', () => {
    const { result } = renderHook(() => useLinkedEntityList(base([], [])));
    act(() => result.current.setSearch('aeg'));
    act(() => result.current.openPicker());
    expect(result.current.pickerOpen).toBe(true);
    expect(result.current.search).toBe('aeg');
    act(() => result.current.closePicker());
    expect(result.current.pickerOpen).toBe(false);
    expect(result.current.search).toBe('');
  });

  it('availableFiltered excludes already-linked candidates via default isLinked', () => {
    const linked: Item[] = [{ id: 'a', name: 'Aria' }];
    const candidates: Item[] = [
      { id: 'a', name: 'Aria' },
      { id: 'b', name: 'Bram' },
      { id: 'c', name: 'Cassia' },
    ];
    const { result } = renderHook(() => useLinkedEntityList(base(linked, candidates)));
    const ids = result.current.availableFiltered.map((c) => c.id);
    expect(ids).toEqual(['b', 'c']);
  });

  it('availableFiltered applies case-insensitive substring search', () => {
    const candidates: Item[] = [
      { id: 'a', name: 'Aria' },
      { id: 'b', name: 'Bram' },
      { id: 'c', name: 'Cassia' },
    ];
    const { result } = renderHook(() => useLinkedEntityList(base([], candidates)));
    act(() => result.current.setSearch('  Ri  '));
    const ids = result.current.availableFiltered.map((c) => c.id);
    expect(ids).toEqual(['a']);
  });

  it('empty search shows all non-linked candidates', () => {
    const candidates: Item[] = [
      { id: 'a', name: 'Aria' },
      { id: 'b', name: 'Bram' },
    ];
    const { result } = renderHook(() => useLinkedEntityList(base([], candidates)));
    expect(result.current.availableFiltered).toHaveLength(2);
  });

  it('respects custom getLinkedId when linked shape differs from candidate id', () => {
    interface Membership { groupId: string; role: string }
    const linked: Membership[] = [{ groupId: 'g1', role: 'leader' }];
    const candidates: Item[] = [
      { id: 'g1', name: 'Order of the Dawn' },
      { id: 'g2', name: 'Silent Hand' },
    ];
    const { result } = renderHook(() =>
      useLinkedEntityList<Membership, Item>({
        linked,
        candidates,
        getCandidateId: (c) => c.id,
        getCandidateSearchText: (c) => c.name,
        getLinkedId: (m) => m.groupId,
      }),
    );
    const ids = result.current.availableFiltered.map((c) => c.id);
    expect(ids).toEqual(['g2']);
  });

  it('respects custom isLinked override', () => {
    const linked: Item[] = [{ id: 'a', name: 'Aria' }];
    const candidates: Item[] = [
      { id: 'a', name: 'Aria' },
      { id: 'b', name: 'Bram' },
    ];
    // Custom: nothing is ever linked.
    const { result } = renderHook(() =>
      useLinkedEntityList<Item, Item>({
        ...base(linked, candidates),
        isLinked: () => false,
      }),
    );
    expect(result.current.availableFiltered).toHaveLength(2);
  });

  it('askRemove / cancelRemove / isAskingRemove transitions', () => {
    const { result } = renderHook(() => useLinkedEntityList(base([], [])));
    act(() => result.current.askRemove('row-1'));
    expect(result.current.confirmRemoveId).toBe('row-1');
    expect(result.current.isAskingRemove('row-1')).toBe(true);
    expect(result.current.isAskingRemove('row-2')).toBe(false);
    act(() => result.current.askRemove('row-2'));
    expect(result.current.confirmRemoveId).toBe('row-2');
    act(() => result.current.cancelRemove());
    expect(result.current.confirmRemoveId).toBeNull();
    expect(result.current.isAskingRemove('row-2')).toBe(false);
  });

  it('two independent instances do not share state', () => {
    const { result } = renderHook(() => {
      const npcs = useLinkedEntityList(
        base([], [{ id: 'n1', name: 'Alice' }, { id: 'n2', name: 'Bob' }]),
      );
      const chars = useLinkedEntityList(
        base([], [{ id: 'c1', name: 'Char A' }]),
      );
      return { npcs, chars };
    });

    act(() => result.current.npcs.openPicker());
    act(() => result.current.npcs.setSearch('ali'));
    act(() => result.current.chars.askRemove('c1'));

    expect(result.current.npcs.pickerOpen).toBe(true);
    expect(result.current.npcs.search).toBe('ali');
    expect(result.current.npcs.availableFiltered.map((c) => c.id)).toEqual(['n1']);
    expect(result.current.npcs.confirmRemoveId).toBeNull();

    expect(result.current.chars.pickerOpen).toBe(false);
    expect(result.current.chars.search).toBe('');
    expect(result.current.chars.availableFiltered).toHaveLength(1);
    expect(result.current.chars.confirmRemoveId).toBe('c1');
    expect(result.current.chars.isAskingRemove('c1')).toBe(true);
  });

  it('availableFiltered updates when linked list changes', () => {
    const candidates: Item[] = [
      { id: 'a', name: 'Aria' },
      { id: 'b', name: 'Bram' },
    ];
    const { result, rerender } = renderHook(
      ({ linked }: { linked: Item[] }) =>
        useLinkedEntityList(base(linked, candidates)),
      { initialProps: { linked: [] as Item[] } },
    );
    expect(result.current.availableFiltered).toHaveLength(2);
    rerender({ linked: [{ id: 'a', name: 'Aria' }] });
    expect(result.current.availableFiltered.map((c) => c.id)).toEqual(['b']);
  });

  it('closePicker does not clear the pending remove id', () => {
    const { result } = renderHook(() => useLinkedEntityList(base([], [])));
    act(() => result.current.askRemove('x'));
    act(() => result.current.openPicker());
    act(() => result.current.closePicker());
    expect(result.current.confirmRemoveId).toBe('x');
  });
});
