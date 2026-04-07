/**
 * Page-level state and handlers for CharacterDetailPage.
 *
 * Loads the party list, finds the target character, derives role flags
 * (GM, owner, can-view-all), and exposes shared callbacks.
 *
 * Section widgets fetch their own additional data — this hook deliberately
 * does not pre-load species/groups.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useParty,
  useSaveCharacter,
  useDeleteCharacter,
} from '@/features/characters/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useAuthStore } from '@/features/auth';
import { uploadFile } from '@/shared/api/uploadFile';
import type { PlayerCharacter } from '@/entities/character';

export interface UseCharacterDetailResult {
  character: PlayerCharacter | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  campaignTitle: string | undefined;
  isGm: boolean;
  isOwner: boolean;
  /** GM and character owner can view full details; other players see limited fields. */
  canViewAll: boolean;
  partyEnabled: boolean;
  groupsEnabled: boolean;
  speciesEnabled: boolean;
  imgVersion: number;
  saveField: (field: keyof PlayerCharacter, html: string) => void;
  handleImageUpload: (file: File) => Promise<void>;
  handleDelete: () => void;
  isDeletePending: boolean;
}

export function useCharacterDetail(
  campaignId: string,
  charId: string,
): UseCharacterDetailResult {
  const { data: characters, isLoading, isError, refetch } = useParty(campaignId);
  const character = characters?.find((c) => c.id === charId);

  const { data: campaign } = useCampaign(campaignId);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const groupsEnabled = useSectionEnabled(campaignId, 'groups');
  const speciesEnabled = useSectionEnabled(campaignId, 'species');

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const isOwner = !!character?.userId && character.userId === currentUserId;
  const canViewAll = isGm || isOwner;

  const saveCharacter = useSaveCharacter();
  const deleteCharacter = useDeleteCharacter();
  const navigate = useNavigate();
  const [imgVersion, setImgVersion] = useState(0);

  const saveField = useCallback(
    (field: keyof PlayerCharacter, html: string) => {
      if (!character) return;
      if (html.trim() === String(character[field] ?? '').trim()) return;
      saveCharacter.mutate({
        ...character,
        [field]: html.trim() || undefined,
        updatedAt: new Date().toISOString(),
      } as PlayerCharacter);
    },
    [character, saveCharacter],
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!character) return;
      if (import.meta.env.VITE_USE_MOCK !== 'false') {
        const reader = new FileReader();
        reader.onload = (ev) =>
          saveCharacter.mutate({
            ...character,
            image: ev.target?.result as string,
            updatedAt: new Date().toISOString(),
          });
        reader.readAsDataURL(file);
        return;
      }
      try {
        await uploadFile(campaignId, 'character', character.id, file);
        setImgVersion((v) => v + 1);
        refetch();
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [campaignId, character, saveCharacter, refetch],
  );

  const handleDelete = useCallback(() => {
    if (!character) return;
    deleteCharacter.mutate(
      { campaignId, charId: character.id },
      { onSuccess: () => navigate(`/campaigns/${campaignId}/party`) },
    );
  }, [campaignId, character, deleteCharacter, navigate]);

  return {
    character,
    isLoading,
    isError,
    refetch,
    campaignTitle: campaign?.title,
    isGm,
    isOwner,
    canViewAll,
    partyEnabled,
    groupsEnabled,
    speciesEnabled,
    imgVersion,
    saveField,
    handleImageUpload,
    handleDelete,
    isDeletePending: deleteCharacter.isPending,
  };
}
