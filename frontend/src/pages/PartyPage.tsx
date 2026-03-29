import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useParty } from '@/features/characters/api/queries';
import { CharacterEditDrawer } from '@/features/characters/ui';
import { useSpecies } from '@/features/species/api';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { RichContent } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">{title}</h3>
      <div className="h-px flex-1 bg-outline-variant/20" />
    </div>
  );
}

function CharacterDetail({ char, campaignId }: { char: PlayerCharacter; campaignId: string }) {
  const initials = char.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const { data: allSpecies } = useSpecies(campaignId);
  const matchedSpecies = char.speciesId || char.species
    ? allSpecies?.find((s) => s.id === char.speciesId || s.name.toLowerCase() === char.species?.toLowerCase())
    : undefined;
  const displaySpeciesName = matchedSpecies?.name ?? char.species;
  const resolvedImage = resolveImageUrl(char.image);
  const genderLabel = char.gender
    ? (char.gender === 'nonbinary' ? 'Non-binary' : char.gender.charAt(0).toUpperCase() + char.gender.slice(1))
    : null;
  const metaParts = [displaySpeciesName, char.class, genderLabel, char.age != null ? `Age ${char.age}` : null].filter(Boolean);

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Character card header */}
      <div className="flex-shrink-0 flex gap-6 p-8 pb-6">
        {/* Portrait */}
        <div className="w-36 h-48 rounded-sm border border-outline-variant/20 overflow-hidden bg-surface-container-low flex-shrink-0">
          {resolvedImage ? (
            <img src={resolvedImage} alt={char.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-headline text-5xl font-bold text-on-surface-variant/8 select-none leading-none">{initials}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-3 min-w-0">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{char.name}</h2>
            {displaySpeciesName && (
              matchedSpecies ? (
                <Link
                  to={`/campaigns/${campaignId}/species/${matchedSpecies.id}`}
                  className="text-xs text-primary/70 uppercase tracking-wider mt-1 hover:text-primary transition-colors block"
                >
                  {displaySpeciesName}
                </Link>
              ) : (
                <p className="text-xs text-on-surface-variant/60 uppercase tracking-wider mt-1">{displaySpeciesName}</p>
              )
            )}
          </div>

          {metaParts.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-fit">
              <span className="material-symbols-outlined text-[13px]">person</span>
              {metaParts.join(' · ')}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/10 mx-8" />

      <div className="px-8 py-6 flex flex-col gap-5">
        {char.appearance && (
          <div>
            <SectionHeader title="Appearance" />
            <RichContent value={char.appearance} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {char.personality && (
          <div>
            <SectionHeader title="Personality" />
            <RichContent value={char.personality} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {char.background && (
          <div>
            <SectionHeader title="Background" />
            <RichContent value={char.background} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PartyPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: characters, isLoading, isError } = useParty(campaignId ?? '');
  const { data: allSpecies } = useSpecies(campaignId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const resolveSpeciesName = (char: PlayerCharacter) =>
    allSpecies?.find((s) => s.id === char.speciesId)?.name ?? char.species;

  const filtered = characters?.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    resolveSpeciesName(c)?.toLowerCase().includes(search.toLowerCase()) ||
    c.class?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const selected = characters?.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Party</h1>
            <p className="text-on-surface-variant text-sm mt-1">The Fellowship — campaign members and their characters.</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Character</span>
          </button>
        </div>
      </header>

      {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…</div>}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load party.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            <div className="p-4 border-b border-outline-variant/10 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search characters…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
                  <span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">groups</span>
                  <p className="font-headline text-lg text-on-surface-variant">No characters found.</p>
                </div>
              )}
              {filtered.map((char) => {
                const initials = char.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                const isSelected = selected?.id === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedId(char.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                      isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest">
                      {char.image ? (
                        <img src={resolveImageUrl(char.image)} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant/60'}`}>{initials}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>{char.name}</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
                        {[resolveSpeciesName(char), char.class].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <CharacterDetail char={selected} campaignId={campaignId ?? ''} />
                <Link
                  to={`/campaigns/${campaignId}/characters/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">Select a character</div>
            )}
          </div>
        </div>
      )}

      <CharacterEditDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        campaignId={campaignId ?? ''}
      />
    </main>
  );
}
