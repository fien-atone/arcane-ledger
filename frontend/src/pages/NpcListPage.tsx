import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { useGroups } from '@/features/groups/api';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { useSpecies } from '@/features/species/api';
import { LocationIcon, RichContent, EmptyState } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { NPC, NpcStatus } from '@/entities/npc';

type StatusFilter = 'all' | NpcStatus;

const STATUS_PILLS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Alive', value: 'alive' },
  { label: 'Dead', value: 'dead' },
  { label: 'Missing', value: 'missing' },
  { label: 'Unknown', value: 'unknown' },
];

const STATUS_STYLES: Record<NpcStatus, { pill: string; dot: string; label: string; icon: string }> = {
  alive:   { pill: 'bg-secondary-container/20 text-secondary border border-secondary-container/30', dot: 'bg-secondary',                label: 'Alive',   icon: 'person' },
  dead:    { pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20', dot: 'bg-outline-variant', label: 'Dead',    icon: 'skull' },
  missing: { pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20', dot: 'bg-on-surface-variant', label: 'Missing', icon: 'person_search' },
  unknown: { pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10', dot: 'bg-outline',                     label: 'Unknown', icon: 'help' },
};

function NpcAvatar({ name, image }: { name: string; image?: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const resolved = resolveImageUrl(image);
  return (
    <div className="w-10 h-10 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest">
      {resolved ? (
        <img src={resolved} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">{title}</h3>
      <div className="h-px flex-1 bg-outline-variant/20" />
    </div>
  );
}

function NpcDetail({ npc, campaignId }: { npc: NPC; campaignId: string }) {
  const st = STATUS_STYLES[npc.status];
  const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const { data: allSpecies } = useSpecies(campaignId ?? '');
  const { data: allLocations } = useLocations(campaignId);
  const { data: allGroups } = useGroups(campaignId);
  const matchedSpecies = npc.species
    ? allSpecies?.find((s) => s.id === npc.speciesId || s.name.toLowerCase() === npc.species?.toLowerCase())
    : undefined;

  const presences = npc.locationPresences ?? [];
  const linkedLocations = presences
    .map((p) => {
      const loc = allLocations?.find((l) => l.id === p.locationId);
      return loc ? { loc, note: p.note } : null;
    })
    .filter(Boolean) as { loc: NonNullable<typeof allLocations>[number]; note?: string }[];

  const resolvedImage = resolveImageUrl(npc.image);
  const displayName = matchedSpecies?.name ?? npc.species;
  const genderLabel = npc.gender
    ? (npc.gender === 'nonbinary' ? 'Non-binary' : npc.gender.charAt(0).toUpperCase() + npc.gender.slice(1))
    : null;
  const metaParts = [displayName, genderLabel, npc.age != null ? `Age ${npc.age}` : null].filter(Boolean);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Character card header */}
      <div className="flex-shrink-0 flex gap-6 p-8 pb-6">
        {/* Portrait */}
        <div className="w-36 h-48 rounded-sm border border-outline-variant/20 overflow-hidden bg-surface-container-low flex-shrink-0">
          {resolvedImage ? (
            <img src={resolvedImage} alt={npc.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-headline text-5xl font-bold text-on-surface-variant/8 select-none leading-none">{initials}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center gap-3 min-w-0">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{npc.name}</h2>
            {npc.aliases.length > 0 && (
              <p className="text-xs text-on-surface-variant/40 italic mt-0.5">{npc.aliases.join(', ')}</p>
            )}
          </div>

          {metaParts.length > 0 && (
            <div className="flex items-center gap-1.5">
              {matchedSpecies ? (
                <Link to={`/campaigns/${campaignId}/species/${matchedSpecies.id}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:border-primary/30 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {metaParts.join(' · ')}
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {metaParts.join(' · ')}
                </span>
              )}
            </div>
          )}

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest w-fit ${st.pill}`}>
            <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
            {st.label}
          </span>
        </div>
      </div>

      <div className="border-t border-outline-variant/10 mx-8" />

      <div className="px-8 py-6 flex flex-col gap-5">

        {npc.appearance && (
          <div>
            <SectionHeader title="Appearance" />
            <RichContent value={npc.appearance} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {npc.personality && (
          <div>
            <SectionHeader title="Personality" />
            <RichContent value={npc.personality} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {npc.description && (
          <div>
            <SectionHeader title="Background" />
            <RichContent value={npc.description} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {npc.motivation && (
          <div>
            <SectionHeader title="Motivation & Ideals" />
            <RichContent value={npc.motivation} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {/* Group Memberships */}
        {npc.groupMemberships.length > 0 && (
          <div>
            <SectionHeader title="Groups" />
            <div className="flex flex-wrap gap-2">
              {npc.groupMemberships.map((m) => {
                const group = allGroups?.find((g) => g.id === m.groupId);
                const label = m.subfaction ?? group?.name ?? m.groupId;
                return (
                  <Link
                    key={m.groupId}
                    to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-primary/30 rounded-sm transition-colors group"
                  >
                    <span className="material-symbols-outlined text-primary/60 text-[13px]">groups</span>
                    <span className="text-xs text-on-surface group-hover:text-primary transition-colors">{label}</span>
                    {m.relation && (
                      <span className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider">{m.relation}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Locations */}
        {linkedLocations.length > 0 && (
          <div>
            <SectionHeader title={`Locations (${linkedLocations.length})`} />
            <div className="flex flex-wrap gap-2">
              {linkedLocations.map(({ loc }) => (
                <Link
                  key={loc.id}
                  to={`/campaigns/${campaignId}/locations/${loc.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-sm text-xs text-on-surface hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <LocationIcon locationType={loc.type} size="text-[13px]" />
                  {loc.name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function NpcListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: npcs, isLoading, isError } = useNpcs(campaignId ?? '');
  const { data: allSpecies } = useSpecies(campaignId ?? '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const resolveSpeciesName = (npc: NPC) =>
    allSpecies?.find((s) => s.id === npc.speciesId)?.name ?? npc.species;

  const filtered = useMemo(() => {
    if (!npcs) return [];
    return npcs.filter((n) => {
      const matchSearch = !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [npcs, search, statusFilter]);

  const selected = npcs?.find((n) => n.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">NPCs</h1>
            <p className="text-on-surface-variant text-sm mt-1">Inhabitants, allies, and adversaries.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-surface-container rounded-sm border border-outline-variant/20 overflow-hidden">
              <button
                className="p-2 bg-primary/15 text-primary"
                title="List view"
                disabled
              >
                <span className="material-symbols-outlined text-[20px]">list</span>
              </button>
              <Link
                to={`/campaigns/${campaignId}/npcs/relationships`}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                title="Graph view"
              >
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </Link>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">Add NPC</span>
            </button>
          </div>
        </div>
      </header>

      {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…</div>}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load NPCs.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            {/* Search + status pills */}
            <div className="px-4 pt-4 pb-3 flex-shrink-0 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search by name or alias…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_PILLS.map(({ label, value }) => {
                  const count = value === 'all' ? (npcs?.length ?? 0) : (npcs?.filter((n) => n.status === value).length ?? 0);
                  return (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                        statusFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {label} <span className={statusFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {filtered.length === 0 && <EmptyState icon="person_off" title="No NPCs found." subtitle="Create your first NPC to get started." />}
              {filtered.map((npc) => {
                const st = STATUS_STYLES[npc.status];
                const isSelected = selected?.id === npc.id;
                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => setSelectedId(npc.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                      isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                    }`}
                  >
                    <NpcAvatar name={npc.name} image={npc.image} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>{npc.name}</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>{resolveSpeciesName(npc) ?? '—'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider flex-shrink-0 ${st.pill}`}>
                      <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
              <p className="text-[10px] text-on-surface-variant/40">
                <span className="text-on-surface font-bold">{filtered.length}</span> of <span className="text-primary font-bold">{npcs?.length ?? 0}</span> known souls
              </p>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <NpcDetail npc={selected} campaignId={campaignId ?? ''} />
                <Link
                  to={`/campaigns/${campaignId}/npcs/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">Select an NPC</div>
            )}
          </div>
        </div>
      )}

      <NpcEditDrawer open={addOpen} onClose={() => setAddOpen(false)} campaignId={campaignId ?? ''} />
    </main>
  );
}
