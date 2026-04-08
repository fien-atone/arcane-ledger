/**
 * LandingHeroSection — full-bleed hero banner for the public marketing page.
 *
 * Shows the version badge (pulled from CHANGELOG), headline, description,
 * primary/secondary CTAs and a small disclaimer. The primary CTA deep-links
 * to the localized login route.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CHANGELOG } from '@/shared/changelog/entries';

export function LandingHeroSection() {
  const { t, i18n } = useTranslation('landing');
  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  return (
    <section className="pt-48 pb-32 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-full text-[10px] font-label uppercase tracking-widest text-primary mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        {t('hero.badge')} · v{CHANGELOG[0]?.version ?? '0.0.0'}
      </div>

      <h1 className="font-headline text-6xl md:text-8xl font-bold text-on-surface tracking-tight leading-[1.05] mb-8">
        {t('hero.headline_1')}<br />
        <span className="text-primary italic">{t('hero.headline_2')}</span>
      </h1>

      <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl leading-relaxed mb-12">
        {t('hero.description')}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          to={`/${currentLang}/login`}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-10 py-4 rounded-sm font-bold text-sm uppercase tracking-wider shadow-[0_0_40px_-8px_rgba(242,202,80,0.4)] hover:opacity-90 transition-opacity"
        >
          {t('hero.cta_primary')}
        </Link>
        <a
          href="#features"
          className="px-8 py-4 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 text-sm rounded-sm transition-colors"
        >
          {t('hero.cta_secondary')}
        </a>
      </div>

      <p className="mt-6 text-[11px] text-on-surface-variant/30 font-label uppercase tracking-widest">
        {t('hero.disclaimer')}
      </p>
    </section>
  );
}
