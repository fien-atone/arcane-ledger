import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useParty, useSaveCharacter } from '@/features/characters/api/queries';
import { CharacterEditDrawer } from '@/features/characters/ui';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, BackLink, InlineRichField } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

export default function CharacterDetailPage() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const { data: characters, isLoading, isError } = useParty(campaignId ?? '');
  const character = characters?.find((c) => c.id === charId);
  const { data: allSpecies } = useSpecies();
  const saveCharacter = useSaveCharacter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const saveField = useCallback((field: keyof PlayerCharacter, html: string) => {
    if (!character) return;
    if (html.trim() === (String(character[field] ?? '')).trim()) return;
    saveCharacter.mutate({
      ...character,
      [field]: html.trim() || undefined,
      updatedAt: new Date().toISOString(),
    } as PlayerCharacter);
  }, [character, saveCharacter]);

  const handleImageUpload = (dataUrl: string) => {
    saveCharacter.mutate({ ...character!, image: dataUrl, updatedAt: new Date().toISOString() });
  };

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
        <BackLink to={`/campaigns/${campaignId}/party`}>Party</BackLink>
        <p className="text-tertiary text-sm">Character not found.</p>
      </main>
    );
  }

  const matchedSpecies = allSpecies?.find(
    (s) => s.id === character.speciesId || s.name.toLowerCase() === character.species?.toLowerCase()
  );
  const displaySpecies = matchedSpecies?.name ?? character.species;
  const displayGender = character.gender === 'nonbinary'
    ? 'Non-binary'
    : character.gender
      ? character.gender.charAt(0).toUpperCase() + character.gender.slice(1)
      : undefined;

  const demoBadge = [displaySpecies, displayGender, character.class, character.age != null ? `Age ${character.age}` : null]
    .filter(Boolean).join(' · ');

  return (
    <main className="flex-1 min-h-screen bg-surface">
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/party`}>Party</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            <section className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <ImageUpload
                  image={character.image}
                  name={character.name}
                  className="relative w-48 h-64"
                  onUpload={handleImageUpload}
                  onView={character.image ? () => setLightbox(true) : undefined}
                />
              </div>

              <div className="flex-1 pt-4 space-y-4">
                {demoBadge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                    {demoBadge}
                  </span>
                )}
                <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                  {character.name}
                </h1>
              </div>
            </section>

            <InlineRichField label="GM Notes" value={character.gmNotes} isGmNotes
              onSave={(html) => saveField('gmNotes', html)} />
            <InlineRichField label="Backstory" value={character.background}
              onSave={(html) => saveField('background', html)}
              placeholder="History, origin, key events…" />

            <SocialRelationsSection campaignId={campaignId ?? ''} entityId={charId ?? ''} />
          </div>

          {/* ── Right column ────────────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            <div className="flex justify-end">
              <button onClick={() => setDetailsOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary hover:border-primary/50 text-xs font-label uppercase tracking-widest rounded-sm transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit
              </button>
            </div>

            <InlineRichField label="Appearance" value={character.appearance}
              onSave={(html) => saveField('appearance', html)}
              placeholder="Physical description…" />
            <InlineRichField label="Personality" value={character.personality}
              onSave={(html) => saveField('personality', html)}
              placeholder="Traits, mannerisms, quirks…" />
            <InlineRichField label="Motivation & Ideals" value={character.motivation}
              onSave={(html) => saveField('motivation', html)}
              placeholder="What drives them, what they believe in…" />
            <InlineRichField label="Bonds" value={character.bonds}
              onSave={(html) => saveField('bonds', html)}
              placeholder="People, places, things they hold dear…" />
            <InlineRichField label="Flaws" value={character.flaws}
              onSave={(html) => saveField('flaws', html)}
              placeholder="Weaknesses, vices, fears…" />

          </div>
        </div>
      </div>

      <CharacterEditDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        campaignId={campaignId ?? ''}
        character={character}
      />

      {lightbox && character.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <img
            src={character.image}
            alt={character.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      )}
    </main>
  );
}
