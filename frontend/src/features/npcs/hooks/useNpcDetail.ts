/**
 * Page-level state and handlers for NpcDetailPage.
 *
 * Loads the root NPC entity, derives role/section flags from the campaign,
 * and exposes shared callbacks (image upload, field save, delete).
 *
 * Section widgets fetch their own additional data — this hook deliberately
 * does NOT pre-load groups/locations/sessions/quests.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNpc, useSaveNpc, useDeleteNpc } from '@/features/npcs/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { uploadFile } from '@/shared/api/uploadFile';
import type { NPC } from '@/entities/npc';

export interface UseNpcDetailResult {
  npc: NPC | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  campaignTitle: string | undefined;
  isGm: boolean;
  npcsEnabled: boolean;
  sessionsEnabled: boolean;
  questsEnabled: boolean;
  groupsEnabled: boolean;
  locationsEnabled: boolean;
  locationTypesEnabled: boolean;
  speciesEnabled: boolean;
  partyEnabled: boolean;
  imgVersion: number;
  saveField: (field: keyof NPC, html: string) => void;
  handleImageUpload: (file: File) => Promise<void>;
  handleDelete: () => void;
  isDeletePending: boolean;
}

export function useNpcDetail(campaignId: string, npcId: string): UseNpcDetailResult {
  const { data: npc, isLoading, isError, refetch } = useNpc(campaignId, npcId);
  const { data: campaign } = useCampaign(campaignId);
  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const sessionsEnabled = useSectionEnabled(campaignId, 'sessions');
  const questsEnabled = useSectionEnabled(campaignId, 'quests');
  const groupsEnabled = useSectionEnabled(campaignId, 'groups');
  const locationsEnabled = useSectionEnabled(campaignId, 'locations');
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');
  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const partyEnabled = useSectionEnabled(campaignId, 'party');

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const saveNpc = useSaveNpc();
  const deleteNpc = useDeleteNpc();
  const navigate = useNavigate();
  const [imgVersion, setImgVersion] = useState(0);

  const saveField = useCallback(
    (field: keyof NPC, html: string) => {
      if (!npc) return;
      if (html.trim() === String(npc[field] ?? '').trim()) return;
      saveNpc.mutate({ ...npc, [field]: html || undefined, updatedAt: new Date().toISOString() });
    },
    [npc, saveNpc],
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!npc) return;
      if (import.meta.env.VITE_USE_MOCK !== 'false') {
        const reader = new FileReader();
        reader.onload = (ev) =>
          saveNpc.mutate({ ...npc, image: ev.target?.result as string, updatedAt: new Date().toISOString() });
        reader.readAsDataURL(file);
        return;
      }
      try {
        await uploadFile(campaignId, 'npc', npc.id, file);
        setImgVersion((v) => v + 1);
        refetch();
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [campaignId, npc, saveNpc, refetch],
  );

  const handleDelete = useCallback(() => {
    if (!npc) return;
    deleteNpc.mutate(
      { campaignId, npcId: npc.id },
      { onSuccess: () => navigate(`/campaigns/${campaignId}/npcs`) },
    );
  }, [campaignId, npc, deleteNpc, navigate]);

  return {
    npc,
    isLoading,
    isError,
    refetch,
    campaignTitle: campaign?.title,
    isGm,
    npcsEnabled,
    sessionsEnabled,
    questsEnabled,
    groupsEnabled,
    locationsEnabled,
    locationTypesEnabled,
    speciesEnabled,
    partyEnabled,
    imgVersion,
    saveField,
    handleImageUpload,
    handleDelete,
    isDeletePending: deleteNpc.isPending,
  };
}
