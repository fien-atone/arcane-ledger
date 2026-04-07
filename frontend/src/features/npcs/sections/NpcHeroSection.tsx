/**
 * NPC hero header — portrait, name, edit/delete actions, and the lightbox.
 * Composes NpcIdentityPills + NpcAliasList for the in-card identity bits.
 */
import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageUpload } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { NpcIdentityPills, NpcAliasList } from './NpcIdentitySection';
import type { NPC } from '@/entities/npc';

interface Props {
  campaignId: string;
  npc: NPC;
  isGm: boolean;
  speciesEnabled: boolean;
  imgVersion: number;
  onUploadImage: (file: File) => Promise<void> | void;
  onDelete: () => void;
}

/** Isolated portrait — only re-renders when image or name actually change. */
const NpcPortrait = memo(function NpcPortrait({ image, name }: { image?: string | null; name: string }) {
  const resolved = resolveImageUrl(image);
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="relative w-36 sm:w-48 h-48 sm:h-64 rounded-sm bg-surface-container-low flex items-center justify-center overflow-hidden">
      {resolved ? (
        <>
          <img src={resolved} aria-hidden alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 pointer-events-none" />
          <img src={resolved} alt={name} className="relative w-full h-full object-contain drop-shadow-2xl" />
        </>
      ) : (
        <span className="font-headline text-[8rem] font-bold text-on-surface-variant/10 select-none leading-none">
          {initials}
        </span>
      )}
    </div>
  );
});

export function NpcHeroSection({ campaignId, npc, isGm, speciesEnabled, imgVersion, onUploadImage, onDelete }: Props) {
  const { t } = useTranslation('npcs');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const handleViewImage = useCallback(() => setLightbox(true), []);

  return (
    <>
      <section className="relative flex flex-col sm:flex-row gap-8 items-start mb-8 bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8">
        <div className="relative group flex-shrink-0">
          <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          {isGm ? (
            <ImageUpload
              image={resolveImageUrl(npc.image, imgVersion)}
              name={npc.name}
              className="relative w-36 sm:w-48 h-48 sm:h-64"
              onUpload={onUploadImage}
              onView={handleViewImage}
            />
          ) : (
            <NpcPortrait image={npc.image} name={npc.name} />
          )}
        </div>

        <div className="flex-1 pt-4 space-y-8">
          <NpcIdentityPills campaignId={campaignId} npc={npc} speciesEnabled={speciesEnabled} />
          {isGm && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                  <span className="text-[9px] text-on-surface-variant">{t('confirm_delete')}</span>
                  <button onClick={onDelete}
                    className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">{t('confirm_yes')}</button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">{t('confirm_no')}</button>
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
                {t('edit')}
              </button>
            </div>
          )}
          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
            {npc.name}
          </h1>
          <NpcAliasList npc={npc} />
        </div>
      </section>

      <NpcEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId}
        npc={npc}
      />

      {lightbox && npc.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <img
            src={resolveImageUrl(npc.image, imgVersion)}
            alt={npc.name}
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
