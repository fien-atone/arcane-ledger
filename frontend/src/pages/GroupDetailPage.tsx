/**
 * GroupDetailPage — thin orchestrator.
 *
 * Reads route params, loads the root group entity via useGroupDetail, and
 * composes the section widgets. All data fetching, state, and business
 * logic live in the hook + section components under features/groups/.
 */
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroupDetail } from '@/features/groups/hooks/useGroupDetail';
import {
  GroupHeroSection,
  GroupAboutSection,
  GroupGoalsSection,
  GroupSymbolsSection,
  GroupGmNotesSection,
  GroupMembersSection,
  GroupVisibilitySection,
} from '@/features/groups/sections';
import { NotFoundState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function GroupDetailPage() {
  const { t } = useTranslation('groups');
  const { id: campaignId, groupId } = useParams<{ id: string; groupId: string }>();
  const cId = campaignId ?? '';
  const gId = groupId ?? '';

  const detail = useGroupDetail(cId, gId);
  const {
    group, isLoading, isError, isGm, partyEnabled, groupsEnabled, groupTypesEnabled,
    campaignTitle, saveField, handleDelete,
  } = detail;

  if (!groupsEnabled) return <SectionDisabled campaignId={cId} />;

  if (isLoading && !group) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !group) {
    return <NotFoundState backTo={`/campaigns/${cId}/groups`} backLabel={t('title')} />;
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
          <GroupHeroSection
            campaignId={cId}
            group={group}
            isGm={isGm}
            groupTypesEnabled={groupTypesEnabled}
            onDelete={handleDelete}
          />

          <div className="flex flex-col md:flex-row gap-8 min-w-0">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-8">
              <GroupAboutSection group={group} isGm={isGm} onSaveField={saveField} />
              <GroupGoalsSection group={group} isGm={isGm} onSaveField={saveField} />
              <GroupSymbolsSection group={group} isGm={isGm} onSaveField={saveField} />
              <GroupGmNotesSection group={group} isGm={isGm} onSaveField={saveField} />
            </div>

            {/* Right column */}
            <div className="md:w-[380px] md:flex-shrink-0 space-y-8">
              <GroupMembersSection
                campaignId={cId}
                groupId={gId}
                isGm={isGm}
                partyEnabled={partyEnabled}
              />
              <GroupVisibilitySection
                campaignId={cId}
                group={group}
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
