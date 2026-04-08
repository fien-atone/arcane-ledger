/**
 * LandingNavSection — top navigation for the public marketing page.
 *
 * Fixed-position translucent bar with the Arcane Ledger wordmark,
 * anchor links to on-page sections, a language toggle (RU/EN) that
 * also updates the URL prefix, and a login CTA. Purely presentational
 * aside from i18n + router state.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function LandingNavSection() {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();

  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  const toggleLang = () => {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
    navigate(`/${newLang}`, { replace: true });
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10 flex justify-between items-center px-10 py-5">
      <span className="text-2xl font-serif italic text-primary tracking-tight">Arcane Ledger</span>
      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">{t('nav.features')}</a>
        <a href="#roadmap" className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">{t('nav.roadmap')}</a>
        <Link to={`/${currentLang}/changelog`} className="text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">{t('nav.changelog')}</Link>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 text-on-surface-variant/60 hover:text-on-surface text-xs uppercase tracking-widest transition-colors"
        >
          <span className="text-base leading-none">{currentLang === 'ru' ? '🇺🇸' : '🇷🇺'}</span>
          {currentLang === 'ru' ? 'EN' : 'RU'}
        </button>
        <Link
          to={`/${currentLang}/login`}
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 rounded-sm text-xs font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          {t('nav.open_app')}
        </Link>
      </div>
    </nav>
  );
}
