/**
 * Page-level state and handlers for GroupDetailPage.
 *
 * Loads the root Group entity, derives role/section flags from the campaign,
 * and exposes shared callbacks (field save, delete).
 *
 * Section widgets fetch their own additional data (members, group types, etc.)
 * — this hook deliberately does NOT pre-load them.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup, useSaveGroup, useDeleteGroup } from '@/features/groups/api';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import type { Group } from '@/entities/group';

export interface UseGroupDetailResult {
  group: Group | undefined;
  isLoading: boolean;
  isError: boolean;
  campaignTitle: string | undefined;
  isGm: boolean;
  groupsEnabled: boolean;
  groupTypesEnabled: boolean;
  partyEnabled: boolean;
  saveField: (field: keyof Group, html: string) => void;
  handleDelete: () => void;
  isDeletePending: boolean;
}

export function useGroupDetail(campaignId: string, groupId: string): UseGroupDetailResult {
  const groupsEnabled = useSectionEnabled(campaignId, 'groups');
  const groupTypesEnabled = useSectionEnabled(campaignId, 'group_types');
  const partyEnabled = useSectionEnabled(campaignId, 'party');

  const { data: campaign } = useCampaign(campaignId);
  const { data: group, isLoading, isError } = useGroup(campaignId, groupId);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const saveGroup = useSaveGroup();
  const deleteGroup = useDeleteGroup();
  const navigate = useNavigate();

  const saveField = useCallback(
    (field: keyof Group, html: string) => {
      if (!group) return;
      saveGroup.mutate({ ...group, [field]: html || undefined });
    },
    [group, saveGroup],
  );

  const handleDelete = useCallback(() => {
    if (!group) return;
    deleteGroup.mutate(
      { campaignId, groupId: group.id },
      { onSuccess: () => navigate(`/campaigns/${campaignId}/groups`) },
    );
  }, [campaignId, group, deleteGroup, navigate]);

  return {
    group,
    isLoading,
    isError,
    campaignTitle: campaign?.title,
    isGm,
    groupsEnabled,
    groupTypesEnabled,
    partyEnabled,
    saveField,
    handleDelete,
    isDeletePending: deleteGroup.isPending,
  };
}
