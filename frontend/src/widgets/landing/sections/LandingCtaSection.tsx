/**
 * LandingCtaSection — final call-to-action at the bottom of the marketing page.
 *
 * Centered icon + headline + short blurb + primary login CTA. The CTA deep
 * links to the login route using the current i18n language prefix.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function LandingCtaSection() {
  const { t, i18n } = useTranslation('landing');
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  return (
    <section className="border-t border-outline-variant/10 py-32 flex flex-col items-center text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container mb-8 border border-outline-variant/10 shadow-[0_0_30px_rgba(242,202,80,0.08)]">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.75rem' }}>auto_stories</span>
      </div>
      <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-4">{t('cta.title')}</h2>
      <p className="text-on-surface-variant mb-10 max-w-md">{t('cta.description')}</p>
      <Link
        to={`/${currentLang}/login`}
        className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-12 py-4 rounded-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-[0_0_40px_-8px_rgba(242,202,80,0.3)]"
      >
        {t('cta.button')}
      </Link>
    </section>
  );
}
