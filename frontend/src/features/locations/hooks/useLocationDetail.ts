/**
 * Page-level state and handlers for LocationDetailPage.
 *
 * Loads the root Location entity, derives role/section flags from the campaign,
 * and exposes shared callbacks (image upload, field save, delete, marker save).
 *
 * Section widgets fetch their own additional data — this hook deliberately
 * does NOT pre-load NPCs / sessions / child locations.
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation, useSaveLocation, useDeleteLocation } from '@/features/locations/api';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { uploadFile } from '@/shared/api/uploadFile';
import type { Location, MapMarker } from '@/entities/location';

export interface UseLocationDetailResult {
  location: Location | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  campaignTitle: string | undefined;
  isGm: boolean;
  locationsEnabled: boolean;
  npcsEnabled: boolean;
  sessionsEnabled: boolean;
  locationTypesEnabled: boolean;
  partyEnabled: boolean;
  imgVersion: number;
  saveField: (field: keyof Location, html: string) => void;
  saveMarkers: (markers: MapMarker[]) => void;
  handleImageUpload: (file: File) => Promise<void>;
  handleDelete: () => void;
  isDeletePending: boolean;
}

export function useLocationDetail(campaignId: string, locationId: string): UseLocationDetailResult {
  const { data: location, isLoading, isError, refetch } = useLocation(campaignId, locationId);
  const { data: campaign } = useCampaign(campaignId);
  const locationsEnabled = useSectionEnabled(campaignId, 'locations');
  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const sessionsEnabled = useSectionEnabled(campaignId, 'sessions');
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');
  const partyEnabled = useSectionEnabled(campaignId, 'party');

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const saveLocation = useSaveLocation(campaignId);
  const deleteLocation = useDeleteLocation(campaignId);
  const navigate = useNavigate();
  const [imgVersion, setImgVersion] = useState(0);

  const saveField = useCallback(
    (field: keyof Location, html: string) => {
      if (!location) return;
      saveLocation.mutate({ ...location, [field]: html || undefined });
    },
    [location, saveLocation],
  );

  const saveMarkers = useCallback(
    (markers: MapMarker[]) => {
      if (!location) return;
      saveLocation.mutate({ ...location, mapMarkers: markers });
    },
    [location, saveLocation],
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!location) return;
      if (import.meta.env.VITE_USE_MOCK !== 'false') {
        const reader = new FileReader();
        reader.onload = (ev) =>
          saveLocation.mutate({ ...location, image: ev.target?.result as string });
        reader.readAsDataURL(file);
        return;
      }
      try {
        await uploadFile(campaignId, 'location', location.id, file);
        setImgVersion((v) => v + 1);
        refetch();
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [campaignId, location, saveLocation, refetch],
  );

  const handleDelete = useCallback(() => {
    if (!location) return;
    deleteLocation.mutate(location.id, {
      onSuccess: () => navigate(`/campaigns/${campaignId}/locations`),
    });
  }, [campaignId, location, deleteLocation, navigate]);

  return {
    location,
    isLoading,
    isError,
    refetch,
    campaignTitle: campaign?.title,
    isGm,
    locationsEnabled,
    npcsEnabled,
    sessionsEnabled,
    locationTypesEnabled,
    partyEnabled,
    imgVersion,
    saveField,
    saveMarkers,
    handleImageUpload,
    handleDelete,
    isDeletePending: deleteLocation.isPending,
  };
}
