import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useGroups, useSetGroupVisibility } from '@/features/groups/api';
import { GroupEditDrawer } from '@/features/groups/ui';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useGroupTypes } from '@/features/groupTypes';
import { EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import type { GroupTypeEntry } from '@/entities/groupType';

function resolveType(typeId: string, groupTypes: GroupTypeEntry[] | undefined): { name: string; icon: string } {
  const found = groupTypes?.find((t) => t.id === typeId);
  return found ? { name: found.name, icon: found.icon } : { name: typeId, icon: 'category' };
}

export default function GroupListPage() {
  const { t } = useTranslation('groups');
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const groupsEnabled = useSectionEnabled(campaignId ?? '', 'groups');
  const groupTypesEnabled = useSectionEnabled(campaignId ?? '', 'group_types');
  const { data: groupTypes } = useGroupTypes(campaignId);

  const setGroupVisibility = useSetGroupVisibility();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? 'all';

  const { data: groups, isLoading, isError } = useGroups(campaignId ?? '', {
    search: search || undefined,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });

  const [addOpen, setAddOpen] = useState(false);

  if (!groupsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const typeFilterItems: Array<{ value: string; label: string }> = groupTypesEnabled ? [
    { value: 'all', label: t('filter_all') },
    ...(groupTypes ?? []).map((t) => ({ value: t.id, label: t.name })),
  ] : [];

  const filtered = useMemo(() => groups ?? [], [groups]);

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? t('common:campaign')}
        </Link>
      </div>

      {/* Content -- single max-width container */}
      <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('title')}</h1>
              <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
            </div>
            {isGm && (
              <button
                onClick={() => setAddOpen(true)}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="font-label text-xs uppercase tracking-widest">{t('add_group')}</span>
              </button>
            )}
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchParams(prev => {
                    if (val) prev.set('q', val); else prev.delete('q');
                    return prev;
                  }, { replace: true });
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
              />
            </div>
            {typeFilterItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {typeFilterItems.map(({ value, label }) => {
                  const count = value === 'all'
                    ? (groups?.length ?? 0)
                    : (groups?.filter((g) => g.type === value).length ?? 0);
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setSearchParams(prev => {
                          if (value === 'all') prev.delete('type'); else prev.set('type', value);
                          return prev;
                        }, { replace: true });
                      }}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                        typeFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {label} <span className={typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <span className="ml-auto text-[10px] text-on-surface-variant/40">
              <span className="text-on-surface font-bold">{filtered.length}</span> of <span className="text-primary font-bold">{groups?.length ?? 0}</span>
            </span>
          </div>
        </div>

        {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>{t('loading')}</div>}
        {isError && <p className="text-tertiary text-sm p-12">{t('error')}</p>}

        {!isLoading && !isError && (
          filtered.length === 0 ? (
            <EmptyState icon="groups" title={t('empty_title')} subtitle={t('empty_subtitle')} />
          ) : (
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
              {/* Column headers */}
              <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
                <span className="w-9 flex-shrink-0" />
                <span className="flex-1 min-w-0">{t('column_name')}</span>
                {groupTypesEnabled && <span className="w-28 flex-shrink-0 hidden lg:block">{t('column_type')}</span>}
                {isGm && <span className="w-8 flex-shrink-0" />}
              </div>
              {filtered.map((g) => {
                const tc = resolveType(g.type, groupTypes);
                return (
                  <Link
                    key={g.id}
                    to={`/campaigns/${campaignId}/groups/${g.id}`}
                    className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-9 h-9 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">{tc.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{g.name}</p>
                        {groupTypesEnabled && (
                          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate lg:hidden">
                            {tc.name}
                          </p>
                        )}
                      </div>
                      {groupTypesEnabled && (
                        <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 truncate hidden lg:block">
                          {tc.name}
                        </span>
                      )}
                      {isGm && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setGroupVisibility.mutate({
                              campaignId: campaignId!,
                              id: g.id,
                              playerVisible: !g.playerVisible,
                              playerVisibleFields: g.playerVisibleFields ?? [],
                            });
                          }}
                          title={g.playerVisible ? t('visible_to_players') : t('hidden_from_players')}
                          className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                            g.playerVisible ? 'text-primary/60 hover:text-primary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {g.playerVisible ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>{/* end max-w-5xl container */}

    </main>

    <GroupEditDrawer
      open={addOpen}
      onClose={() => setAddOpen(false)}
      campaignId={campaignId ?? ''}
    />
    </>
  );
}
