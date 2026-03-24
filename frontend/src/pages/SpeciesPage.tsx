import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSpecies } from '@/features/species/api';
import { SpeciesEditDrawer } from '@/features/species/ui';
import { RichContent } from '@/shared/ui';
import type { Species, SpeciesType, SpeciesSize } from '@/entities/species';

const TYPE_LABEL: Record<SpeciesType, string> = {
  humanoid: 'Humanoid',
  beast: 'Beast',
  undead: 'Undead',
  construct: 'Construct',
  fey: 'Fey',
  fiend: 'Fiend',
  celestial: 'Celestial',
  dragon: 'Dragon',
  elemental: 'Elemental',
  giant: 'Giant',
  monstrosity: 'Monstrosity',
  plant: 'Plant',
  ooze: 'Ooze',
  aberration: 'Aberration',
};

const SIZE_LABEL: Record<SpeciesSize, string> = {
  tiny: 'Tiny',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  huge: 'Huge',
  gargantuan: 'Gargantuan',
};

const SIZE_ORDER: SpeciesSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];


export default function SpeciesPage() {
  const { id: _campaignId } = useParams<{ id: string }>();
  const { data: speciesList, isLoading } = useSpecies();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<Species | undefined>(undefined);

  const filtered = (speciesList ?? []).filter((s) => {
    if (!search) return true;
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const selected = speciesList?.find((s) => s.id === selectedId) ?? speciesList?.[0] ?? null;

  const handleOpenCreate = () => {
    setEditingSpecies(undefined);
    setDrawerOpen(true);
  };

  return (
    <main className="flex-1 min-h-screen bg-surface flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Species
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Races and peoples of the world.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Species</span>
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel: list */}
          <div className="w-full lg:w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-y-auto">

            {/* Search */}
            <div className="p-4 border-b border-outline-variant/10 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search species…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-xs text-on-surface-variant/40 italic p-6">No species found.</p>
              )}
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                    selected?.id === s.id
                      ? 'bg-primary/8 border-l-2 border-l-primary'
                      : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${selected?.id === s.id ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                    <span className={`text-xs font-bold select-none ${selected?.id === s.id ? 'text-primary' : 'text-on-surface-variant/60'}`}>
                      {s.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate transition-colors ${selected?.id === s.id ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
                      {s.name}
                    </p>
                    <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${selected?.id === s.id ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
                      {TYPE_LABEL[s.type]} · {SIZE_LABEL[s.size]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: detail */}
          <div className="hidden lg:flex flex-col flex-1 overflow-y-auto relative">
            {selected ? (
              <>
                <SpeciesDetail species={selected} />
                <Link
                  to={`/campaigns/${_campaignId}/species/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-on-surface-variant/30 text-sm italic">
                Select a species
              </div>
            )}
          </div>
        </div>
      )}

      <SpeciesEditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        species={editingSpecies}
      />
    </main>
  );
}

function SpeciesDetail({ species }: { species: Species }) {
  const sizeIdx = SIZE_ORDER.indexOf(species.size);
  const initials = species.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <div className="relative w-full h-52 flex-shrink-0 bg-surface-container-low flex items-center justify-center overflow-hidden">
        <span className="font-headline text-[6rem] font-bold text-on-surface-variant/8 select-none leading-none">{initials}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">category</span>
            {TYPE_LABEL[species.type]} · {SIZE_LABEL[species.size]}
          </span>
        </div>
      </div>

      <div className="px-12 py-8 max-w-3xl flex flex-col gap-8">
        {/* Header */}
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{species.name}</h2>
          {species.pluralName && species.pluralName !== species.name + 's' && (
            <p className="text-xs text-on-surface-variant/40 italic mt-0.5">pl. {species.pluralName}</p>
          )}
        </div>

        {/* Size bar */}
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold mb-2">
            Size
          </p>
          <div className="flex items-center gap-1">
            {SIZE_ORDER.map((sz, i) => (
              <div
                key={sz}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i <= sizeIdx ? 'bg-primary/50' : 'bg-outline-variant/20'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-on-surface-variant/30 uppercase tracking-widest">Tiny</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${
              species.size !== 'tiny' && species.size !== 'gargantuan' ? 'text-primary/70' : 'text-on-surface-variant/40'
            }`}>
              {SIZE_LABEL[species.size]}
            </span>
            <span className="text-[9px] text-on-surface-variant/30 uppercase tracking-widest">Gargantuan</span>
          </div>
        </div>

        {/* Description */}
        {species.description && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                Overview
              </h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <RichContent value={species.description} />
          </div>
        )}

        {/* Traits */}
        {species.traits && species.traits.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                Racial Traits
              </h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {species.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1.5 bg-surface-container border border-outline-variant/20 text-xs text-on-surface-variant rounded-sm font-label"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
