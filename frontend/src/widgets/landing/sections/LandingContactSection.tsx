/**
 * LandingContactSection — "Get in touch" section for the marketing page.
 *
 * Two-column layout: heading + description on the left, three outbound
 * contact links on the right (Telegram, Twitter, email). External links open
 * in a new tab with rel=noopener.
 */
import { useTranslation } from 'react-i18next';

export function LandingContactSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="border-t border-outline-variant/10 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-0">
      <div>
        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 block mb-3">{t('contact.overline')}</span>
        <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">{t('contact.title')}</h2>
        <p className="text-on-surface-variant text-sm max-w-sm">{t('contact.description')}</p>
      </div>
      <div className="flex flex-col gap-3 min-w-[200px]">
        <a
          href="https://t.me/inoise"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 hover:text-primary text-on-surface-variant rounded-sm transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          {t('contact.telegram')}
        </a>
        <a
          href="https://twitter.com/inoise"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 hover:text-primary text-on-surface-variant rounded-sm transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">alternate_email</span>
          {t('contact.twitter')}
        </a>
        <a
          href="mailto:ivnshumov@gmail.com"
          className="flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant/15 hover:border-primary/30 hover:text-primary text-on-surface-variant rounded-sm transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          {t('contact.email')}
        </a>
      </div>
    </section>
  );
}
