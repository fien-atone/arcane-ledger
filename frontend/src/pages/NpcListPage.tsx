import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNpcs, useSetNpcVisibility } from '@/features/npcs/api/queries';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { useSpecies } from '@/features/species/api';
import { EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { NPC, NpcStatus } from '@/entities/npc';

type StatusFilter = 'all' | NpcStatus;

const STATUS_KEYS: StatusFilter[] = ['all', 'alive', 'dead', 'missing', 'unknown'];

const STATUS_STYLES: Record<NpcStatus, { pill: string; dot: string }> = {
  alive:   { pill: 'bg-primary/10 text-primary border border-primary/20', dot: 'bg-primary' },
  dead:    { pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20', dot: 'bg-outline-variant' },
  missing: { pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20', dot: 'bg-on-surface-variant' },
  unknown: { pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10', dot: 'bg-outline' },
};

function NpcAvatar({ name, image }: { name: string; image?: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const resolved = resolveImageUrl(image);
  return (
    <div className="w-9 h-9 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest">
      {resolved ? (
        <img src={resolved} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-on-surface-variant/60">{initials}</span>
        </div>
      )}
    </div>
  );
}

export default function NpcListPage() {
  const { t } = useTranslation('npcs');
  const { id: campaignId } = useParams<{ id: string }>();
  const npcsEnabled = useSectionEnabled(campaignId ?? '', 'npcs');
  const socialGraphEnabled = useSectionEnabled(campaignId ?? '', 'social_graph');
  const speciesEnabled = useSectionEnabled(campaignId ?? '', 'species');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const setNpcVisibility = useSetNpcVisibility();
  const { data: npcs, isLoading, isError } = useNpcs(campaignId ?? '');
  const { data: allSpecies } = useSpecies(campaignId ?? '');

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [addOpen, setAddOpen] = useState(false);

  if (!npcsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const resolveSpeciesName = (npc: NPC) =>
    speciesEnabled ? (allSpecies?.find((s) => s.id === npc.speciesId)?.name ?? npc.species) : undefined;

  const filtered = useMemo(() => {
    if (!npcs) return [];
    return npcs.filter((n) => {
      const matchSearch = !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [npcs, search, statusFilter]);

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

      {/* Content — single max-width container */}
      <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('title')}</h1>
              <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              {socialGraphEnabled && (
                <div className="flex bg-surface-container-high rounded-sm border border-outline-variant/20 overflow-hidden">
                  <button className="p-2 bg-primary/15 text-primary" title={t('list_view')} disabled>
                    <span className="material-symbols-outlined text-[20px]">list</span>
                  </button>
                  <Link
                    to={`/campaigns/${campaignId}/npcs/relationships`}
                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                    title={t('graph_view')}
                  >
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </Link>
                </div>
              )}
              {isGm && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span className="font-label text-xs uppercase tracking-widest">{t('add_npc')}</span>
                </button>
              )}
            </div>
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
            <div className="flex flex-wrap gap-1.5">
              {STATUS_KEYS.map((value) => {
                const label = t(`status_${value}`);
                const count = value === 'all' ? (npcs?.length ?? 0) : (npcs?.filter((n) => n.status === value).length ?? 0);
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSearchParams(prev => {
                        if (value === 'all') prev.delete('status'); else prev.set('status', value);
                        return prev;
                      }, { replace: true });
                    }}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                      statusFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {label} <span className={statusFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                  </button>
                );
              })}
            </div>
            <span className="ml-auto text-[10px] text-on-surface-variant/40">
              <span className="text-on-surface font-bold">{filtered.length}</span> of <span className="text-primary font-bold">{npcs?.length ?? 0}</span>
            </span>
          </div>
        </div>

      {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>{t('loading')}</div>}
      {isError && <p className="text-tertiary text-sm p-12">{t('error')}</p>}

      {!isLoading && !isError && (
        filtered.length === 0 ? (
          <EmptyState icon="person_off" title={t('empty_title')} subtitle={t('empty_subtitle')} />
        ) : (
          <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
              <span className="w-9 flex-shrink-0" />
              <span className="flex-1 min-w-0">{t('column_name')}</span>
              <span className="w-28 flex-shrink-0 hidden lg:block">{t('column_species')}</span>
              <span className="w-14 flex-shrink-0 hidden xl:block">{t('column_age')}</span>
              <span className="w-24 flex-shrink-0">{t('column_status')}</span>
              {isGm && <span className="w-8 flex-shrink-0" />}
            </div>
            {filtered.map((npc) => {
              const st = STATUS_STYLES[npc.status];
              const species = resolveSpeciesName(npc);
              return (
                <Link
                  key={npc.id}
                  to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                  className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    <NpcAvatar name={npc.name} image={npc.image} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{npc.name}</p>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate lg:hidden">
                        {[species, npc.age != null ? `${t('age_prefix')} ${npc.age}` : null].filter(Boolean).join(' · ') || '\u2014'}
                      </p>
                    </div>
                    <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 truncate hidden lg:block">
                      {species || '\u2014'}
                    </span>
                    <span className="w-14 flex-shrink-0 text-xs text-on-surface-variant/60 hidden xl:block">
                      {npc.age != null ? npc.age : '\u2014'}
                    </span>
                    <span className={`w-24 flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${st.pill}`}>
                      <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                      {t(`status_${npc.status}`)}
                    </span>
                    {isGm && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNpcVisibility.mutate({
                            campaignId: campaignId!,
                            id: npc.id,
                            playerVisible: !npc.playerVisible,
                            playerVisibleFields: npc.playerVisibleFields ?? [],
                          });
                        }}
                        title={npc.playerVisible ? t('visible_to_players') : t('hidden_from_players')}
                        className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                          npc.playerVisible ? 'text-primary/60 hover:text-primary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {npc.playerVisible ? 'visibility' : 'visibility_off'}
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

    <NpcEditDrawer
      open={addOpen}
      onClose={() => setAddOpen(false)}
      campaignId={campaignId ?? ''}
    />
    </>
  );
}
