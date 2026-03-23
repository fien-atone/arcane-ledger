import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSpecies, useDeleteSpecies } from '@/features/species/api';
import { SpeciesEditDrawer } from '@/features/species/ui';
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

function SpeciesInitials({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="w-12 h-12 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
      <span className="font-headline text-lg font-bold text-on-surface-variant/40 select-none">
        {initials}
      </span>
    </div>
  );
}

export default function SpeciesPage() {
  const { id: _campaignId } = useParams<{ id: string }>();
  const { data: speciesList, isLoading } = useSpecies();
  const deleteSpecies = useDeleteSpecies();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<Species | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleOpenEdit = (s: Species) => {
    setEditingSpecies(s);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteSpecies.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        if (selectedId === id) setSelectedId(null);
      },
    });
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
          <div className="w-full lg:w-[35%] flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-y-auto">

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
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all ${
                    selected?.id === s.id
                      ? 'bg-primary/5 border-l-2 border-l-primary'
                      : 'hover:bg-surface-container border-l-2 border-l-transparent'
                  }`}
                >
                  <SpeciesInitials name={s.name} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-headline truncate ${selected?.id === s.id ? 'text-primary' : 'text-on-surface'}`}>
                      {s.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40">
                        {TYPE_LABEL[s.type]}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/20">·</span>
                      <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40">
                        {SIZE_LABEL[s.size]}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: detail */}
          <div className="hidden lg:flex flex-col flex-1 overflow-y-auto">
            {selected ? (
              <SpeciesDetail
                species={selected}
                onEdit={() => handleOpenEdit(selected)}
                onDelete={() => setConfirmDeleteId(selected.id)}
              />
            ) : (
              <div className="flex items-center justify-center flex-1 text-on-surface-variant/30 text-sm italic">
                Select a species
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / Create drawer */}
      <SpeciesEditDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        species={editingSpecies}
      />

      {/* Delete confirmation */}
      {confirmDeleteId && (() => {
        const s = speciesList?.find((x) => x.id === confirmDeleteId);
        return (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
            <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-outline-variant/20 rounded-sm shadow-2xl p-8 w-80">
              <h3 className="font-headline text-lg font-bold text-on-surface mb-2">Delete species?</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                <span className="text-primary font-bold">{s?.name}</span> will be permanently removed.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deleteSpecies.isPending}
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        );
      })()}
    </main>
  );
}

function SpeciesDetail({
  species,
  onEdit,
  onDelete,
}: {
  species: Species;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sizeIdx = SIZE_ORDER.indexOf(species.size);
  return (
    <div className="flex-1 px-12 py-10 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-headline text-5xl font-bold text-on-surface tracking-tight">
            {species.name}
          </h2>
          {species.pluralName && species.pluralName !== species.name + 's' && (
            <p className="text-on-surface-variant/50 text-xs italic mt-1">
              pl. {species.pluralName}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="px-3 py-1 bg-surface-container border border-outline-variant/20 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant rounded-sm">
            {TYPE_LABEL[species.type]}
          </span>
          {/* Edit / Delete */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/30 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-on-surface-variant/40 text-[10px] font-label uppercase tracking-widest rounded-sm hover:text-primary hover:border-primary/30 transition-colors"
              title="Delete"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Size bar */}
      <div className="mb-8">
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
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
              Overview
            </h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-on-surface-variant leading-relaxed text-base">
            {species.description}
          </p>
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
  );
}
