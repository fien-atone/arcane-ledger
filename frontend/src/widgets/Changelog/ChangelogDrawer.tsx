import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CHANGELOG } from '@/shared/changelog/entries';

const STORAGE_KEY = 'ttrpg_changelog_seen';
const LATEST_VERSION = CHANGELOG[0].version;

export function getHasUnread(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== LATEST_VERSION;
}

export function markRead(): void {
  localStorage.setItem(STORAGE_KEY, LATEST_VERSION);
}

const TAG_STYLES = {
  new: 'bg-secondary/10 text-secondary border border-secondary/20',
  improved: 'bg-primary/10 text-primary border border-primary/20',
  fixed: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
};

const TAG_LABEL_KEYS = {
  new: 'changelog_drawer.tag_new',
  improved: 'changelog_drawer.tag_improved',
  fixed: 'changelog_drawer.tag_fixed',
} as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangelogDrawer({ open, onClose }: Props) {
  const { t, i18n } = useTranslation('common');

  useEffect(() => {
    if (open) markRead();
  }, [open]);

  if (!open) return null;

  const lang = (i18n.language.startsWith('ru') ? 'ru' : 'en') as 'en' | 'ru';
  const dateLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">{t('changelog_drawer.title')}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
          {CHANGELOG.map((entry, i) => (
            <div key={entry.version}>
              {/* Version header */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="font-headline text-2xl font-bold text-on-surface">
                  v{entry.version}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-label">
                  {new Date(entry.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {i === 0 && (
                  <span className="ml-auto px-2.5 py-0.5 bg-primary text-on-primary text-[9px] font-bold uppercase tracking-widest rounded-full">
                    {t('changelog_drawer.current')}
                  </span>
                )}
              </div>

              <p className="text-sm font-headline text-on-surface-variant mb-4 italic">
                {entry.title[lang]}
              </p>

              <div className="space-y-3">
                {entry.items.map((item, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-3 p-3 bg-surface-container-low border border-outline-variant/10 rounded-sm"
                  >
                    <span className="material-symbols-outlined text-primary/60 flex-shrink-0 mt-0.5" style={{ fontSize: '18px' }}>
                      {item.icon}
                    </span>
                    <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
                      {item.text[lang]}
                    </p>
                    {item.tag && (
                      <span className={`flex-shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full ${TAG_STYLES[item.tag]}`}>
                        {t(TAG_LABEL_KEYS[item.tag])}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {i < CHANGELOG.length - 1 && (
                <div className="mt-8 h-px bg-outline-variant/10" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <p className="text-[10px] text-on-surface-variant/30 text-center uppercase tracking-widest">
            {t('app_name')} — {t('app_tagline')}
          </p>
        </div>
      </div>
    </>
  );
}
