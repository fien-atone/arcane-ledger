import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useParty } from '@/features/characters/api/queries';
import { CharacterEditDrawer } from '@/features/characters/ui';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
function CharacterPortrait({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="relative group w-full">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-sm bg-surface-container-low flex items-center justify-center">
        <span className="font-headline text-[12rem] font-bold text-on-surface-variant/10 select-none leading-none">
          {initials}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
    </div>
  );
}

export default function CharacterDetailPage() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const { data: characters, isLoading, isError } = useParty(campaignId ?? '');
  const character = characters?.find((c) => c.id === charId);
  const { data: allSpecies } = useSpecies();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !character) {
    return (
      <main className="p-12">
        <Link
          to={`/campaigns/${campaignId}/party`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest mb-8"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Party
        </Link>
        <p className="text-tertiary text-sm">Character not found.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="px-10 pt-8">
        <Link
          to={`/campaigns/${campaignId}/party`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Party
        </Link>
      </div>

      <div className="px-10 py-8 pb-24 max-w-7xl">
        {/* Header */}
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface tracking-tight">
                {character.name}
              </h1>
              {character.species && (() => {
                const matchedSpecies = allSpecies?.find(
                  (s) => s.id === character.speciesId || s.name.toLowerCase() === character.species?.toLowerCase()
                );
                return matchedSpecies ? (
                  <Link
                    to={`/campaigns/${campaignId}/species`}
                    className="text-secondary text-sm font-label uppercase tracking-widest border-b border-secondary/20 pb-1 hover:text-primary hover:border-primary/20 transition-colors"
                  >
                    {character.species}
                  </Link>
                ) : (
                  <span className="text-secondary text-sm font-label uppercase tracking-widest border-b border-secondary/20 pb-1">
                    {character.species}
                  </span>
                );
              })()}
            </div>
            {character.class && (
              <p className="text-on-surface-variant italic font-headline text-xl mt-2">
                {character.class}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit Entry
          </button>
        </header>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-12">
          {/* Left column (6/10) */}
          <div className="md:col-span-6 space-y-12">
            <CharacterPortrait name={character.name} />

            {/* Appearance */}
            {character.appearance && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-primary/40" />
                  <h3 className="text-xs font-label uppercase tracking-[0.3em] text-on-surface-variant">
                    Appearance
                  </h3>
                </div>
                <div className="bg-surface-container-low p-8 border-b border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed">{character.appearance}</p>
                </div>
              </section>
            )}

            {/* Background */}
            {character.background && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-primary/40" />
                  <h3 className="text-xs font-label uppercase tracking-[0.3em] text-on-surface-variant">
                    Backstory
                  </h3>
                </div>
                <div className="bg-surface-container-low p-8 border-b border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed">{character.background}</p>
                </div>
              </section>
            )}

            {/* Personality */}
            {character.personality && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-primary/40" />
                  <h3 className="text-xs font-label uppercase tracking-[0.3em] text-on-surface-variant">
                    Personality Traits
                  </h3>
                </div>
                <div className="bg-surface-container-low p-8 border-b border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed italic">{character.personality}</p>
                </div>
              </section>
            )}

            {/* Motivation */}
            {character.motivation && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-secondary/40" />
                  <h3 className="text-xs font-label uppercase tracking-[0.3em] text-secondary/80">
                    Motivation & Ideals
                  </h3>
                </div>
                <div className="bg-surface-container-low p-8 border-l-2 border-secondary/30">
                  <p className="text-on-surface-variant leading-relaxed">{character.motivation}</p>
                </div>
              </section>
            )}

            {/* Bonds */}
            {character.bonds && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-primary/40" />
                  <h3 className="text-xs font-label uppercase tracking-[0.3em] text-on-surface-variant">
                    Bonds
                  </h3>
                </div>
                <div className="bg-surface-container-low p-8 border-b border-outline-variant/10">
                  <p className="text-on-surface-variant leading-relaxed">{character.bonds}</p>
                </div>
              </section>
            )}

            {/* Flaws */}
            {character.flaws && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px w-8 bg-outline-variant/60" />
                  <h3 className="text-xs font-label uppercase tracking-[0.3em] text-on-surface-variant/60">
                    Flaws
                  </h3>
                </div>
                <div className="bg-surface-container-low p-8 border-l-2 border-outline-variant/20">
                  <p className="text-on-surface-variant/70 leading-relaxed">{character.flaws}</p>
                </div>
              </section>
            )}

            {/* Social Relations */}
            <SocialRelationsSection
              campaignId={campaignId ?? ''}
              entityId={charId ?? ''}
            />

            {(() => {
              const missing = [
                { key: 'appearance', label: 'Appearance' },
                { key: 'background', label: 'Backstory' },
                { key: 'personality', label: 'Personality' },
                { key: 'motivation', label: 'Motivation' },
                { key: 'bonds', label: 'Bonds' },
                { key: 'flaws', label: 'Flaws' },
              ].filter(({ key }) => !character[key as keyof typeof character]);
              if (missing.length === 0) return null;
              return (
                <section className="border-t border-outline-variant/10 pt-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/30 font-bold">
                      Not recorded:
                    </span>
                    {missing.map(({ label }) => (
                      <span
                        key={label}
                        className="px-2.5 py-1 border border-dashed border-outline-variant/20 text-[10px] text-on-surface-variant/30 uppercase tracking-widest rounded-sm"
                      >
                        {label}
                      </span>
                    ))}
                    <button
                      onClick={() => setEditOpen(true)}
                      className="ml-auto text-[10px] text-primary/40 hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">edit</span>
                      Fill in
                    </button>
                  </div>
                </section>
              );
            })()}
          </div>

          {/* Right column (4/10) */}
          <div className="md:col-span-4 space-y-8">
            {/* GM Notes */}
            <div className="bg-surface-container border-l-2 border-primary-container p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-label uppercase tracking-widest text-primary">
                  GM Notes
                </h4>
                <span className="material-symbols-outlined text-primary/40 text-sm">lock</span>
              </div>
              <p className="text-sm text-on-surface-variant italic leading-relaxed">
                {character.gmNotes || 'No GM notes for this character yet.'}
              </p>
            </div>

            {/* Quick metadata */}
            <div className="grid grid-cols-2 gap-4">
              {character.species && (
                <div className="bg-surface-container-lowest p-4 border border-outline-variant/5">
                  <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant mb-1">
                    Species
                  </p>
                  <p className="text-sm font-headline">{character.species}</p>
                </div>
              )}
              {character.class && (
                <div className="bg-surface-container-lowest p-4 border border-outline-variant/5">
                  <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant mb-1">
                    Class
                  </p>
                  <p className="text-sm font-headline">{character.class}</p>
                </div>
              )}
            </div>

            {/* Personal quests (placeholder) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
                  Personal Quests
                </h4>
              </div>
              <p className="text-xs text-on-surface-variant/40 italic">
                Personal quest links will appear here in a future update.
              </p>
            </div>
          </div>
        </div>
      </div>
      {character && (
        <CharacterEditDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          character={character}
        />
      )}
    </main>
  );
}
