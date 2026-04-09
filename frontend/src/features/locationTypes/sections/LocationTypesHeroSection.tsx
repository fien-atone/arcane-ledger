/**
 * LocationTypesHeroSection — header card with title, subtitle and the
 * "add new type" call-to-action button.
 *
 * Pure presentational: receives the onAddNew callback from the page.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';

interface Props {
  onAddNew: () => void;
}

export function LocationTypesHeroSection({ onAddNew }: Props) {
  const { t } = useTranslation('locations');

  return (
    <SectionPanel>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {t('types_title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t('types_subtitle')}
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="font-label text-xs uppercase tracking-widest">
            {t('types_add')}
          </span>
        </button>
      </div>
    </SectionPanel>
  );
}
