import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useSpecies } from '@/features/species/api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { SpeciesEditDrawer } from '@/features/species/ui';
import { EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
// SIZE_LABEL resolved via t() inside the component

export default function SpeciesPage() {
  const { t } = useTranslation('species');
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const speciesEnabled = useSectionEnabled(campaignId ?? '', 'species');
  const typesEnabled = useSectionEnabled(campaignId ?? '', 'species_types');
  const { data: speciesList, isLoading, isError } = useSpecies(campaignId);
  const { data: speciesTypes } = useSpeciesTypes(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? 'all';

  const [drawerOpen, setDrawerOpen] = useState(false);

  const resolveTypeName = (typeId: string) =>
    typesEnabled ? (speciesTypes?.find((t) => t.id === typeId)?.name ?? typeId) : '';

  const typeFilters = useMemo(() => {
    if (!typesEnabled) return [];
    return [
      { value: 'all', label: t('filter_all') },
      ...(speciesTypes ?? []).map((t) => ({ value: t.id, label: t.name })),
    ];
  }, [typesEnabled, speciesTypes]);

  const filtered = useMemo(() => {
    if (!speciesList) return [];
    return speciesList.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [speciesList, search, typeFilter]);

  if (!speciesEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

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
            <button
              onClick={() => setDrawerOpen(true)}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">{t('add_species')}</span>
            </button>
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
            {typeFilters.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {typeFilters.map(({ value, label }) => {
                  const count = value === 'all'
                    ? (speciesList?.length ?? 0)
                    : (speciesList?.filter((s) => s.type === value).length ?? 0);
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
              <span className="text-on-surface font-bold">{filtered.length}</span> of <span className="text-primary font-bold">{speciesList?.length ?? 0}</span>
            </span>
          </div>
        </div>

        {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>{t('loading')}</div>}
        {isError && <p className="text-tertiary text-sm p-12">{t('error')}</p>}

        {!isLoading && !isError && (
          filtered.length === 0 ? (
            <EmptyState icon="blur_on" title={t('empty_title')} subtitle={t('empty_subtitle')} />
          ) : (
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
              {/* Column headers */}
              <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
                <span className="w-9 flex-shrink-0" />
                <span className="flex-1 min-w-0">{t('column_name')}</span>
                <span className="w-28 flex-shrink-0 hidden lg:block">{t('column_type')}</span>
                <span className="w-24 flex-shrink-0 hidden md:block">{t('column_size')}</span>
              </div>
              {filtered.map((s) => {
                const typeName = resolveTypeName(s.type);
                return (
                  <Link
                    key={s.id}
                    to={`/campaigns/${campaignId}/species/${s.id}`}
                    className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full min-w-0">
                      <div className="w-9 h-9 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                        <span className="text-[10px] font-bold text-on-surface-variant/60">
                          {s.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{s.name}</p>
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate md:hidden">
                          {[typesEnabled ? typeName : null, t(`size_${s.size}`)].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 truncate hidden lg:block">
                        {typesEnabled && typeName ? typeName : '—'}
                      </span>
                      <span className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 hidden md:block">
                        {t(`size_${s.size}`)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>{/* end max-w-5xl container */}

    </main>

    <SpeciesEditDrawer campaignId={campaignId ?? ''} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
