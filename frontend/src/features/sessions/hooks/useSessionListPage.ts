/**
 * Page-level state and data for SessionListPage (Tier 2 list page).
 *
 * Loads:
 * - The campaign (for the title in the back link + GM role check)
 * - The full list of sessions for the campaign
 *
 * Owns the page-level UI state:
 * - URL search params (q) — mirrored into search
 * - addOpen — whether the "add session" drawer is open
 *
 * Derives:
 * - filtered (client-side search applied to title + brief)
 * - getBadge — Today / Tomorrow / Next / Previous status badge for a row
 *
 * Matches the list-page pattern established by useQuestListPage /
 * useGroupListPage: the hook owns shared state and hands minimal props down
 * to presentational section widgets. Filtering is client-side.
 */
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useSessions } from '@/features/sessions/api/queries';
import type { Session } from '@/entities/session';

export interface SessionBadge {
  label: string;
  cls: string;
  pulse: boolean;
  dotCls: string;
}

export interface UseSessionListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  sessionsEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isError: boolean;
  sessions: Session[] | undefined;
  filtered: Session[];
  search: string;
  setSearch: (v: string) => void;
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  formatDate: (iso: string) => string;
  getBadge: (session: Pick<Session, 'id' | 'datetime'>) => SessionBadge | null;
}

export function useSessionListPage(campaignId: string): UseSessionListPageResult {
  const { t, i18n } = useTranslation('sessions');
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';

  const sessionsEnabled = useSectionEnabled(campaignId, 'sessions');
  const { data: campaign } = useCampaign(campaignId);
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const { data: sessions, isLoading, isError } = useSessions(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const [addOpen, setAddOpen] = useState(false);

  const setSearch = useCallback(
    (val: string) => {
      setSearchParams(
        (prev) => {
          if (val) prev.set('q', val);
          else prev.delete('q');
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const filtered = useMemo(() => {
    if (!sessions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.brief?.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  const formatDate = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [locale],
  );

  // Badge anchors (today / tomorrow / next future / most recent past)
  const { todayStr, tomorrowStr, nextSessionId, lastSessionId } = useMemo(() => {
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
      .sort(
        (a, b) =>
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
      );
    const nextSessionId = futureSessions[0]?.id ?? null;

    const pastSessions = (sessions ?? []).filter(
      (s) => s.datetime && new Date(s.datetime) < todayStart,
    );
    const lastSessionId = pastSessions.length > 0 ? pastSessions[0]?.id ?? null : null;

    return { todayStr, tomorrowStr, nextSessionId, lastSessionId };
  }, [sessions]);

  const getBadge = useCallback(
    (session: Pick<Session, 'id' | 'datetime'>): SessionBadge | null => {
      const sessionDate = session.datetime ? new Date(session.datetime) : null;
      const isToday = sessionDate && sessionDate.toDateString() === todayStr;
      const isTomorrow = sessionDate && sessionDate.toDateString() === tomorrowStr;
      const isNext = session.id === nextSessionId && !isToday && !isTomorrow;
      const isLast = session.id === lastSessionId;

      if (isToday)
        return {
          label: t('badge_today'),
          cls: 'bg-primary/15 text-primary border-primary/30',
          pulse: true,
          dotCls: 'bg-primary',
        };
      if (isTomorrow)
        return {
          label: t('badge_tomorrow'),
          cls: 'bg-secondary/10 text-secondary border-secondary/20',
          pulse: true,
          dotCls: 'bg-secondary',
        };
      if (isNext)
        return {
          label: t('badge_next'),
          cls: 'bg-secondary/10 text-secondary border-secondary/20',
          pulse: false,
          dotCls: '',
        };
      if (isLast)
        return {
          label: t('badge_previous'),
          cls: 'bg-primary/10 text-primary border-primary/20',
          pulse: false,
          dotCls: '',
        };
      return null;
    },
    [t, todayStr, tomorrowStr, nextSessionId, lastSessionId],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    sessionsEnabled,
    isGm,
    isLoading,
    isError,
    sessions,
    filtered,
    search,
    setSearch,
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),
    formatDate,
    getBadge,
  };
}
