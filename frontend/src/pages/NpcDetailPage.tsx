/**
 * NpcDetailPage — thin orchestrator.
 *
 * Reads route params, loads the root NPC entity via useNpcDetail, and
 * composes the section widgets. All data fetching, state, and business
 * logic live in the hook + section components under features/npcs/.
 */
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNpcDetail } from '@/features/npcs/hooks/useNpcDetail';
import {
  NpcHeroSection,
  NpcAppearanceSection,
  NpcGmNotesPanel,
  NpcBackgroundSection,
  NpcGroupMembershipsSection,
  NpcLocationsSection,
  NpcQuestsSection,
  NpcSessionsSection,
  NpcRelationsSection,
  NpcVisibilitySection,
} from '@/features/npcs/sections';
import { NotFoundState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function NpcDetailPage() {
  const { t } = useTranslation('npcs');
  const { id: campaignId, npcId } = useParams<{ id: string; npcId: string }>();
  const cId = campaignId ?? '';
  const nId = npcId ?? '';

  const detail = useNpcDetail(cId, nId);
  const {
    npc, isLoading, isError, isGm, partyEnabled, npcsEnabled, sessionsEnabled,
    questsEnabled, groupsEnabled, locationsEnabled, locationTypesEnabled,
    speciesEnabled, imgVersion, campaignTitle, saveField, handleImageUpload, handleDelete,
  } = detail;

  if (!npcsEnabled) return <SectionDisabled campaignId={cId} />;

  if (isLoading && !npc) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !npc) {
    return <NotFoundState backTo={`/campaigns/${cId}/npcs`} backLabel={t('title')} />;
  }

  return (
    <>
      <SectionBackground />
      <main className="flex-1 min-h-screen relative z-10">
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
          <NpcHeroSection
            campaignId={cId}
            npc={npc}
            isGm={isGm}
            speciesEnabled={speciesEnabled}
            imgVersion={imgVersion}
            onUploadImage={handleImageUpload}
            onDelete={handleDelete}
          />

          <div className="flex flex-col md:flex-row gap-8 min-w-0">
            {/* Left column (60-65%) */}
            <div className="flex-1 min-w-0 space-y-8">
              <NpcAppearanceSection npc={npc} isGm={isGm} onSaveField={saveField} />
              <NpcBackgroundSection npc={npc} isGm={isGm} onSaveField={saveField} />
              <NpcGmNotesPanel npc={npc} isGm={isGm} onSaveField={saveField} />
            </div>

            {/* Right column (35-40%) */}
            <div className="md:w-[40%] lg:w-[35%] min-w-0 space-y-8 self-start bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <NpcGroupMembershipsSection
                campaignId={cId} npc={npc} isGm={isGm}
                enabled={groupsEnabled} partyEnabled={partyEnabled}
              />
              <NpcLocationsSection
                campaignId={cId} npc={npc} isGm={isGm}
                enabled={locationsEnabled} partyEnabled={partyEnabled}
                locationTypesEnabled={locationTypesEnabled}
              />
              <NpcQuestsSection
                campaignId={cId} npcId={nId} isGm={isGm}
                enabled={questsEnabled} partyEnabled={partyEnabled}
              />
              <NpcSessionsSection campaignId={cId} npcId={nId} enabled={sessionsEnabled} />
              <NpcRelationsSection campaignId={cId} npc={npc} isGm={isGm} />
              <NpcVisibilitySection
                campaignId={cId} npc={npc} isGm={isGm} partyEnabled={partyEnabled}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
