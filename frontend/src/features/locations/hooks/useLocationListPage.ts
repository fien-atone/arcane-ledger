/**
 * Page-level state and data for LocationListPage (Tier 2 list page).
 *
 * F-11: search and type filtering are SERVER-SIDE. This hook:
 *
 *  - Reads `?q` and `?type` from the URL
 *  - Drives the <input> off a local debounced state (300 ms). The URL
 *    updates live on every keystroke; the GraphQL query only re-fires
 *    once the user stops typing.
 *  - Passes the debounced search + type to `useLocations`, which uses
 *    Apollo v4's `previousData` to keep the existing list visible while
 *    the new query is in flight.
 *  - Removes the client-side `useMemo` search/type filter — the list
 *    returned from the query is already filtered by the server.
 *  - Hierarchical sort is still applied locally in the "all, no search"
 *    mode because the server returns the full list in that case.
 *
 * Type-filter chip counts: removed for the F-11 pilot. The server returns
 * the filtered list, so counts per type are no longer directly available.
 * Re-adding them would require a second aggregation query — deferred.
 *
 * Loads:
 * - The campaign (for the title in the back link + role check)
 * - The (server-filtered) list of locations for the campaign
 * - The location types catalog (for icons + filter chips)
 *
 * Owns the page-level UI state:
 * - URL search params (q, type) — mirrored into search + typeFilter
 * - addOpen — whether the "add location" drawer is open
 *
 * Derives:
 * - typeMap (id -> LocationTypeEntry)
 * - typeFilters (all + location types that exist in the catalog, ordered
 *   by category, WITHOUT counts)
 * - depthMap (location id -> nesting depth, for indentation)
 * - filtered (server-returned list with hierarchical sort in the default
 *   all/no-search mode)
 */
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import {
  useLocations,
  useSetLocationVisibility,
} from '@/features/locations/api';
import { useLocationTypes } from '@/features/locationTypes';
import { useDebouncedSearch } from '@/shared/hooks';
import type { Location, LocationType } from '@/entities/location';
import type { LocationTypeEntry } from '@/entities/locationType';

const CATEGORY_ORDER = [
  'world',
  'geographic',
  'water',
  'civilization',
  'poi',
  'travel',
];

export type TypeMap = Map<string, LocationTypeEntry>;

export interface TypeFilterOption {
  value: LocationType | 'all';
  label: string;
}

export interface UseLocationListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  locationsEnabled: boolean;
  locationTypesEnabled: boolean;
  partyEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Server-filtered list. Stays populated via Apollo previousData during
   *  in-flight refetches — callers should NOT show a blank state based on
   *  isFetching alone. */
  locations: Location[] | undefined;
  filtered: Location[];
  typeMap: TypeMap;
  typeFilters: TypeFilterOption[];
  depthMap: Map<string, number>;
  search: string;
  setSearch: (v: string) => void;
  typeFilter: LocationType | 'all';
  setTypeFilter: (v: LocationType | 'all') => void;
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  toggleVisibility: (loc: Location) => void;
}

