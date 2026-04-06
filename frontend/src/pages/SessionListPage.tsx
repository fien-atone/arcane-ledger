import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions } from '@/features/sessions/api/queries';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { SessionEditDrawer } from '@/features/sessions/ui';
import { EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';

export default function SessionListPage() {
  const { t, i18n } = useTranslation('sessions');
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  const { id: campaignId } = useParams<{ id: string }>();
  const sessionsEnabled = useSectionEnabled(campaignId ?? '', 'sessions');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';

  const [addOpen, setAddOpen] = useState(false);

  if (!sessionsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const filtered = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter((s) =>
      !search ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.brief?.toLowerCase().includes(search.toLowerCase())
    );
  }, [sessions, search]);

  // Badge computation
  const now = new Date();
  const todayStr = now.toDateString();
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toDateString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const futureStart = new Date(todayStart);
  futureStart.setDate(futureStart.getDate() + 1);
  const futureSessions = [...(sessions ?? [])]
    .filter((s) => s.datetime && new Date(s.datetime) >= futureStart)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const nextSessionId = futureSessions[0]?.id ?? null;

  const pastSessions = (sessions ?? []).filter((s) => s.datetime && new Date(s.datetime) < todayStart);
  const lastSessionId = pastSessions.length > 0 ? pastSessions[0]?.id : null;

  function getBadge(session: { id: string; datetime: string }) {
    const sessionDate = session.datetime ? new Date(session.datetime) : null;
    const isToday = sessionDate && sessionDate.toDateString() === todayStr;
    const isTomorrow = sessionDate && sessionDate.toDateString() === tomorrowStr;
    const isNext = session.id === nextSessionId && !isToday && !isTomorrow;
    const isLast = session.id === lastSessionId;

    if (isToday) return { label: t('badge_today'), cls: 'bg-primary/15 text-primary border-primary/30', pulse: true, dotCls: 'bg-primary' };
    if (isTomorrow) return { label: t('badge_tomorrow'), cls: 'bg-secondary/10 text-secondary border-secondary/20', pulse: true, dotCls: 'bg-secondary' };
    if (isNext) return { label: t('badge_next'), cls: 'bg-secondary/10 text-secondary border-secondary/20', pulse: false, dotCls: '' };
    if (isLast) return { label: t('badge_previous'), cls: 'bg-primary/10 text-primary border-primary/20', pulse: false, dotCls: '' };
    return null;
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

      {/* Content */}
      <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface tracking-tight">{t('title')}</h1>
              <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
            </div>
            {isGm && (
              <button
                onClick={() => setAddOpen(true)}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="font-label text-xs uppercase tracking-widest">{t('new_session')}</span>
              </button>
            )}
          </div>

          {/* Search */}
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
            <span className="ml-auto text-[10px] text-on-surface-variant/40">
              <span className="text-on-surface font-bold">{filtered.length}</span> {t('common:of')} <span className="text-primary font-bold">{sessions?.length ?? 0}</span>
            </span>
          </div>
        </div>

        {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>{t('loading')}</div>}
        {isError && <p className="text-tertiary text-sm p-12">{t('error')}</p>}

        {!isLoading && !isError && (
          filtered.length === 0 ? (
            <EmptyState icon="auto_stories" title={t('empty_title')} subtitle={t('empty_subtitle')} />
          ) : (
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
              {/* Column headers */}
              <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
                <span className="w-10 flex-shrink-0">{t('column_number')}</span>
                <span className="flex-1 min-w-0">{t('column_title')}</span>
                <span className="w-28 flex-shrink-0 hidden sm:block">{t('column_date')}</span>
                <span className="w-24 flex-shrink-0" />
              </div>
              {filtered.map((session) => {
                const badge = getBadge(session);
                return (
                  <Link
                    key={session.id}
                    to={`/campaigns/${campaignId}/sessions/${session.id}`}
                    className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center bg-surface-container-highest border border-outline-variant/20">
                        <span className={`font-headline text-sm font-bold italic ${badge ? 'text-primary/70' : 'text-on-surface-variant/50'}`}>
                          {String(session.number).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{session.title}</p>
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate sm:hidden">
                          {session.datetime ? formatDate(session.datetime) : t('date_tbd')}
                        </p>
                      </div>
                      <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 hidden sm:block">
                        {session.datetime ? formatDate(session.datetime) : t('date_tbd')}
                      </span>
                      <span className="w-24 flex-shrink-0 flex justify-end">
                        {badge && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${badge.cls}`}>
                            {badge.pulse && <span className={`w-1 h-1 rounded-full ${badge.dotCls} animate-pulse`} />}
                            {badge.label}
                          </span>
                        )}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>

    </main>

    <SessionEditDrawer
      open={addOpen}
      onClose={() => setAddOpen(false)}
      campaignId={campaignId ?? ''}
    />
    </>
  );
}
