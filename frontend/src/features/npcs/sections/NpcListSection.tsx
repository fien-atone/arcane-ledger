/**
 * NpcListSection — main list card for NpcListPage.
 *
 * Renders loading / error / empty states and, once loaded, a table of NPC
 * rows with avatar, name, species, age, status pill, and (for GMs with the
 * party section enabled) a visibility toggle.
 *
 * Presentational: receives the already-filtered list + handlers from
 * useNpcListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { NPC, NpcStatus } from '@/entities/npc';

const STATUS_STYLES: Record<NpcStatus, { pill: string; dot: string }> = {
  alive: {
    pill: 'bg-primary/10 text-primary border border-primary/20',
    dot: 'bg-primary',
  },
  dead: {
    pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20',
    dot: 'bg-outline-variant',
  },
  missing: {
    pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
    dot: 'bg-on-surface-variant',
  },
  unknown: {
    pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',
    dot: 'bg-outline',
  },
};

function NpcAvatar({ name, image }: { name: string; image?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const resolved = resolveImageUrl(image);
  return (
    <div className="w-9 h-9 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest">
      {resolved ? (
        <img src={resolved} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-on-surface-variant/60">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}

interface Props {
  campaignId: string;
  isGm: boolean;
  partyEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
  filtered: NPC[];
  resolveSpeciesName: (npc: NPC) => string | undefined;
  onToggleVisibility: (npc: NPC) => void;
}

export function NpcListSection({
  campaignId,
  isGm,
  partyEnabled,
  isLoading,
  isError,
  filtered,
  resolveSpeciesName,
  onToggleVisibility,
}: Props) {
  const { t } = useTranslation('npcs');

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-12 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
        {t('loading')}
      </div>
    );
  }

  if (isError) {
    return <p className="text-tertiary text-sm p-12">{t('error')}</p>;
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon="person_off"
        title={t('empty_title')}
        subtitle={t('empty_subtitle')}
      />
    );
  }

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
        <span className="w-9 flex-shrink-0" />
        <span className="flex-1 min-w-0">{t('column_name')}</span>
        <span className="w-28 flex-shrink-0 hidden lg:block">
          {t('column_species')}
        </span>
        <span className="w-14 flex-shrink-0 hidden xl:block">
          {t('column_age')}
        </span>
        <span className="w-24 flex-shrink-0">{t('column_status')}</span>
        {isGm && partyEnabled && <span className="w-8 flex-shrink-0" />}
      </div>
      {filtered.map((npc) => {
        const st = STATUS_STYLES[npc.status];
        const species = resolveSpeciesName(npc);
        return (
          <Link
            key={npc.id}
            to={`/campaigns/${campaignId}/npcs/${npc.id}`}
            className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <NpcAvatar name={npc.name} image={npc.image} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                  {npc.name}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate lg:hidden">
                  {[
                    species,
                    npc.age != null ? `${t('age_prefix')} ${npc.age}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || '\u2014'}
                </p>
              </div>
              <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 truncate hidden lg:block">
                {species || '\u2014'}
              </span>
              <span className="w-14 flex-shrink-0 text-xs text-on-surface-variant/60 hidden xl:block">
                {npc.age != null ? npc.age : '\u2014'}
              </span>
              <span
                className={`w-24 flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${st.pill}`}
              >
                <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                {t(`status_${npc.status}`)}
              </span>
              {isGm && partyEnabled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisibility(npc);
                  }}
                  title={
                    npc.playerVisible
                      ? t('visible_to_players')
                      : t('hidden_from_players')
                  }
                  className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                    npc.playerVisible
                      ? 'text-primary/60 hover:text-primary'
                      : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {npc.playerVisible ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
