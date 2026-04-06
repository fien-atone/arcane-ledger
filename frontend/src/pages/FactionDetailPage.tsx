import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useFactions, useFaction } from '@/features/factions/api';
import { BackLink, GmNotesSection } from '@/shared/ui';
function FactionHero({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="relative w-full aspect-[21/9] overflow-hidden rounded-sm bg-surface-container-low flex items-center justify-center group">
      <span className="font-headline text-[10rem] font-bold text-on-surface-variant/10 select-none leading-none grayscale">
        {initials}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
    </div>
  );
}

const RELATION_PILL: Record<string, string> = {
  allied: 'bg-secondary/10 text-secondary border border-secondary/20',
  neutral: 'bg-surface-variant text-on-surface-variant border border-outline-variant/20',
  hostile: 'bg-primary/10 text-primary border border-primary/20',
  unknown: 'bg-surface-container text-on-surface-variant/60 border border-outline-variant/10',
};

export default function FactionDetailPage() {
  const { t } = useTranslation('factions');
  const { id: campaignId, factionId } = useParams<{ id: string; factionId: string }>();
  const { data: factions } = useFactions(campaignId ?? '');
  const { data: faction, isLoading, isError } = useFaction(
    campaignId ?? '',
    factionId ?? ''
  );
  // If no factionId in URL, show faction list/picker layout
  const displayFaction = faction;
  const displayId = factionId;

  const relationKey = displayFaction?.partyRelation ?? null;
  const relation = relationKey
    ? { label: t(`relation_${relationKey}`), pill: RELATION_PILL[relationKey] ?? RELATION_PILL.unknown }
    : null;

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  // No faction selected — show list
  if (!displayId || isError || !displayFaction) {
    return (
      <main className="flex-1 min-h-screen bg-surface">
        <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
                {t('title')}
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">
                {t('subtitle')}
              </p>
            </div>
            <button
              disabled
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed"
              title={t('coming_soon')}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">{t('add_faction')}</span>
            </button>
          </div>
        </header>

        <div className="px-10 py-10 pb-24 max-w-5xl">
          {factions && factions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {factions.map((f) => {
                const rel = f.partyRelation
                  ? { label: t(`relation_${f.partyRelation}`), pill: RELATION_PILL[f.partyRelation] ?? RELATION_PILL.unknown }
                  : null;
                return (
                  <Link
                    key={f.id}
                    to={`/campaigns/${campaignId}/factions/${f.id}`}
                    className="group bg-surface-container-low hover:bg-surface-container border-b border-outline-variant/10 p-6 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                        flag
                      </span>
                      {rel && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${rel.pill}`}>
                          {rel.label}
                        </span>
                      )}
                    </div>
                    <h3 className="font-headline text-xl text-on-surface group-hover:text-primary transition-colors mb-2 leading-tight">
                      {f.name}
                    </h3>
                    {f.aliases.length > 0 && (
                      <p className="text-[10px] text-on-surface-variant/40 italic mb-3">
                        {t('alias_prefix')} {f.aliases.join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant/70 leading-relaxed line-clamp-2">
                      {f.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-[10px] text-primary/50 group-hover:text-primary transition-colors uppercase tracking-widest">
                      {t('view_details')}
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">
                flag
              </span>
              <p className="font-headline text-2xl text-on-surface-variant">{t('empty_title')}</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/factions`}>{t('title')}</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Hero image placeholder */}
            <FactionHero name={displayFaction.name} />

            {/* Header */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {relation && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${relation.pill}`}>
                    {relation.label}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                {displayFaction.name}
              </h1>
              {displayFaction.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {displayFaction.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic"
                    >
                      "{alias}"
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Description */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  {t('section_about')}
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              <p className="text-on-surface-variant leading-loose text-base">
                {displayFaction.description}
              </p>
            </section>

            {/* Goals */}
            {displayFaction.goals && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    {t('section_goals')}
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="bg-surface-container-low p-6 border-l-2 border-primary/30">
                  <p className="text-on-surface-variant leading-relaxed italic">
                    {displayFaction.goals}
                  </p>
                </div>
              </section>
            )}

            {/* Symbols */}
            {displayFaction.symbols && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    {t('section_symbols')}
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <p className="text-on-surface-variant leading-relaxed">
                  {displayFaction.symbols}
                </p>
              </section>
            )}

            {/* GM Notes */}
            <GmNotesSection notes={null} fallback={t('section_gm_notes_fallback', { name: displayFaction.name })} />
          </div>

          {/* ── Right column (35%) ──────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            {/* Edit button */}
            <div className="flex justify-end">
              <button
                disabled
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm opacity-50 cursor-not-allowed"
                title={t('coming_soon')}
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {t('edit_faction')}
              </button>
            </div>

            {/* Stats card */}
            <div className="bg-surface-container-low p-6 rounded-sm ring-1 ring-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                {t('profile_title')}
              </h4>
              <div className="space-y-3">
                {relation && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-on-surface-variant/60 italic">{t('profile_party_relation')}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${relation.pill}`}>
                      {relation.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">{t('profile_known_aliases')}</span>
                  <span className="text-on-surface">{displayFaction.aliases.length}</span>
                </div>
              </div>
            </div>

            {/* Key members placeholder */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">group</span>
                {t('key_members_title')}
              </h4>
              <p className="text-xs text-on-surface-variant/40 italic">
                {t('key_members_empty')}
              </p>
            </section>

            {/* Locations placeholder */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {t('known_bases_title')}
              </h4>
              <p className="text-xs text-on-surface-variant/40 italic">
                {t('known_bases_empty')}
              </p>
            </section>

            {/* Other factions in campaign */}
            {factions && factions.filter((f) => f.id !== displayFaction.id).length > 0 && (
              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40">
                  {t('other_factions')}
                </h4>
                <div className="space-y-2">
                  {factions
                    .filter((f) => f.id !== displayFaction.id)
                    .map((f) => (
                      <Link
                        key={f.id}
                        to={`/campaigns/${campaignId}/factions/${f.id}`}
                        className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container transition-colors group"
                      >
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/30 group-hover:text-primary transition-colors">
                          flag
                        </span>
                        <span className="text-xs text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                          {f.name}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60">
                          chevron_right
                        </span>
                      </Link>
                    ))}
                </div>
              </section>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
