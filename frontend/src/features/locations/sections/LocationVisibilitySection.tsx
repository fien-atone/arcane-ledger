/**
 * Player visibility panel for locations. Renders only when:
 *   - the party module is enabled, AND
 *   - the current viewer is the GM.
 *
 * Owns its own mutation hook. Wrapped in the same `bg-surface-container` card
 * as the original page so the visual layout is unchanged.
 */
import { useTranslation } from 'react-i18next';
import { VisibilityPanel, SectionPanel } from '@/shared/ui';
import { useSetLocationVisibility } from '@/features/locations/api';
import { LOCATION_VISIBILITY_FIELDS, LOCATION_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import type { Location } from '@/entities/location';

interface Props {
  campaignId: string;
  location: Location;
  isGm: boolean;
  partyEnabled: boolean;
}

export function LocationVisibilitySection({ campaignId, location, isGm, partyEnabled }: Props) {
  const { t } = useTranslation('locations');
  const setLocationVisibility = useSetLocationVisibility();

  if (!isGm || !partyEnabled) return null;

  return (
    <SectionPanel>
      <VisibilityPanel
        playerVisible={location.playerVisible ?? false}
        playerVisibleFields={location.playerVisibleFields ?? []}
        fields={LOCATION_VISIBILITY_FIELDS}
        basicPreset={LOCATION_BASIC_PRESET}
        autoVisibleLabels={[t('field_type')]}
        onToggleVisible={(v) =>
          setLocationVisibility.mutate({
            campaignId,
            id: location.id,
            playerVisible: v,
            playerVisibleFields: location.playerVisibleFields ?? [],
          })
        }
        onToggleField={(f, on) => {
          const fields = on
            ? [...(location.playerVisibleFields ?? []), f]
            : (location.playerVisibleFields ?? []).filter((x) => x !== f);
          setLocationVisibility.mutate({
            campaignId,
            id: location.id,
            playerVisible: location.playerVisible ?? false,
            playerVisibleFields: fields,
          });
        }}
        onSetPreset={(fields) =>
          setLocationVisibility.mutate({
            campaignId,
            id: location.id,
            playerVisible: location.playerVisible ?? false,
            playerVisibleFields: fields,
          })
        }
        isPending={setLocationVisibility.isPending}
      />
    </SectionPanel>
  );
}
