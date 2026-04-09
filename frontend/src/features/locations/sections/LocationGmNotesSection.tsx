/**
 * LocationGmNotesSection — GM-only notes panel for a location.
 *
 * Returns null for non-GM viewers, matching the original page behavior.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { Location } from '@/entities/location';

interface Props {
  location: Location;
  isGm: boolean;
  onSaveField: (field: keyof Location, html: string) => void;
}

export function LocationGmNotesSection({ location, isGm, onSaveField }: Props) {
  const { t } = useTranslation('locations');
  if (!isGm) return null;

  return (
    <SectionPanel>
      <InlineRichField
        label={t('section_gm_notes')}
        value={location.gmNotes}
        onSave={(html) => onSaveField('gmNotes', html)}
        isGmNotes
      />
    </SectionPanel>
  );
}
