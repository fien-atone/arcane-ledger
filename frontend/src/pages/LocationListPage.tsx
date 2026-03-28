import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocations } from '@/features/locations/api';
import { LocationEditDrawer } from '@/features/locations/ui';
import { EmptyState } from '@/shared/ui';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocationTypes } from '@/features/locationTypes';
import type { Location, LocationType } from '@/entities/location';
import type { LocationTypeEntry } from '@/entities/locationType';
import { CATEGORY_ICON_COLOR, CATEGORY_HEX_COLOR, CATEGORY_BADGE_CLS } from '@/entities/locationType';

const CATEGORY_ORDER = ['world', 'geographic', 'water', 'civilization', 'poi', 'travel'];

const DEPTH_INDENT = ['', 'pl-8', 'pl-12', 'pl-16', 'pl-20'];

type TypeMap = Map<string, LocationTypeEntry>;

// ─── Left panel list item ────────────────────────────────────────────────────

function LocationRow({
  loc,
  depth,
  selected,
  onSelect,
  typeFilter,
  typeMap,
}: {
  loc: Location;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  typeFilter: LocationType | 'all';
  typeMap: TypeMap;
}) {
  const isTopLevel = depth === 0;
  const indent = typeFilter === 'all' ? DEPTH_INDENT[Math.min(depth, DEPTH_INDENT.length - 1)] : '';
  const typeEntry = typeMap.get(loc.type);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${indent} ${
        selected
          ? 'bg-primary/8 border-l-2 border-l-primary'
          : isTopLevel
          ? 'border-l-2 border-l-primary/20 hover:bg-surface-container-low hover:border-l-primary/50'
          : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border transition-colors ${
        selected
          ? 'bg-primary/10 border-primary/30'
          : 'bg-surface-container border-outline-variant/15'
      }`}>
        <span className={`material-symbols-outlined text-[18px] ${
          typeEntry
            ? CATEGORY_ICON_COLOR[typeEntry.category]
            : 'text-on-surface-variant/30'
        }`}>
          {typeEntry?.icon ?? 'location_on'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm transition-colors ${
          selected ? 'text-primary font-semibold' : isTopLevel ? 'font-medium text-on-surface' : 'text-on-surface/80'
        }`}>
          {loc.name}
        </p>
        <p className={`text-[9px] uppercase tracking-widest mt-0.5 transition-colors ${selected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
          {typeEntry?.name ?? loc.type}
        </p>
      </div>
    </button>
  );
}

// ─── Right panel detail ───────────────────────────────────────────────────────

function LocationDetail({
  loc,
  allLocations,
  campaignId,
  typeMap,
}: {
  loc: Location;
  allLocations: Location[];
  campaignId: string;
  typeMap: TypeMap;
}) {
  const { data: allNpcs } = useNpcs(campaignId);
  const children = allLocations.filter((l) => l.parentLocationId === loc.id).sort((a, b) => {
    const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
    const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
    if (catA !== catB) return catA - catB;
    return a.name.localeCompare(b.name);
  });
  const parent = allLocations.find((l) => l.id === loc.parentLocationId);
  const npcsHere = (allNpcs ?? []).filter((n) =>
    (n.locationPresences ?? []).some((p) => p.locationId === loc.id)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const typeEntry = typeMap.get(loc.type);
  const initials = loc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Image / placeholder */}
      <div className="relative w-full h-56 flex-shrink-0 bg-surface-container-low overflow-hidden">
        {loc.image ? (
          <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-headline text-[6rem] font-bold text-on-surface-variant/8 select-none leading-none">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />
        {/* Type badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-sm border rounded-sm text-[10px] font-bold uppercase tracking-widest ${
            typeEntry ? CATEGORY_BADGE_CLS[typeEntry.category] : 'bg-surface-container/90 border-outline-variant/20 text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined text-[13px]">{typeEntry?.icon ?? 'location_on'}</span>
            {typeEntry?.name ?? loc.type}
          </span>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-6">
        {/* Name + breadcrumb */}
        <div>
          {parent && (
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 mb-1 flex items-center gap-1">
              {(() => { const te = typeMap.get(parent.type); return <span className={`material-symbols-outlined text-[11px] ${te ? CATEGORY_ICON_COLOR[te.category] : ''}`}>{te?.icon ?? 'location_on'}</span>; })()}
              {parent.name}
            </p>
          )}
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{loc.name}</h2>
          {loc.aliases.length > 0 && (
            <p className="text-xs text-on-surface-variant/40 italic mt-0.5">{loc.aliases.join(', ')}</p>
          )}
        </div>

        {/* Stats row */}
        {(loc.settlementPopulation || loc.biome) && (
          <div className="flex flex-wrap gap-4">
            {loc.settlementPopulation && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/40 font-bold">Population</p>
                <p className="text-sm font-bold text-on-surface">{loc.settlementPopulation.toLocaleString()}</p>
              </div>
            )}
            {loc.biome && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/40 font-bold">Terrain</p>
                <p className="text-sm font-bold text-on-surface">
                  {loc.biome.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {loc.description && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Overview</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{loc.description}</p>
          </div>
        )}

        {/* Child locations */}
        {children.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">
                Notable Places <span className="text-primary/60">({children.length})</span>
              </h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  to={`/campaigns/${campaignId}/locations/${child.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-sm text-xs text-on-surface hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {(() => { const te = typeMap.get(child.type); return <span className={`material-symbols-outlined text-[13px] ${te ? '' : 'text-on-surface-variant/40'}`} style={te ? { color: CATEGORY_HEX_COLOR[te.category] } : undefined}>{te?.icon ?? 'location_on'}</span>; })()}
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* NPCs */}
        {npcsHere.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">
                NPCs <span className="text-primary/60">({npcsHere.length})</span>
              </h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {npcsHere.map((npc) => (
                <Link
                  key={npc.id}
                  to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-sm text-xs text-on-surface hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">person</span>
                  {npc.name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LocationListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: locations, isLoading, isError } = useLocations(campaignId ?? '');
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Build id → entry lookup for fast access in sub-components
  const typeMap = useMemo<TypeMap>(
    () => new Map(locationTypes.map((t) => [t.id, t])),
    [locationTypes],
  );

  // Type order based on category hierarchy
  const typeOrder = useMemo(
    () => [...locationTypes].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    ).map((t) => t.id),
    [locationTypes],
  );

  // Filters: All + only types that appear in this campaign's locations
  const typeFilters = useMemo(() => {
    const usedTypeIds = new Set(locations?.map((l) => l.type) ?? []);
    const usedTypes = typeOrder
      .map((id) => typeMap.get(id))
      .filter((t): t is LocationTypeEntry => !!t && usedTypeIds.has(t.id));
    return [
      { value: 'all' as const, label: 'All' },
      ...usedTypes.map((t) => ({ value: t.id, label: t.name })),
    ];
  }, [locations, typeOrder, typeMap]);

  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!locations) return map;
    locations.forEach((l) => { if (!l.parentLocationId) map.set(l.id, 0); });
    let changed = true;
    while (changed) {
      changed = false;
      locations.forEach((l) => {
        if (!map.has(l.id) && l.parentLocationId) {
          const pd = map.get(l.parentLocationId);
          if (pd !== undefined) { map.set(l.id, pd + 1); changed = true; }
        }
      });
    }
    return map;
  }, [locations]);

  const sortByCategory = useMemo(() => (a: Location, b: Location) => {
    const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
    const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
    if (catA !== catB) return catA - catB;
    return a.name.localeCompare(b.name);
  }, [typeMap]);

  const filtered = useMemo(() => {
    const list = locations?.filter((l) => {
      const matchesType = typeFilter === 'all' || l.type === typeFilter;
      const matchesSearch =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
        l.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    }) ?? [];

    // In "all" mode without search: hierarchical sort (parents → children)
    if (typeFilter === 'all' && !search) {
      const byParent = new Map<string, Location[]>();
      const roots: Location[] = [];
      for (const loc of list) {
        if (!loc.parentLocationId) {
          roots.push(loc);
        } else {
          if (!byParent.has(loc.parentLocationId)) byParent.set(loc.parentLocationId, []);
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
      list.filter((l) => !seen.has(l.id)).sort(sortByCategory).forEach((l) => result.push(l));
      return result;
    }

    return [...list].sort(sortByCategory);
  }, [locations, typeFilter, search, sortByCategory]);

  const selected = locations?.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Sticky header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Locations</h1>
            <p className="text-on-surface-variant text-sm mt-1">Known places, landmarks, and territories.</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add_location</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Location</span>
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading locations…
        </div>
      )}
      {isError && (
        <p className="text-tertiary text-sm p-12">Failed to load locations. Check your connection and try again.</p>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            {/* Search */}
            <div className="px-4 pt-4 pb-3 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search locations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>
            </div>

            {/* Type filter pills */}
            <div className="px-4 pb-3 flex flex-wrap gap-1.5 flex-shrink-0">
              {typeFilters.map(({ value, label }) => {
                const count = value === 'all'
                  ? (locations?.length ?? 0)
                  : (locations?.filter((l) => l.type === value).length ?? 0);
                return (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1 ${
                      typeFilter === value
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span className={`text-[8px] font-bold ${typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {filtered.length === 0 && (
                <EmptyState icon="location_on" title="No locations found." />
              )}
              {filtered.map((loc) => (
                <LocationRow
                  key={loc.id}
                  loc={loc}
                  depth={depthMap.get(loc.id) ?? 0}
                  selected={selected?.id === loc.id}
                  onSelect={() => setSelectedId(loc.id)}
                  typeFilter={typeFilter}
                  typeMap={typeMap}
                />
              ))}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <LocationDetail
                  loc={selected}
                  allLocations={locations ?? []}
                  campaignId={campaignId ?? ''}
                  typeMap={typeMap}
                />
                <Link
                  to={`/campaigns/${campaignId}/locations/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                Select a location
              </div>
            )}
          </div>

        </div>
      )}

      <LocationEditDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        campaignId={campaignId ?? ''}
      />
    </main>
  );
}
