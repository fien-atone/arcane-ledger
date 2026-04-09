/**
 * SessionListHeroSection — header card for the SessionListPage.
 *
 * Contains the page title/subtitle, the GM-only "new session" CTA, the
 * search input, and the filtered/total counter on the right.
 *
 * Presentational: all state is passed in as props from useSessionListPage.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';

interface Props {
  isGm: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  /** F-11: number of sessions in the currently displayed (server-filtered)
   *  list. No "of total" ratio — counts were dropped with the server-side
   *  filter switch. */
  shownCount: number;
  onAdd: () => void;
}

export function SessionListHeroSection({
  isGm,
  search,
  onSearchChange,
  shownCount,
  onAdd,
}: Props) {
  const { t } = useTranslation('sessions');

  return (
    <SectionPanel className="mb-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface tracking-tight">
            {t('title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
        </div>
        {isGm && (
          <button
            onClick={onAdd}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">
              {t('new_session')}
            </span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
          />
        </div>
        <span className="ml-auto text-[10px] text-on-surface-variant/40">
          <span className="text-primary font-bold">{shownCount}</span>
        </span>
      </div>
    </SectionPanel>
  );
}
