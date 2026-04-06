import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CHANGELOG } from '@/shared/changelog/entries';
import { Footer, BackLink } from '@/shared/ui';

const TAG_STYLES = {
  new: 'bg-secondary/10 text-secondary border border-secondary/20',
  improved: 'bg-primary/10 text-primary border border-primary/20',
  fixed: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
};

export default function ChangelogPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language.startsWith('ru') ? 'ru' : 'en') as 'en' | 'ru';
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';

  const TAG_LABEL = {
    new: t('tag_new'),
    improved: t('tag_updated'),
    fixed: t('tag_fixed'),
  };

  return (
    <div className="bg-background text-on-background min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10 flex justify-between items-center px-10 py-5">
        <Link to={`/${lang}`} className="text-2xl font-serif italic text-primary tracking-tight">Arcane Ledger</Link>
        <Link
          to={`/${lang}/login`}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 rounded-sm text-xs font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {t('open_app')}
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-8 pt-40 pb-24">

        {/* Header */}
        <div className="mb-16">
          <BackLink to={`/${lang}`}>{t('back')}</BackLink>
          <span className="text-[10px] font-label uppercase tracking-widest text-primary block mb-3">{t('changelog_release_history')}</span>
          <h1 className="font-headline text-5xl font-bold text-on-surface">{t('changelog')}</h1>
          <p className="text-on-surface-variant mt-3">{t('changelog_subtitle')}</p>
        </div>

        {/* Entries */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-2 bottom-0 w-px bg-outline-variant/15" />

          <div className="space-y-16 pl-8">
            {CHANGELOG.map((entry, i) => (
              <div key={entry.version} className="relative">
                {/* Dot */}
                <div className={`absolute -left-[2.125rem] top-1.5 w-3 h-3 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-surface-container border-outline-variant/40'}`} />

                {/* Version + date */}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-headline text-2xl font-bold text-on-surface">v{entry.version}</span>
                  {i === 0 && (
                    <span className="px-2.5 py-0.5 bg-primary text-on-primary text-[9px] font-bold uppercase tracking-widest rounded-full">
                      {t('changelog_latest')}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 font-label ml-auto">
                    {new Date(entry.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <p className="text-sm font-headline italic text-on-surface-variant mb-5">{entry.title[lang]}</p>

                <div className="space-y-2.5">
                  {entry.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-3 p-3.5 bg-surface-container-low border border-outline-variant/10 rounded-sm">
                      <span className="material-symbols-outlined text-primary/50 flex-shrink-0 mt-0.5" style={{ fontSize: '17px' }}>
                        {item.icon}
                      </span>
                      <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{item.text[lang]}</p>
                      {item.tag && (
                        <span className={`flex-shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full ${TAG_STYLES[item.tag]}`}>
                          {TAG_LABEL[item.tag]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
