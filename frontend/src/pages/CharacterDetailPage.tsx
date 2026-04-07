/**
 * CharacterDetailPage — thin orchestrator.
 *
 * Reads route params, loads the character via useCharacterDetail, and
 * composes the section widgets. All data fetching, state, and business
 * logic live in the hook + section components under features/characters/.
 */
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCharacterDetail } from '@/features/characters/hooks/useCharacterDetail';
import {
  CharacterHeroSection,
  CharacterAppearanceSection,
  CharacterBackgroundSection,
  CharacterGmNotesSection,
  CharacterGroupMembershipsSection,
  CharacterRelationsSection,
} from '@/features/characters/sections';
import { NotFoundState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function CharacterDetailPage() {
  const { t } = useTranslation('party');
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const cId = campaignId ?? '';
  const chId = charId ?? '';

  const detail = useCharacterDetail(cId, chId);
  const {
    character,
    isLoading,
    isError,
    isGm,
    canViewAll,
    partyEnabled,
    groupsEnabled,
    speciesEnabled,
    imgVersion,
    campaignTitle,
    saveField,
    handleImageUpload,
    handleDelete,
  } = detail;

  if (!partyEnabled) return <SectionDisabled campaignId={cId} />;

  if (isLoading && !character) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !character) {
    return <NotFoundState backTo={`/campaigns/${cId}/party`} backLabel={t('title')} />;
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
          <CharacterHeroSection
            campaignId={cId}
            character={character}
            isGm={isGm}
            speciesEnabled={speciesEnabled}
            imgVersion={imgVersion}
            onUploadImage={handleImageUpload}
            onDelete={handleDelete}
          />

          <div className="flex flex-col md:flex-row gap-8 min-w-0">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-8">
              <CharacterAppearanceSection
                character={character}
                isGm={isGm}
                onSaveField={saveField}
              />
              <CharacterBackgroundSection
                character={character}
                isGm={isGm}
                canViewAll={canViewAll}
                onSaveField={saveField}
              />
              <CharacterGmNotesSection
                character={character}
                isGm={isGm}
                onSaveField={saveField}
              />
            </div>

            {/* Right column */}
            <div className="md:w-[40%] lg:w-[35%] min-w-0 space-y-8">
              <CharacterGroupMembershipsSection
                campaignId={cId}
                character={character}
                isGm={isGm}
                canViewAll={canViewAll}
                enabled={groupsEnabled}
              />
              <CharacterRelationsSection
                campaignId={cId}
                characterId={chId}
                isGm={isGm}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
