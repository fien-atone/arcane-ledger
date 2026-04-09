/**
 * LocationDescriptionSection — public-facing description for a location.
 *
 * GM gets the inline rich-text editor; players get read-only formatted content.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { Location } from '@/entities/location';

interface Props {
  location: Location;
  isGm: boolean;
  onSaveField: (field: keyof Location, html: string) => void;
}

export function LocationDescriptionSection({ location, isGm, onSaveField }: Props) {
  const { t } = useTranslation('locations');

  return (
    <SectionPanel>
      <InlineRichField
        label={t('section_description')}
        value={location.description}
        onSave={(html) => onSaveField('description', html)}
        placeholder={t('placeholder_description')}
        readOnly={!isGm}
      />
    </SectionPanel>
  );
}
