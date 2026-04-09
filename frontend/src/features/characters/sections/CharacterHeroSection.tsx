/**
 * Character hero header — portrait, identity pill (species/gender/class/age),
 * name, GM-gated edit/delete actions, and the lightbox.
 *
 * Self-contained: fetches species list to resolve the displayed species name.
 */
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageUpload, InlineConfirm, useInlineConfirm } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { useSpecies } from '@/features/species/api';
import { CharacterEditDrawer } from '@/features/characters/ui';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  campaignId: string;
  character: PlayerCharacter;
  isGm: boolean;
  speciesEnabled: boolean;
  imgVersion: number;
  onUploadImage: (file: File) => Promise<void> | void;
  onDelete: () => void;
}

export function CharacterHeroSection({
  campaignId,
  character,
  isGm,
  speciesEnabled,
  imgVersion,
  onUploadImage,
  onDelete,
}: Props) {
  const { t } = useTranslation('party');
  const { data: allSpecies } = useSpecies(campaignId);

  const [editOpen, setEditOpen] = useState(false);
  const confirmDelete = useInlineConfirm<string>();
  const [lightbox, setLightbox] = useState(false);

  const handleViewImage = useCallback(() => setLightbox(true), []);

  const matchedSpecies = speciesEnabled
    ? allSpecies?.find(
        (s) =>
          s.id === character.speciesId ||
          s.name.toLowerCase() === character.species?.toLowerCase(),
      )
    : undefined;
  const displaySpecies = speciesEnabled ? (matchedSpecies?.name ?? character.species) : undefined;
  const displayGender = character.gender ? t(`gender_${character.gender}`) : undefined;

  const demoBadge = [
    displaySpecies,
    displayGender,
    character.class,
    character.age != null ? `${t('field_age')} ${character.age}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <section className="relative flex flex-col sm:flex-row gap-8 items-start mb-8 bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8">
        <div className="relative group flex-shrink-0">
          <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          <ImageUpload
            image={resolveImageUrl(character.image, imgVersion)}
            name={character.name}
            className="relative w-36 sm:w-48 h-48 sm:h-64"
            onUpload={onUploadImage}
            onView={character.image ? handleViewImage : undefined}
            hideControls={!isGm}
          />
        </div>

        <div className="flex-1 min-w-0 pt-4 space-y-4">
          {demoBadge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
              <span className="material-symbols-outlined text-[13px]">person</span>
              {demoBadge}
            </span>
          )}
          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
            {character.name}
          </h1>
        </div>

        {isGm && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            {confirmDelete.isAsking(character.id) ? (
              <InlineConfirm
                variant="hero"
                label={t('detail.confirm_delete')}
                onYes={onDelete}
                onNo={confirmDelete.cancel}
              />
            ) : (
              <button
                onClick={() => confirmDelete.ask(character.id)}
                className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {t('detail.edit')}
            </button>
          </div>
        )}
      </section>

      <CharacterEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId}
        character={character}
      />

      {lightbox && character.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <img
            src={resolveImageUrl(character.image, imgVersion)}
            alt={character.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      )}
    </>
  );
}
