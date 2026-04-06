import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer, D20Icon } from '@/shared/ui';
import { CHANGELOG } from '@/shared/changelog/entries';

// ── Feature data ─────────────────────────────────────────────────────────────

const FEATURE_KEYS = [
  { key: 'locations_maps', icon: 'location_on', wide: true, accent: 'primary' },
  { key: 'npcs', icon: 'group', wide: false, accent: 'secondary' },
  { key: 'party_characters', icon: 'shield_person', wide: false, accent: 'primary' },
  { key: 'factions_groups', icon: 'groups', wide: false, accent: 'tertiary' },
  { key: 'session_journal', icon: 'event', wide: false, accent: 'secondary' },
  { key: 'social_relations', icon: 'favorite', wide: true, accent: 'primary' },
  { key: 'species_races', icon: 'blur_on', wide: false, accent: 'tertiary' },
  { key: 'quests', icon: 'assignment', wide: false, accent: 'secondary' },
  { key: 'dice_roller', icon: 'd20', wide: false, accent: 'primary' },
  { key: 'gm_notes', icon: 'lock', wide: false, accent: 'tertiary' },
  { key: 'multiplayer', icon: 'group_add', wide: true, accent: 'secondary' },
  { key: 'visibility', icon: 'visibility', wide: false, accent: 'tertiary' },
] as const;

const ROADMAP_KEYS = [
  { key: 'items_artifacts', icon: 'inventory_2' },
  { key: 'campaign_timeline', icon: 'timeline' },
  { key: 'export_pdf', icon: 'picture_as_pdf' },
  { key: 'gm_screen', icon: 'menu_book' },
  { key: 'ai_npc_gen', icon: 'auto_awesome' },
  { key: 'ai_session_parser', icon: 'notes' },
  { key: 'oauth_login', icon: 'passkey' },
  { key: 'social_gm_groups', icon: 'diversity_3' },
] as const;

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, wide, accent }: { icon: string; title: string; desc: string; wide: boolean; accent: string }) {
  const accentMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
  };
  const accentClass = accentMap[accent as keyof typeof accentMap];
  return (
    <div className={`${wide ? 'md:col-span-2' : ''} bg-surface-container-low border border-outline-variant/10 p-8 flex flex-col gap-4 hover:border-outline-variant/25 transition-colors group`}>
      <div className="w-8 h-8 group-hover:scale-110 transition-transform">
        {icon === 'd20'
          ? <D20Icon className={`w-8 h-8 ${accentClass}`} />
          : <span className={`material-symbols-outlined ${accentClass} text-[2rem] leading-none`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        }
      </div>
      <div>
        <h3 className="font-headline text-lg font-bold text-on-surface mb-1">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function RoadmapCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-5 border border-outline-variant/10 rounded-sm bg-surface-container-lowest">
      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-sm bg-surface-container border border-outline-variant/20">
        <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px]">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-on-surface-variant mb-0.5">{title}</p>
        <p className="text-xs text-on-surface-variant/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t, i18n } = useTranslation('landing');
  const navigate = useNavigate();

  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en';
  const toggleLang = () => {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
    navigate(`/${newLang}`, { replace: true });
  };

  return (
    <div className="bg-background text-on-background min-h-screen">

      {/* ── Nav ── */}
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

      <main className="max-w-6xl mx-auto px-8">

        {/* ── Hero ── */}
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

        {/* ── Stat strip ── */}
        <section className="border-y border-outline-variant/10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
          {([
            { n: t('stats.entity_types_value'), label: t('stats.entity_types') },
            { n: t('stats.locations_maps_value'), label: t('stats.locations_maps') },
            { n: (
              <svg viewBox="0 0 512 512" fill="currentColor" className="w-10 h-10 mx-auto text-primary">
                <path d="M217.5 56.4L77.9 140.2l61.4 44.7L217.5 56.4zM64 169.6V320.3l59.2-107.6L64 169.6zM104.8 388L240 469.1V398.8L104.8 388zM272 469.1L407.2 388 272 398.8v70.3zM448 320.3V169.6l-59.2 43L448 320.3zM434.1 140.2L294.5 56.4l78.2 128.4 61.4-44.7zM243.7 3.4c7.6-4.6 17.1-4.6 24.7 0l200 120c7.2 4.3 11.7 12.1 11.7 20.6V368c0 8.4-4.4 16.2-11.7 20.6l-200 120c-7.6 4.6-17.1 4.6-24.7 0l-200-120C36.4 384.2 32 376.4 32 368V144c0-8.4 4.4-16.2 11.7-20.6l200-120zM225.3 365.5L145 239.4 81.9 354l143.3 11.5zM338.9 224H173.1L256 354.2 338.9 224zM256 54.8L172.5 192H339.5L256 54.8zm30.7 310.7L430.1 354 367 239.4 286.7 365.5z" />
              </svg>
            ), label: t('stats.dice_roller') },
            { n: t('stats.in_active_dev_value'), label: t('stats.in_active_dev') },
          ] as { n: React.ReactNode; label: string }[]).map(({ n, label }) => (
            <div key={label} className="text-center flex flex-col items-center">
              <div className="font-headline text-4xl font-bold text-primary mb-1 leading-none">{n}</div>
              <p className="text-xs font-label uppercase tracking-widest text-on-surface-variant/50">{label}</p>
            </div>
          ))}
        </section>

        {/* ── Features ── */}
        <section id="features" className="mb-32">
          <div className="mb-12">
            <span className="text-[10px] font-label uppercase tracking-widest text-primary block mb-3">{t('features.overline')}</span>
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">{t('features.title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURE_KEYS.map((f) => (
              <FeatureCard
                key={f.key}
                icon={f.icon}
                title={t(`features.${f.key}`)}
                desc={t(`features.${f.key}_desc`)}
                wide={f.wide}
                accent={f.accent}
              />
            ))}
          </div>
        </section>

        {/* ── Roadmap ── */}
        <section id="roadmap" className="mb-32">
          <div className="mb-12">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 block mb-3">{t('roadmap.overline')}</span>
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface">{t('roadmap.title')}</h2>
            <p className="text-on-surface-variant mt-3 max-w-xl">{t('roadmap.description')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ROADMAP_KEYS.map((r) => (
              <RoadmapCard
                key={r.key}
                icon={r.icon}
                title={t(`roadmap.${r.key}`)}
                desc={t(`roadmap.${r.key}_desc`)}
              />
            ))}
          </div>
        </section>

        {/* ── Contact ── */}
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

        {/* ── Final CTA ── */}
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

      </main>

      <Footer />
    </div>
  );
}
