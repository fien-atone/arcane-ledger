/**
 * DashboardPartySection — compact list of party characters with portraits
 * and a link to the full party management page.
 *
 * The species row is conditional on whether the species section is enabled
 * for the campaign; the parent passes that flag so the section doesn't need
 * to re-query the campaign.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useParty } from '@/features/characters/api/queries';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { SectionPanel } from '@/shared/ui';

interface Props {
  campaignId: string;
  speciesEnabled: boolean;
}

export function DashboardPartySection({ campaignId, speciesEnabled }: Props) {
  const { t } = useTranslation('campaigns');
  const { data: party } = useParty(campaignId);

  return (
    <SectionPanel
      title={t('dashboard.the_party')}
      action={
        <Link
          to={`/campaigns/${campaignId}/party`}
          className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
        >
          {t('dashboard.manage')}
        </Link>
      }
    >
      {party && party.length > 0 ? (
        <div className="space-y-2">
          {party.map((character) => {
            const initials = character.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
            return (
              <Link
                key={character.id}
                to={`/campaigns/${campaignId}/characters/${character.id}`}
                className="group flex items-center gap-3 p-3 bg-surface-container-high border border-outline-variant/15 hover:border-primary/20 rounded-sm transition-colors"
              >
                <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                  {character.image ? (
                    <img src={resolveImageUrl(character.image)} alt={character.name} className="w-full h-full object-cover rounded-sm" />
                  ) : (
                    <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{character.name}</p>
                  <p className="text-[10px] text-on-surface-variant/40 truncate">
                    {[speciesEnabled ? character.species : null, character.class].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant/40 italic">{t('dashboard.no_characters')}</p>
      )}
    </SectionPanel>
  );
}