export function useLocationListPage(campaignId: string): UseLocationListPageResult {
  const { t } = useTranslation('locations');
  const locationsEnabled = useSectionEnabled(campaignId, 'locations');
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const { data: campaign } = useCampaign(campaignId);
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const typeFilter = (searchParams.get('type') ?? 'all') as LocationType | 'all';

  // Debounced search: drives the network variable; the URL and the input
  // stay live on every keystroke.
  const { value: search, debouncedValue: debouncedSearch, setValue: setDebouncedSearch } =
    useDebouncedSearch(urlSearch, 300);

  const typeFilterForQuery = typeFilter === 'all' ? undefined : typeFilter;

  const {
    data: locations,
    isLoading,
    isFetching,
    isError,
  } = useLocations(campaignId, {
    search: debouncedSearch || undefined,
    type: typeFilterForQuery,
  });
  const setLocationVisibility = useSetLocationVisibility();
  const { data: locationTypes = [] } = useLocationTypes(campaignId);

  const [addOpen, setAddOpen] = useState(false);

  const setSearch = useCallback(
    (val: string) => {
      setDebouncedSearch(val);
      setSearchParams(
        (prev) => {
          if (val) prev.set('q', val);
          else prev.delete('q');
          return prev;
        },
        { replace: true },
      );
    },
    [setDebouncedSearch, setSearchParams],
  );

  const setTypeFilter = useCallback(
    (val: LocationType | 'all') => {
      setSearchParams(
        (prev) => {
          if (val === 'all') prev.delete('type');
          else prev.set('type', val);
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Build id -> entry lookup
  const typeMap = useMemo<TypeMap>(
    () => new Map(locationTypes.map((lt) => [lt.id, lt])),
    [locationTypes],
  );

  // Type order based on category hierarchy
  const typeOrder = useMemo(
    () =>
      [...locationTypes]
        .sort(
          (a, b) =>
            CATEGORY_ORDER.indexOf(a.category) -
            CATEGORY_ORDER.indexOf(b.category),
        )
        .map((lt) => lt.id),
    [locationTypes],
  );

  // Filter chips: All + every defined location type (counts dropped — see
  // F-11 note in the header).
  const typeFilters = useMemo<TypeFilterOption[]>(() => {
    const usedTypes = typeOrder
      .map((id) => typeMap.get(id))
      .filter((lt): lt is LocationTypeEntry => !!lt);
    return [
      { value: 'all' as const, label: t('filter_all') },
      ...usedTypes.map((lt) => ({ value: lt.id, label: lt.name })),
    ];
  }, [typeOrder, typeMap, t]);

  // Depth map for hierarchy indent — works against the current list.
  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!locations) return map;
    locations.forEach((l) => {
      if (!l.parentLocationId) map.set(l.id, 0);
    });
    let changed = true;
    while (changed) {
      changed = false;
      locations.forEach((l) => {
        if (!map.has(l.id) && l.parentLocationId) {
          const pd = map.get(l.parentLocationId);
          if (pd !== undefined) {
            map.set(l.id, pd + 1);
            changed = true;
          }
        }
      });
    }
    return map;
  }, [locations]);

  const sortByCategory = useMemo(
    () => (a: Location, b: Location) => {
      const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
      const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
      if (catA !== catB) return catA - catB;
      return a.name.localeCompare(b.name);
    },
    [typeMap],
  );

  // Server already filtered by search + type. Here we only apply the
  // hierarchical sort in the default mode (no search, no type filter) and
  // the flat category sort otherwise. No content filtering.
  const filtered = useMemo(() => {
    const list = locations ?? [];

    if (typeFilter === 'all' && !debouncedSearch) {
      const byParent = new Map<string, Location[]>();
      const roots: Location[] = [];
      for (const loc of list) {
        if (!loc.parentLocationId) {
          roots.push(loc);
        } else {
          if (!byParent.has(loc.parentLocationId))
            byParent.set(loc.parentLocationId, []);
          byParent.get(loc.parentLocationId)!.push(loc);
        }
      }
      const result: Location[] = [];
      const walk = (loc: Location) => {
        result.push(loc);
        (byParent.get(loc.id) ?? []).sort(sortByCategory).forEach(walk);
      };
      roots.sort(sortByCategory).forEach(walk);
      // Orphans (parent not in list): append at end
      const seen = new Set(result.map((l) => l.id));
      list
        .filter((l) => !seen.has(l.id))
        .sort(sortByCategory)
        .forEach((l) => result.push(l));
      return result;
    }

    return [...list].sort(sortByCategory);
  }, [locations, typeFilter, debouncedSearch, sortByCategory]);

  const toggleVisibility = useCallback(
    (loc: Location) => {
      setLocationVisibility.mutate({
        campaignId,
        id: loc.id,
        playerVisible: !loc.playerVisible,
        playerVisibleFields: loc.playerVisibleFields ?? [],
      });
    },
    [campaignId, setLocationVisibility],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    locationsEnabled,
    locationTypesEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isFetching,
    isError,
    locations,
    filtered,
    typeMap,
    typeFilters,
    depthMap,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),
    toggleVisibility,
  };
}
