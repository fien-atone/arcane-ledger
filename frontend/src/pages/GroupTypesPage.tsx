/**
 * GroupTypesPage — thin orchestrator (Tier 2 list/admin page).
 *
 * Reads the campaign id, loads the group-type list via useGroupTypesPage,
 * and composes the section widgets:
 *
 *   - HeroSection             — header card with title + add button
 *   - ListSection (left col)  — searchable list of types
 *   - DetailSection (right)   — visible when an entry is selected
 *
 * Name/icon create + edit go through the GroupTypeEditDrawer, which is
 * opened from the hero ("add new") or the detail section ("edit"). After a
 * successful save the page auto-selects the newly created type.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { useGroupTypesPage } from '@/features/groupTypes/hooks/useGroupTypesPage';
import {
  GroupTypesHeroSection,
  GroupTypesListSection,
  GroupTypeDetailSection,
} from '@/features/groupTypes/sections';
import { GroupTypeEditDrawer } from '@/features/groupTypes/ui';
import type { GroupTypeEntry } from '@/entities/groupType';

export default function GroupTypesPage() {
  const { t } = useTranslation('groups');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useGroupTypesPage(cId);
  const {
    campaignTitle,
    groupTypesEnabled,
    isLoading,
    types,
    selected,
    search,
    setSearch,
    selectType,
    finishCreate,
    clearSelection,
  } = page;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [editingType, setEditingType] = useState<GroupTypeEntry | undefined>(undefined);

  if (!groupTypesEnabled) {
    return <SectionDisabled campaignId={cId} />;
  }

  const openCreate = () => {
    setEditingType(undefined);
    setDrawerKey((k) => k + 1);
    setDrawerOpen(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setEditingType(selected);
    setDrawerOpen(true);
  };

  const handleSaved = (savedId: string) => {
    if (!editingType) finishCreate(savedId);
  };

  return (
    <>
      <SectionBackground />
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
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

        {/* Content -- single max-width container */}
        <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
          <GroupTypesHeroSection onAddNew={openCreate} />

          {isLoading ? (
            <div className="flex items-center gap-3 p-12 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {t('types_loading')}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 min-h-[480px]">
              <GroupTypesListSection
                types={types}
                search={search}
                onSearchChange={setSearch}
                selectedId={selected?.id ?? null}
                showNew={false}
                onSelect={selectType}
              />

              {/* Right panel -- detail card */}
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex-1 overflow-hidden min-h-[400px]">
                {selected ? (
                  <GroupTypeDetailSection
                    key={selected.id}
                    campaignId={cId}
                    entry={selected}
                    onEdit={openEdit}
                    onDeleted={clearSelection}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                    {t('types_select_prompt')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <GroupTypeEditDrawer
        key={editingType?.id ?? `new-${drawerKey}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleSaved}
        campaignId={cId}
        groupType={editingType}
      />
    </>
  );
}
