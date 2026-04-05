import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSpecies } from '@/features/species/api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { SpeciesEditDrawer } from '@/features/species/ui';
import { RichContent, EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import type { Species, SpeciesSize } from '@/entities/species';

const SIZE_LABEL: Record<SpeciesSize, string> = {
  tiny: 'Tiny', small: 'Small', medium: 'Medium',
  large: 'Large', huge: 'Huge', gargantuan: 'Gargantuan',
};

const SIZE_ORDER: SpeciesSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

function SpeciesPreview({ species, typeName }: { species: Species; typeName: string }) {
  const sizeIdx = SIZE_ORDER.indexOf(species.size);
  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-10 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {[typeName, SIZE_LABEL[species.size]].filter(Boolean).join(' · ')}
          </span>
        </div>
        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{species.name}</h2>
        {species.pluralName && species.pluralName !== species.name + 's' && (
          <p className="text-xs text-on-surface-variant/40 italic mt-0.5">pl. {species.pluralName}</p>
        )}
      </div>

      {/* Size bar */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          {SIZE_ORDER.map((sz, i) => (
            <div key={sz} className={`flex-1 h-1 rounded-full ${i <= sizeIdx ? 'bg-primary/50' : 'bg-outline-variant/20'}`} />
          ))}
        </div>
      </div>

      {species.description && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Overview</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <RichContent value={species.description} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
        </div>
      )}

      {species.traits && species.traits.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Traits</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <div className="flex flex-wrap gap-2">
            {species.traits.map((trait) => (
              <span key={trait} className="px-3 py-1.5 bg-surface-container border border-outline-variant/20 text-xs text-on-surface-variant rounded-sm font-label">{trait}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpeciesPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const speciesEnabled = useSectionEnabled(campaignId ?? '', 'species');
  const typesEnabled = useSectionEnabled(campaignId ?? '', 'species_types');
  const { data: speciesList, isLoading } = useSpecies(campaignId);
  const { data: speciesTypes } = useSpeciesTypes(campaignId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<Species | undefined>(undefined);

  const resolveTypeName = (typeId: string) =>
    typesEnabled ? (speciesTypes?.find((t) => t.id === typeId)?.name ?? typeId) : '';

  const filtered = (speciesList ?? []).filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    return matchSearch && matchType;
  });

  const selected = speciesList?.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  if (!speciesEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const typeFilters = typesEnabled ? [
    { value: 'all', label: 'All' },
    ...(speciesTypes ?? []).map((t) => ({ value: t.id, label: t.name })),
  ] : [];

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-4 flex-shrink-0">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-6 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Species</h1>
            <p className="text-on-surface-variant text-sm mt-1">Races and peoples of the world.</p>
          </div>
          <button onClick={() => { setEditingSpecies(undefined); setDrawerOpen(true); }}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Species</span>
          </button>
        </div>
      </header>

      {isLoading && !speciesList ? (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span> Loading…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex-shrink-0 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input type="text" placeholder="Search species…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {typeFilters.map(({ value, label }) => {
                  const count = value === 'all'
                    ? (speciesList?.length ?? 0)
                    : (speciesList?.filter((s) => s.type === value).length ?? 0);
                  return (
                    <button key={value} onClick={() => setTypeFilter(value)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                        typeFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}>
                      {label} <span className={typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <EmptyState icon="blur_on" title="No species found." />
              ) : filtered.map((s) => (
                <button key={s.id} onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                    selected?.id === s.id ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                  }`}>
                  <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${selected?.id === s.id ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                    <span className={`text-xs font-bold ${selected?.id === s.id ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                      {s.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${selected?.id === s.id ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>{s.name}</p>
                    <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${selected?.id === s.id ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
                      {[typesEnabled ? resolveTypeName(s.type) : null, SIZE_LABEL[s.size]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <SpeciesPreview species={selected} typeName={resolveTypeName(selected.type)} />
                <Link to={`/campaigns/${campaignId}/species/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">Select a species</div>
            )}
          </div>
        </div>
      )}

    </main>

    <SpeciesEditDrawer campaignId={campaignId ?? ''} open={drawerOpen} onClose={() => setDrawerOpen(false)} species={editingSpecies} />
    </>
  );
}
