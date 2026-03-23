import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useParty } from '@/features/characters/api/queries';
import { useSpecies } from '@/features/species/api';
import type { PlayerCharacter } from '@/entities/character';

function CharacterDetail({ char, campaignId }: { char: PlayerCharacter; campaignId: string }) {
  const initials = char.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const { data: allSpecies } = useSpecies();
  const matchedSpecies = char.speciesId || char.species
    ? allSpecies?.find((s) => s.id === char.speciesId || s.name.toLowerCase() === char.species?.toLowerCase())
    : undefined;
  const displaySpeciesName = matchedSpecies?.name ?? char.species;
  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Header image / placeholder */}
      <div className="relative w-full h-64 flex-shrink-0 bg-surface-container-low overflow-hidden">
        {char.image ? (
          <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-headline text-[8rem] font-bold text-on-surface-variant/8 select-none leading-none">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">person</span>
            {[displaySpeciesName, char.class].filter(Boolean).join(' · ') || 'Character'}
          </span>
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-5">
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
          {(char.gender || char.age != null) && (
            <p className="text-xs text-on-surface-variant/50 uppercase tracking-wider mt-0.5">
              {[
                char.gender ? (char.gender === 'nonbinary' ? 'Non-binary' : char.gender.charAt(0).toUpperCase() + char.gender.slice(1)) : null,
                char.age != null ? `Age ${char.age}` : null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {char.appearance && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Appearance</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{char.appearance}</p>
          </div>
        )}

        {char.personality && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Personality</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{char.personality}</p>
          </div>
        )}

        {char.background && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Background</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{char.background}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PartyPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: characters, isLoading, isError } = useParty(campaignId ?? '');
  const { data: allSpecies } = useSpecies();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
    <main className="flex-1 flex flex-col min-h-screen bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">The Fellowship</h1>
            <p className="text-on-surface-variant text-sm mt-1">Campaign members and their characters.</p>
          </div>
          <button disabled className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-sm opacity-50 cursor-not-allowed" title="Coming soon">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
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
                    <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${isSelected ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                      <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant/60'}`}>{initials}</span>
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
    </main>
  );
}
