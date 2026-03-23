import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocations } from '@/features/locations/api';
import { useNpcs } from '@/features/npcs/api/queries';
import type { Location, LocationType, SettlementType, Climate } from '@/entities/location';

const TYPE_ICON: Record<LocationType, string> = {
  region: 'map',
  settlement: 'location_city',
  district: 'holiday_village',
  building: 'domain',
  dungeon: 'skull',
};

const TYPE_LABEL: Record<LocationType, string> = {
  region: 'Region',
  settlement: 'Settlement',
  district: 'District',
  building: 'Building',
  dungeon: 'Dungeon',
};

const SETTLEMENT_LABEL: Record<SettlementType, string> = {
  village: 'Village',
  town: 'Town',
  city: 'City',
  metropolis: 'Metropolis',
};

const CLIMATE_LABEL: Record<Climate, string> = {
  arctic: 'Arctic', subarctic: 'Subarctic', temperate: 'Temperate',
  continental: 'Continental', maritime: 'Maritime', subtropical: 'Subtropical',
  tropical: 'Tropical', arid: 'Arid', 'semi-arid': 'Semi-Arid', highland: 'Highland',
};

const DEPTH_INDENT = ['', 'pl-8', 'pl-12', 'pl-16', 'pl-20'];
const TYPE_ORDER: LocationType[] = ['region', 'settlement', 'district', 'building', 'dungeon'];

const TYPE_FILTERS: Array<{ value: LocationType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'region', label: 'Regions' },
  { value: 'settlement', label: 'Settlements' },
  { value: 'district', label: 'Districts' },
  { value: 'building', label: 'Buildings' },
  { value: 'dungeon', label: 'Dungeons' },
];

// ─── Left panel list item ────────────────────────────────────────────────────

function LocationRow({
  loc,
  depth,
  selected,
  onSelect,
  typeFilter,
}: {
  loc: Location;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  typeFilter: LocationType | 'all';
}) {
  const isTopLevel = depth === 0;
  const indent = typeFilter === 'all' ? DEPTH_INDENT[Math.min(depth, DEPTH_INDENT.length - 1)] : '';
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
        selected ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'
      }`}>
        <span className={`material-symbols-outlined text-[18px] ${selected ? 'text-primary' : isTopLevel ? 'text-primary/40' : 'text-on-surface-variant/30'}`}>
          {TYPE_ICON[loc.type]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`truncate text-sm transition-colors ${
          selected ? 'text-primary font-semibold' : isTopLevel ? 'font-medium text-on-surface' : 'text-on-surface/80'
        }`}>
          {loc.name}
        </p>
        <p className={`text-[9px] uppercase tracking-widest mt-0.5 transition-colors ${selected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
          {TYPE_LABEL[loc.type]}
        </p>
      </div>
    </button>
  );
}

// ─── Right panel detail ───────────────────────────────────────────────────────

function LocationDetail({ loc, allLocations, campaignId }: { loc: Location; allLocations: Location[]; campaignId: string }) {
  const { data: allNpcs } = useNpcs(campaignId);
  const children = allLocations.filter((l) => l.parentLocationId === loc.id).sort((a, b) => a.name.localeCompare(b.name));
  const parent = allLocations.find((l) => l.id === loc.parentLocationId);
  const npcsHere = (allNpcs ?? []).filter((n) =>
    n.locationPresences?.some((p) => p.locationId === loc.id) ||
    n.locations.some((name) => name === loc.name)
  ).sort((a, b) => a.name.localeCompare(b.name));

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
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">{TYPE_ICON[loc.type]}</span>
            {TYPE_LABEL[loc.type]}
            {loc.settlementType && ` · ${SETTLEMENT_LABEL[loc.settlementType]}`}
          </span>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-6">
        {/* Name + breadcrumb */}
        <div>
          {parent && (
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[11px]">{TYPE_ICON[parent.type]}</span>
              {parent.name}
            </p>
          )}
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{loc.name}</h2>
          {loc.aliases.length > 0 && (
            <p className="text-xs text-on-surface-variant/40 italic mt-0.5">{loc.aliases.join(', ')}</p>
          )}
        </div>

        {/* Stats row */}
        {(loc.settlementPopulation || loc.climate) && (
          <div className="flex flex-wrap gap-4">
            {loc.settlementPopulation && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/40 font-bold">Population</p>
                <p className="text-sm font-bold text-on-surface">{loc.settlementPopulation.toLocaleString()}</p>
              </div>
            )}
            {loc.climate && (
              <div>
                <p className="text-[9px] uppercase tracking-[0.18em] text-on-surface-variant/40 font-bold">Climate</p>
                <p className="text-sm font-bold text-on-surface">{CLIMATE_LABEL[loc.climate]}</p>
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
                Locations <span className="text-primary/60">({children.length})</span>
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
                  <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">{TYPE_ICON[child.type]}</span>
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
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const filtered = useMemo(() => locations
    ?.filter((l) => {
      const matchesType = typeFilter === 'all' || l.type === typeFilter;
      const matchesSearch =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
        l.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const order = TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
      if (order !== 0) return order;
      return a.name.localeCompare(b.name);
    }) ?? [], [locations, typeFilter, search]);

  const selected = locations?.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface overflow-hidden">
      {/* Sticky header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Locations</h1>
            <p className="text-on-surface-variant text-sm mt-1">Known places, landmarks, and territories.</p>
          </div>
          <button
            disabled
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed"
            title="Coming soon"
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
              {TYPE_FILTERS.map(({ value, label }) => {
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
                <p className="text-xs text-on-surface-variant/40 italic p-6">No locations found.</p>
              )}
              {filtered.map((loc) => (
                <LocationRow
                  key={loc.id}
                  loc={loc}
                  depth={depthMap.get(loc.id) ?? 0}
                  selected={selected?.id === loc.id}
                  onSelect={() => setSelectedId(loc.id)}
                  typeFilter={typeFilter}
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
    </main>
  );
}
