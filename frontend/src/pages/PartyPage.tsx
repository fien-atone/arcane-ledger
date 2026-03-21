import { useParams, Link } from 'react-router-dom';
import { useParty } from '@/features/characters/api/queries';
function CharacterInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-full aspect-[4/5] bg-surface-container-highest flex items-center justify-center overflow-hidden relative group-hover:bg-surface-container transition-colors duration-300">
      <span className="font-headline text-8xl font-bold text-on-surface-variant/10 select-none group-hover:text-on-surface-variant/20 transition-colors duration-700">
        {initials}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />
    </div>
  );
}

export default function PartyPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: characters, isLoading, isError } = useParty(campaignId ?? '');
  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-2">
              Campaign Members
            </p>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
              The Fellowship
            </h1>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-sm opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Character</span>
          </button>
        </div>
      </header>

      <div className="px-10 py-10 pb-24">
        {isLoading && (
          <div className="flex items-center gap-3 text-on-surface-variant py-8">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading party…
          </div>
        )}

        {isError && (
          <p className="text-tertiary text-sm py-8">
            Failed to load party. Check your connection and try again.
          </p>
        )}

        {characters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {characters.map((char) => (
              <Link
                key={char.id}
                to={`/campaigns/${campaignId}/characters/${char.id}`}
                className="group relative bg-surface-container-low border-b border-outline-variant/10 hover:bg-surface-container transition-colors duration-300"
              >
                <CharacterInitials name={char.name} />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-headline text-2xl text-on-surface group-hover:text-primary transition-colors">
                        {char.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {(char.species || char.class) && (
                          <span className="text-xs uppercase tracking-wider text-secondary">
                            {[char.species, char.class].filter(Boolean).join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary/40 transition-colors text-xl mt-1">
                      chevron_right
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Empty state */}
            {characters.length === 0 && (
              <div className="col-span-3 text-center py-24 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">
                  groups
                </span>
                <p className="font-headline text-2xl text-on-surface-variant">
                  No characters yet.
                </p>
                <p className="text-on-surface-variant/60 text-sm">
                  Add characters to populate the fellowship.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
