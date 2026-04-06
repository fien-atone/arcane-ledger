import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSpeciesById, useSaveSpecies, useDeleteSpecies } from '@/features/species/api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { SpeciesEditDrawer } from '@/features/species/ui';
import { InlineRichField, SectionBackground } from '@/shared/ui';
import type { SpeciesSize } from '@/entities/species';

const SIZE_LABEL: Record<SpeciesSize, string> = {
  tiny: 'Tiny', small: 'Small', medium: 'Medium',
  large: 'Large', huge: 'Huge', gargantuan: 'Gargantuan',
};

const SIZE_ORDER: SpeciesSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];

export default function SpeciesDetailPage() {
  const { id: campaignId, speciesId } = useParams<{ id: string; speciesId: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const { data: species, isLoading, isError } = useSpeciesById(campaignId, speciesId);
  const { data: speciesTypes } = useSpeciesTypes(campaignId);
  const typesEnabled = useSectionEnabled(campaignId ?? '', 'species_types');
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
        Loading...
      </main>
    );
  }

  if (isError || !species) {
    return <main className="p-12 text-on-surface-variant text-sm">Species not found.</main>;
  }

  const sizeIdx = SIZE_ORDER.indexOf(species.size);
  const typeName = typesEnabled ? (speciesTypes?.find((t) => t.id === species.type)?.name ?? species.type) : '';

  return (
    <>
    <SectionBackground />
    <main className="flex-1 min-h-screen relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
        {/* Header card */}
        <section className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8 mb-8">
          {/* Edit / Delete — absolute top-right */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            {confirmDelete ? (
              <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                <span className="text-[9px] text-on-surface-variant">Delete?</span>
                <button onClick={() => deleteSpecies.mutate(species.id, { onSuccess: () => navigate(`/campaigns/${campaignId}/species`) })}
                  className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">Yes</button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {typesEnabled && typeName && (
              <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-sm border border-outline-variant/10">
                {typeName}
              </span>
            )}
            <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
              {SIZE_LABEL[species.size]}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface leading-tight">
            {species.name}
          </h1>
          {species.pluralName && species.pluralName !== species.name + 's' && (
            <p className="text-on-surface-variant/50 text-xs italic mt-1">pl. {species.pluralName}</p>
          )}
        </section>

        {/* Size bar card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
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

        {/* Description card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <InlineRichField
            label="Overview"
            value={species.description}
            onSave={saveDescription}
            placeholder="Describe this species..."
          />
        </div>

        {/* Traits card */}
        {species.traits && species.traits.length > 0 && (
          <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">Racial Traits</h2>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              {species.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1.5 bg-surface-container-high border border-outline-variant/20 text-xs text-on-surface-variant rounded-sm font-label"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

    </main>

    <SpeciesEditDrawer campaignId={campaignId ?? ""}
      open={editOpen}
      onClose={() => setEditOpen(false)}
      species={species}
    />
    </>
  );
}
