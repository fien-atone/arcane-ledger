/**
 * SocialGraphHeroSection — header card for SocialGraphPage.
 *
 * Contains the page title/subtitle, the force/chord view-mode toggle, and
 * the link back to the NPC list view. Presentational: viewMode + setter
 * come from useSocialGraphPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../hooks/useSocialGraphPage';

interface Props {
  campaignId: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SocialGraphHeroSection({
  campaignId,
  viewMode,
  onViewModeChange,
}: Props) {
  const { t } = useTranslation('social');

  return (
    <header className="flex-shrink-0 mx-4 sm:mx-8 mb-4 bg-surface-container border border-outline-variant/20 rounded-sm p-6 overflow-hidden">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {t('title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Graph type toggle */}
          <div className="flex bg-surface-container-high rounded-sm border border-outline-variant/20 overflow-hidden">
            <button
              onClick={() => onViewModeChange('force')}
              title={t('view_force_title')}
              className={`px-3 py-2 flex items-center gap-1.5 text-xs transition-colors ${
                viewMode === 'force'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span className="hidden sm:inline">{t('view_force')}</span>
            </button>
            <button
              onClick={() => onViewModeChange('chord')}
              title={t('view_chord_title')}
              className={`px-3 py-2 flex items-center gap-1.5 text-xs transition-colors ${
                viewMode === 'chord'
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                donut_large
              </span>
              <span className="hidden sm:inline">{t('view_chord')}</span>
            </button>
          </div>
          {/* List view link */}
          <Link
            to={`/campaigns/${campaignId}/npcs`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-on-surface-variant border border-outline-variant/20 rounded-sm hover:text-primary hover:border-primary/30 transition-colors"
            title={t('view_list_title')}
          >
            <span className="material-symbols-outlined text-[18px]">list</span>
            <span className="hidden sm:inline">{t('view_list')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
