/**
 * Page-level state and handlers for SessionDetailPage.
 *
 * The sessions API returns a list (no single-session query), so this hook
 * wraps `useSessions(campaignId)` and finds the requested one by id. It
 * derives prev/next siblings, role/section flags, and exposes the shared
 * field-save and delete handlers used by section widgets.
 *
 * Section widgets fetch any extra data (NPCs/Locations/Quests pickers) on
 * their own — this hook deliberately does NOT pre-load them.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSessions,
  useSaveSession,
  useDeleteSession,
  useSessionNote,
} from '@/features/sessions/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import type { Session } from '@/entities/session';

export interface UseSessionDetailResult {
  session: Session | undefined;
  prevSession: Session | undefined;
  nextSession: Session | undefined;
  isLoading: boolean;
  isError: boolean;
  campaignTitle: string | undefined;
  isGm: boolean;
  sessionsEnabled: boolean;
  locationTypesEnabled: boolean;
  partyEnabled: boolean;
  saveField: (field: keyof Session, html: string) => void;
  saveNote: (html: string) => void;
  handleDelete: () => void;
  isDeletePending: boolean;
}

export function useSessionDetail(campaignId: string, sessionId: string): UseSessionDetailResult {
  const sessionsEnabled = useSectionEnabled(campaignId, 'sessions');
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');
  const partyEnabled = useSectionEnabled(campaignId, 'party');

  const { data: campaign } = useCampaign(campaignId);
  const { data: sessions, isLoading, isError } = useSessions(campaignId);
  const session = sessions?.find((s) => s.id === sessionId);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const saveSession = useSaveSession(campaignId);
  const deleteSession = useDeleteSession(campaignId);
  const sessionNote = useSessionNote(campaignId);
  const navigate = useNavigate();

  const saveField = useCallback(
    (field: keyof Session, html: string) => {
      if (!session) return;
      saveSession.mutate({ ...session, [field]: html || undefined });
    },
    [session, saveSession],
  );

  const saveNote = useCallback(
    (html: string) => {
      if (!session) return;
      sessionNote.mutate(session.id, html);
    },
    [session, sessionNote],
  );

  const handleDelete = useCallback(() => {
    if (!session) return;
    deleteSession.mutate(session.id, {
      onSuccess: () => navigate(`/campaigns/${campaignId}/sessions`),
    });
  }, [session, deleteSession, navigate, campaignId]);

  // Prev / next sibling navigation (sorted descending, so prev = older = idx+1)
  const sorted = [...(sessions ?? [])].sort((a, b) => b.number - a.number);
  const idx = sorted.findIndex((s) => s.id === sessionId);
  const prevSession = idx >= 0 ? sorted[idx + 1] : undefined;
  const nextSession = idx >= 0 ? sorted[idx - 1] : undefined;

  return {
    session,
    prevSession,
    nextSession,
    isLoading,
    isError,
    campaignTitle: campaign?.title,
    isGm,
    sessionsEnabled,
    locationTypesEnabled,
    partyEnabled,
    saveField,
    saveNote,
    handleDelete,
    isDeletePending: deleteSession.isPending,
  };
}
