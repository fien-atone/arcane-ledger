/**
 * Page-level state and data for SessionListPage (Tier 2 list page).
 *
 * F-11: search filtering is SERVER-SIDE. This hook:
 *
 *  - Reads `?q` from the URL
 *  - Drives the <input> off a local debounced state (300 ms)
 *  - Passes the debounced search to `useSessions`, which uses Apollo v4's
 *    `previousData` to keep the existing list visible during refetches.
 *  - Removes the client-side `useMemo` search filter — the list returned
 *    from the query is already filtered by the server.
 *
 * Today / Next / Previous badges: computed against the currently-loaded
 * (possibly search-filtered) list. When a search is active, the "next"
 * badge reflects the next future session *in the filtered result set*, not
 * the global next session. This is an intentional minor behaviour change
 * to avoid a second unfiltered query just for badges — consistent with the
 * F-11 tradeoff.
 *
 * Loads:
 * - The campaign (for the title in the back link + GM role check)
 * - The (server-filtered) list of sessions for the campaign
 *
 * Owns the page-level UI state:
 * - URL search params (q) — mirrored into search
 * - addOpen — whether the "add session" drawer is open
 */
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useSessions } from '@/features/sessions/api/queries';
import { useDebouncedSearch } from '@/shared/hooks';
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
  isFetching: boolean;
  isError: boolean;
  /** Server-filtered list. Stays populated via Apollo previousData during
   *  in-flight refetches. */
  sessions: Session[] | undefined;
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

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';

  const { value: search, debouncedValue: debouncedSearch, setValue: setDebouncedSearch } =
    useDebouncedSearch(urlSearch, 300);

  const { data: sessions, isLoading, isFetching, isError } = useSessions(campaignId, {
    search: debouncedSearch || undefined,
  });

  const [addOpen, setAddOpen] = useState(false);

  const setSearch = useCallback(
    (val: string) => {
      setDebouncedSearch(val);
      setSearchParams(
        (prev) => {
          if (val) prev.set('q', val);
          else prev.delete('q');
          return prev;
        },
        { replace: true },
      );
    },
    [setDebouncedSearch, setSearchParams],
  );

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
    isFetching,
    isError,
    sessions,
    search,
    setSearch,
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),
    formatDate,
    getBadge,
  };
}
