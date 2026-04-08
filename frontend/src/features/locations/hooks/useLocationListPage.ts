/**
 * Page-level state and data for LocationListPage (Tier 2 list page).
 *
 * Loads:
 * - The campaign (for the title in the back link + role check)
 * - The full list of locations for the campaign
 * - The location types catalog (for icons + filter chips)
 *
 * Owns the page-level UI state:
 * - URL search params (q, type) — mirrored into search + typeFilter
 * - addOpen — whether the "add location" drawer is open
 *
 * Derives:
 * - typeMap (id -> LocationTypeEntry)
 * - typeFilters (all + used types with counts, ordered by category)
 * - depthMap (location id -> nesting depth, for indentation)
 * - filtered (search + type filter applied, hierarchically sorted when "all")
 *
 * Section widgets receive minimal props and do not re-fetch the list themselves,
 * matching the list-page pattern established by useLocationTypesPage and
 * usePartyPage.
 */
import { useMemo, useState } from 'react';
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
  count: number;
}

export interface UseLocationListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  locationsEnabled: boolean;
  locationTypesEnabled: boolean;
  partyEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isError: boolean;
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

  const { data: locations, isLoading, isError } = useLocations(campaignId);
  const setLocationVisibility = useSetLocationVisibility();
  const { data: locationTypes = [] } = useLocationTypes(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeFilter = (searchParams.get('type') ?? 'all') as LocationType | 'all';

  const [addOpen, setAddOpen] = useState(false);

  const setSearch = (val: string) => {
    setSearchParams(
      (prev) => {
        if (val) prev.set('q', val);
        else prev.delete('q');
        return prev;
      },
      { replace: true },
    );
  };

  const setTypeFilter = (val: LocationType | 'all') => {
    setSearchParams(
      (prev) => {
        if (val === 'all') prev.delete('type');
        else prev.set('type', val);
        return prev;
      },
      { replace: true },
    );
  };

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

  // Filters: All + only types that appear in this campaign's locations
  const typeFilters = useMemo<TypeFilterOption[]>(() => {
    const usedTypeIds = new Set(locations?.map((l) => l.type) ?? []);
    const usedTypes = typeOrder
      .map((id) => typeMap.get(id))
      .filter(
        (lt): lt is LocationTypeEntry => !!lt && usedTypeIds.has(lt.id),
      );
    return [
      {
        value: 'all' as const,
        label: t('filter_all'),
        count: locations?.length ?? 0,
      },
      ...usedTypes.map((lt) => ({
        value: lt.id,
        label: lt.name,
        count: locations?.filter((l) => l.type === lt.id).length ?? 0,
      })),
    ];
  }, [locations, typeOrder, typeMap, t]);

  // Depth map for hierarchy indent
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

  const filtered = useMemo(() => {
    const list =
      locations?.filter((l) => {
        const matchesType = typeFilter === 'all' || l.type === typeFilter;
        const matchesSearch =
          !search ||
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.description.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      }) ?? [];

    // In "all" mode without search: hierarchical sort (parents -> children)
    if (typeFilter === 'all' && !search) {
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
      // Orphans (parent not in filtered list): append at end
      const seen = new Set(result.map((l) => l.id));
      list
        .filter((l) => !seen.has(l.id))
        .sort(sortByCategory)
        .forEach((l) => result.push(l));
      return result;
    }

    return [...list].sort(sortByCategory);
  }, [locations, typeFilter, search, sortByCategory]);

  const toggleVisibility = (loc: Location) => {
    setLocationVisibility.mutate({
      campaignId,
      id: loc.id,
      playerVisible: !loc.playerVisible,
      playerVisibleFields: loc.playerVisibleFields ?? [],
    });
  };

  return {
    campaignId,
    campaignTitle: campaign?.title,
    locationsEnabled,
    locationTypesEnabled,
    partyEnabled,
    isGm,
    isLoading,
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
