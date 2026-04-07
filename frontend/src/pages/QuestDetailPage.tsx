/**
 * QuestDetailPage — thin orchestrator.
 *
 * Reads route params, loads the root quest via useQuestDetail, and composes
 * the section widgets. All data fetching, state, and business logic live in
 * the hook + section components under features/quests/.
 */
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuestDetail } from '@/features/quests/hooks/useQuestDetail';
import {
  QuestHeroSection,
  QuestDescriptionSection,
  QuestGmNotesSection,
  QuestGiverSection,
  QuestRewardSection,
  QuestSessionsSection,
  QuestVisibilitySection,
} from '@/features/quests/sections';
import { NotFoundState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function QuestDetailPage() {
  const { t } = useTranslation('quests');
  const { id: campaignId, questId } = useParams<{ id: string; questId: string }>();
  const cId = campaignId ?? '';
  const qId = questId ?? '';

  const detail = useQuestDetail(cId, qId);
  const {
    quest,
    isLoading,
    isError,
    isGm,
    questsEnabled,
    npcsEnabled,
    sessionsEnabled,
    partyEnabled,
    campaignTitle,
    saveField,
    changeStatus,
    handleDelete,
  } = detail;

  if (!questsEnabled) return <SectionDisabled campaignId={cId} />;

  if (isLoading && !quest) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !quest) {
    return <NotFoundState backTo={`/campaigns/${cId}/quests`} backLabel={t('title')} />;
  }

  return (
    <>
      <SectionBackground />
      <main className="flex-1 min-h-screen relative z-10">
        {/* Campaign name */}
        <div className="flex justify-center pt-0 pb-8">
          <Link
            to={`/campaigns/${cId}`}
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            {campaignTitle ?? t('common:campaign')}
          </Link>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
          <QuestHeroSection
            campaignId={cId}
            quest={quest}
            isGm={isGm}
            onChangeStatus={changeStatus}
            onDelete={handleDelete}
          />

          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row gap-8 min-w-0">
            {/* Left column — Description, GM Notes */}
            <div className="flex-1 min-w-0 space-y-8">
              <QuestDescriptionSection quest={quest} isGm={isGm} onSaveField={saveField} />
              <QuestGmNotesSection quest={quest} isGm={isGm} onSaveField={saveField} />
            </div>

            {/* Right column — Giver, Reward, Sessions, Visibility */}
            <div className="md:w-[35%] space-y-8">
              <QuestGiverSection campaignId={cId} quest={quest} npcsEnabled={npcsEnabled} />
              <QuestRewardSection quest={quest} isGm={isGm} onSaveField={saveField} />
              <QuestSessionsSection campaignId={cId} quest={quest} sessionsEnabled={sessionsEnabled} />
              <QuestVisibilitySection
                campaignId={cId}
                quest={quest}
                isGm={isGm}
                partyEnabled={partyEnabled}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
