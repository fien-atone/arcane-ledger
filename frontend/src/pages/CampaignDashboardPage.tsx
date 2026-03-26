import { Link, useParams } from 'react-router-dom';
import { useCampaign } from '@/features/campaigns/api/queries';
import { useLastSession } from '@/features/sessions/api/queries';
import { useActiveQuests } from '@/features/quests/api/queries';
import { useParty } from '@/features/characters/api/queries';
import type { PlayerCharacter } from '@/entities/character';
import type { Quest } from '@/entities/quest';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function CharacterAvatar({ character }: { character: PlayerCharacter }) {
  const initials = character.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-surface-container-highest border border-primary/30 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
      {initials}
    </div>
  );
}

function QuestItem({ quest, campaignId }: { quest: Quest; campaignId: string }) {
  const isActive = quest.status === 'active';
  return (
    <Link
      to={`/campaigns/${campaignId}/quests/${quest.id}`}
      className="group block bg-surface-container p-5 rounded-sm border-l-2 hover:bg-surface-container-high transition-all duration-200"
      style={{ borderLeftColor: isActive ? 'rgb(123 214 209)' : 'rgb(77 70 53)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-on-surface text-sm font-medium">{quest.title}</span>
            <span
              className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-label ${
                isActive
                  ? 'bg-secondary/20 text-secondary'
                  : 'bg-outline-variant/20 text-on-surface-variant'
              }`}
            >
              {quest.status}
            </span>
          </div>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            {quest.description.slice(0, 80)}
            {quest.description.length > 80 ? '…' : ''}
          </p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant/0 group-hover:text-on-surface-variant text-base transition-all duration-200 flex-shrink-0">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}

export default function CampaignDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const campaignId = id ?? '';

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: lastSession, isLoading: sessionLoading } = useLastSession(campaignId);
  const { data: activeQuests, isLoading: questsLoading } = useActiveQuests(campaignId);
  const { data: party, isLoading: partyLoading } = useParty(campaignId);

  if (campaignLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-on-surface-variant">
        Loading campaign…
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-12 text-on-surface-variant">Campaign not found.</div>
    );
  }

  return (
    <div className="p-10 max-w-screen-xl mx-auto">
      {/* Campaign header */}
      <div className="mb-10">
        <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary block mb-2">
          Game Master
        </span>
        <h1 className="font-headline text-6xl font-bold text-on-surface mb-2">
          {campaign.title}
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
          {campaign.description}
        </p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <div className="col-span-8 space-y-6">
          {/* Last Session Hero Card */}
          <div className="bg-surface-container-low rounded-lg p-10 border border-outline-variant/10">
            {sessionLoading ? (
              <p className="text-on-surface-variant text-sm">Loading session…</p>
            ) : lastSession ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
                    Session {lastSession.number}
                  </span>
                  <span className="text-on-surface-variant/40 text-xs">·</span>
                  <span className="text-on-surface-variant text-xs">
                    {formatDate(lastSession.datetime)}
                  </span>
                </div>
                <h2 className="font-headline text-5xl font-bold text-on-surface mb-4 leading-tight">
                  {lastSession.title}
                </h2>
                {lastSession.brief && (
                  <p className="text-on-surface-variant text-sm mb-2 italic">
                    {lastSession.brief}
                  </p>
                )}
                <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
                  {lastSession.summary}
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/campaigns/${campaignId}/sessions/${lastSession.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-surface bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 rounded-sm"
                  >
                    <span className="material-symbols-outlined text-base">history_edu</span>
                    View full session
                  </Link>
                  <Link
                    to={`/campaigns/${campaignId}/sessions`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary border border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 rounded-sm"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Add new session
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-on-surface-variant text-sm">No sessions yet.</p>
            )}
          </div>

          {/* Active Quests */}
          <div>
            <div className="flex items-end justify-between mb-5">
              <div>
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary block mb-1">
                  Campaign Progress
                </span>
                <h2 className="font-headline text-3xl font-bold text-on-surface">
                  Active Quests
                </h2>
              </div>
              <Link
                to={`/campaigns/${campaignId}/quests`}
                className="text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors duration-200"
              >
                View all quests →
              </Link>
            </div>

            {questsLoading ? (
              <p className="text-on-surface-variant text-sm">Loading quests…</p>
            ) : activeQuests && activeQuests.length > 0 ? (
              <div className="space-y-3">
                {activeQuests.map((quest) => (
                  <QuestItem key={quest.id} quest={quest} campaignId={campaignId} />
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant text-sm">No active quests.</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-4 space-y-6">
          {/* Next Session + GM Notes */}
          <div className="bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant/10">
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-1">
                Next Session
              </span>
              <p className="text-on-surface text-sm font-medium">Schedule TBD</p>
            </div>
          </div>

          {/* The Party */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-xl font-bold text-on-surface">The Party</h3>
              <Link
                to={`/campaigns/${campaignId}/party`}
                className="text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors duration-200"
              >
                Manage party →
              </Link>
            </div>
            {partyLoading ? (
              <p className="text-on-surface-variant text-xs">Loading…</p>
            ) : party && party.length > 0 ? (
              <div className="space-y-2">
                {party.map((character) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-3 bg-surface-container px-4 py-3 rounded-sm"
                  >
                    <CharacterAvatar character={character} />
                    <div className="min-w-0">
                      <p className="text-on-surface text-sm font-medium truncate">
                        {character.name}
                      </p>
                      <p className="text-on-surface-variant text-xs truncate">
                        {[character.species, character.class]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant text-xs">No characters yet.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-4">
              Quick Actions
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'NPC', icon: 'person_add', to: `/campaigns/${campaignId}/npcs` },
                { label: 'Session', icon: 'history_edu', to: `/campaigns/${campaignId}/sessions` },
                { label: 'Quest', icon: 'auto_awesome', to: `/campaigns/${campaignId}/quests` },
              ].map(({ label, icon, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex flex-col items-center gap-2 bg-surface-container hover:bg-surface-container-high p-4 rounded-sm transition-all duration-200 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                  <span className="text-xs font-label uppercase tracking-widest">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
