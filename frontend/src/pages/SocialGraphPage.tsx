/**
 * SocialGraphPage — thin orchestrator.
 *
 * Reads route params, loads the page state via useSocialGraphPage, and
 * composes the hero header + the graph view section. All data fetching,
 * state, and business logic live in the hook + sections under
 * features/social-graph/.
 */
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useSocialGraphPage } from '@/features/social-graph/hooks/useSocialGraphPage';
import {
  SocialGraphHeroSection,
  SocialGraphViewSection,
} from '@/features/social-graph/sections';
import { EmptyState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function SocialGraphPage() {
  const { t } = useTranslation('social');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const state = useSocialGraphPage(cId);
  const {
    campaignTitle,
    npcsEnabled,
    socialGraphEnabled,
    viewMode,
    setViewMode,
    isLoading,
    isEmpty,
  } = state;

  if (!npcsEnabled || !socialGraphEnabled) {
    return <SectionDisabled campaignId={cId} />;
  }

  return (
    <>
      <SectionBackground />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Campaign name */}
        <div className="flex justify-center pt-0 pb-4 flex-shrink-0">
          <Link
            to={`/campaigns/${cId}`}
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            {campaignTitle ?? t('common:campaign')}
          </Link>
        </div>

        <SocialGraphHeroSection
          campaignId={cId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {isLoading && (
          <div className="flex items-center gap-3 p-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">
              progress_activity
            </span>
            {t('loading')}
          </div>
        )}

        {isEmpty && (
          <EmptyState
            icon="group_off"
            title={t('empty_title')}
            subtitle={t('empty_subtitle')}
          />
        )}

        {!isLoading && !isEmpty && <SocialGraphViewSection state={state} />}
      </main>
    </>
  );
}
