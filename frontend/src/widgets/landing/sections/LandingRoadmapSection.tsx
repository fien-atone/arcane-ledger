/**
 * LandingRoadmapSection — "What's next" roadmap grid for the marketing page.
 *
 * Renders eight upcoming features (items, timeline, export PDF, GM screen,
 * AI generators, OAuth, social) as muted icon cards in a 2-column grid.
 * All strings come from the `landing` i18n namespace.
 */
import { useTranslation } from 'react-i18next';

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

export function LandingRoadmapSection() {
  const { t } = useTranslation('landing');

  return (
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
  );
}
