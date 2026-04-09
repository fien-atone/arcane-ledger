/**
 * Group hero header — type pill, name, aliases, and edit/delete actions.
 *
 * Owns the GroupEditDrawer state and the inline delete-confirm flow.
 * Self-contained: fetches its own group-types list to resolve the type pill.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGroupTypes } from '@/features/groupTypes';
import { GroupEditDrawer } from '@/features/groups/ui';
import { InlineConfirm, useInlineConfirm } from '@/shared/ui';
import type { Group } from '@/entities/group';

interface Props {
  campaignId: string;
  group: Group;
  isGm: boolean;
  groupTypesEnabled: boolean;
  onDelete: () => void;
}

export function GroupHeroSection({ campaignId, group, isGm, groupTypesEnabled, onDelete }: Props) {
  const { t } = useTranslation('groups');
  const { data: groupTypes } = useGroupTypes(campaignId);
  const [editOpen, setEditOpen] = useState(false);
  const confirmDelete = useInlineConfirm<string>();

  const tc = groupTypes?.find((gt) => gt.id === group.type) ?? { name: group.type ?? '', icon: 'category' };

  return (
    <>
      <section className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8 mb-8">
        <div className="space-y-4">
          {groupTypesEnabled && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
                <span className="material-symbols-outlined text-[13px]">{tc.icon}</span>
                {tc.name}
              </span>
            </div>
          )}
          <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface leading-tight">
            {group.name}
          </h1>
          {group.aliases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {group.aliases.map((alias) => (
                <span key={alias} className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic">
                  "{alias}"
                </span>
              ))}
            </div>
          )}
        </div>

        {isGm && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            {confirmDelete.isAsking(group.id) ? (
              <InlineConfirm
                variant="hero"
                label={t('confirm_delete')}
                onYes={onDelete}
                onNo={confirmDelete.cancel}
              />
            ) : (
              <button onClick={() => confirmDelete.ask(group.id)}
                className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {t('edit')}
            </button>
          </div>
        )}
      </section>

      <GroupEditDrawer open={editOpen} onClose={() => setEditOpen(false)} campaignId={campaignId} group={group} />
    </>
  );
}
