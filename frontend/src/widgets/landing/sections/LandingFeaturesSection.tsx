/**
 * LandingFeaturesSection — "What's inside" feature grid.
 *
 * Renders 12 marketing cards (locations, npcs, party, factions, sessions,
 * etc.) in a responsive 3-column grid. Each card has an icon, a title and a
 * description pulled from the `landing` namespace. A few cards are marked
 * `wide` to span two columns on md+ breakpoints.
 */
import { useTranslation } from 'react-i18next';
import { D20Icon } from '@/shared/ui';

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

export function LandingFeaturesSection() {
  const { t } = useTranslation('landing');

  return (
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
  );
}
