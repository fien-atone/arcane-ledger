import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpeciesById, useSaveSpecies, useDeleteSpecies } from '@/features/species/api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { SpeciesEditDrawer } from '@/features/species/ui';
import { BackLink, InlineRichField } from '@/shared/ui';
import type { SpeciesSize } from '@/entities/species';

const SIZE_LABEL: Record<SpeciesSize, string> = {
  tiny: 'Tiny', small: 'Small', medium: 'Medium',
  large: 'Large', huge: 'Huge', gargantuan: 'Gargantuan',
};

const SIZE_ORDER: SpeciesSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

export default function SpeciesDetailPage() {
  const { id: campaignId, speciesId } = useParams<{ id: string; speciesId: string }>();
  const { data: species, isLoading, isError } = useSpeciesById(campaignId, speciesId);
  const { data: speciesTypes } = useSpeciesTypes(campaignId);
  const saveSpecies = useSaveSpecies(campaignId ?? '');
  const deleteSpecies = useDeleteSpecies();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const saveDescription = useCallback((html: string) => {
    if (!species) return;
    saveSpecies.mutate({ ...species, description: html || undefined });
  }, [species, saveSpecies]);

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !species) {
    return <main className="p-12 text-on-surface-variant text-sm">Species not found.</main>;
  }

  const sizeIdx = SIZE_ORDER.indexOf(species.size);

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/species`}>Species</BackLink>
      </div>

      <div className="max-w-3xl px-10 py-8 pb-20">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-headline text-5xl font-bold text-on-surface tracking-tight">
              {species.name}
            </h1>
            {species.pluralName && species.pluralName !== species.name + 's' && (
              <p className="text-on-surface-variant/50 text-xs italic mt-1">pl. {species.pluralName}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="px-3 py-1 bg-surface-container border border-outline-variant/20 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant rounded-sm">
              {speciesTypes?.find((t) => t.id === species.type)?.name ?? species.type}
            </span>
            <div className="flex gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
                  <span className="text-[10px] text-on-surface-variant">Delete?</span>
                  <button onClick={() => deleteSpecies.mutate(species.id, { onSuccess: () => navigate(`/campaigns/${campaignId}/species`) })}
                    className="px-2 py-0.5 text-[10px] font-label uppercase text-error">Yes</button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-2 py-0.5 text-[10px] font-label uppercase text-on-surface-variant">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-on-surface-variant/40 text-xs font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-5 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Species
              </button>
            </div>
          </div>
        </div>

        {/* Size bar */}
        <div className="mb-10">
          <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold mb-2">Size</p>
          <div className="flex items-center gap-1">
            {SIZE_ORDER.map((sz, i) => (
              <div
                key={sz}
                className={`flex-1 h-1 rounded-full transition-all ${i <= sizeIdx ? 'bg-primary/50' : 'bg-outline-variant/20'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-on-surface-variant/30 uppercase tracking-widest">Tiny</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${species.size !== 'tiny' && species.size !== 'gargantuan' ? 'text-primary/70' : 'text-on-surface-variant/40'}`}>
              {SIZE_LABEL[species.size]}
            </span>
            <span className="text-[9px] text-on-surface-variant/30 uppercase tracking-widest">Gargantuan</span>
          </div>
        </div>

        {/* Description — edit in place */}
        <div className="mb-10">
          <InlineRichField
            label="Overview"
            value={species.description}
            onSave={saveDescription}
            placeholder="Describe this species…"
          />
        </div>

        {/* Traits */}
        {species.traits && species.traits.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">Racial Traits</h2>
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
          </section>
        )}
      </div>

      <SpeciesEditDrawer campaignId={campaignId ?? ""}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        species={species}
      />
    </main>
  );
}
