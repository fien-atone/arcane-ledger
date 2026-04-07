/**
 * LocationDetailPage — thin orchestrator.
 *
 * Reads route params, loads the root location via useLocationDetail, and
 * composes the section widgets. All data fetching, state, and business
 * logic live in the hook + section components under features/locations/.
 */
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocationDetail } from '@/features/locations/hooks/useLocationDetail';
import {
  LocationHeroSection,
  LocationDescriptionSection,
  LocationGmNotesSection,
  LocationAdjacentSection,
  LocationNpcsSection,
  LocationSessionsSection,
  LocationImageSection,
  LocationParentSection,
  LocationMiniMapSection,
  LocationChildrenSection,
  LocationVisibilitySection,
} from '@/features/locations/sections';
import { NotFoundState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function LocationDetailPage() {
  const { t } = useTranslation('locations');
  const { id: campaignId, locationId } = useParams<{ id: string; locationId: string }>();
  const cId = campaignId ?? '';
  const lId = locationId ?? '';

  const detail = useLocationDetail(cId, lId);
  const {
    location,
    isLoading,
    isError,
    isGm,
    locationsEnabled,
    npcsEnabled,
    sessionsEnabled,
    locationTypesEnabled,
    partyEnabled,
    imgVersion,
    campaignTitle,
    saveField,
    saveMarkers,
    handleImageUpload,
    handleDelete,
  } = detail;

  if (!locationsEnabled) return <SectionDisabled campaignId={cId} />;

  if (isLoading && !location) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !location) {
    return <NotFoundState backTo={`/campaigns/${cId}/locations`} backLabel={t('title')} />;
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
          <LocationHeroSection
            campaignId={cId}
            location={location}
            isGm={isGm}
            locationTypesEnabled={locationTypesEnabled}
            onDelete={handleDelete}
          />

          <div className="flex flex-col md:flex-row gap-8 min-w-0">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-8">
              <LocationDescriptionSection
                location={location}
                isGm={isGm}
                onSaveField={saveField}
              />
              <LocationGmNotesSection
                location={location}
                isGm={isGm}
                onSaveField={saveField}
              />
              <LocationAdjacentSection
                campaignId={cId}
                location={location}
                locationTypesEnabled={locationTypesEnabled}
              />
              <LocationNpcsSection
                campaignId={cId}
                location={location}
                isGm={isGm}
                enabled={npcsEnabled}
                partyEnabled={partyEnabled}
              />
              <LocationSessionsSection
                campaignId={cId}
                location={location}
                enabled={sessionsEnabled}
              />
            </div>

            {/* Right column */}
            <div className="md:w-[40%] lg:w-[35%] min-w-0 space-y-8 self-start">
              <LocationImageSection
                campaignId={cId}
                location={location}
                isGm={isGm}
                locationTypesEnabled={locationTypesEnabled}
                imgVersion={imgVersion}
                onUploadImage={handleImageUpload}
                onSaveMarkers={saveMarkers}
              />
              <LocationParentSection
                campaignId={cId}
                location={location}
                locationTypesEnabled={locationTypesEnabled}
              />
              <LocationMiniMapSection
                campaignId={cId}
                location={location}
                locationTypesEnabled={locationTypesEnabled}
              />
              <LocationChildrenSection
                campaignId={cId}
                location={location}
                isGm={isGm}
                partyEnabled={partyEnabled}
                locationTypesEnabled={locationTypesEnabled}
              />
              <LocationVisibilitySection
                campaignId={cId}
                location={location}
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
