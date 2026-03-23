import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocations } from '@/features/locations/api';
import type { LocationType } from '@/entities/location';

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

const DEPTH_INDENT = ['', 'pl-6', 'pl-12', 'pl-16', 'pl-20'];

const TYPE_ORDER: LocationType[] = ['region', 'settlement', 'district', 'building', 'dungeon'];

const TYPE_FILTERS: Array<{ value: LocationType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'region', label: 'Regions' },
  { value: 'settlement', label: 'Settlements' },
  { value: 'district', label: 'Districts' },
  { value: 'building', label: 'Buildings' },
  { value: 'dungeon', label: 'Dungeons' },
];


export default function LocationListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: locations, isLoading, isError } = useLocations(campaignId ?? '');
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all');
  const [search, setSearch] = useState('');

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

  const filtered = locations
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
    });

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Locations
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Known places, landmarks, and territories.
            </p>
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

      <div className="px-10 py-10 pb-24 max-w-5xl">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search locations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
            />
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {TYPE_FILTERS.map(({ value, label }) => {
            const count = value === 'all'
              ? (locations?.length ?? 0)
              : (locations?.filter((l) => l.type === value).length ?? 0);
            return (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1.5 ${
                typeFilter === value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-[9px] font-bold ${typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}`}>
                  {count}
                </span>
              )}
            </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 text-on-surface-variant py-8">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading locations…
          </div>
        )}

        {isError && (
          <p className="text-tertiary text-sm py-8">
            Failed to load locations. Check your connection and try again.
          </p>
        )}

        {/* Location list */}
        {filtered && filtered.length > 0 && (
          <div className="space-y-1">
            {filtered.map((loc) => {
              const depth = typeFilter === 'all' ? (depthMap.get(loc.id) ?? 0) : 0;
              const isTopLevel = depth === 0;
              const indent = DEPTH_INDENT[Math.min(depth, DEPTH_INDENT.length - 1)];
              return (
                <Link
                  key={loc.id}
                  to={`/campaigns/${campaignId}/locations/${loc.id}`}
                  className={`group flex items-center gap-4 py-4 px-4 hover:bg-surface-container-low transition-all duration-200 border-b border-outline-variant/5 ${
                    isTopLevel ? 'border-l-4 border-l-primary/30' : 'border-l-4 border-l-transparent'
                  } ${indent}`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] flex-shrink-0 ${
                      isTopLevel ? 'text-primary/60' : 'text-on-surface-variant/30'
                    }`}
                  >
                    {TYPE_ICON[loc.type]}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-headline transition-colors ${
                          isTopLevel
                            ? 'text-base font-bold text-on-surface group-hover:text-primary'
                            : 'text-sm text-on-surface group-hover:text-primary'
                        }`}
                      >
                        {loc.name}
                      </span>
                      {loc.aliases.length > 0 && (
                        <span className="text-[10px] text-on-surface-variant/40 italic hidden sm:block">
                          {loc.aliases[0]}
                        </span>
                      )}
                      <span className="text-[9px] uppercase tracking-wider text-on-surface-variant/20 font-bold">
                        {TYPE_LABEL[loc.type]}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5 truncate hidden sm:block">
                      {loc.description}
                    </p>
                  </div>

                  <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary/60 transition-colors flex-shrink-0 text-lg">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filtered && filtered.length === 0 && !isLoading && (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">
              location_off
            </span>
            <p className="font-headline text-2xl text-on-surface-variant">No locations found.</p>
          </div>
        )}

      </div>
    </main>
  );
}
