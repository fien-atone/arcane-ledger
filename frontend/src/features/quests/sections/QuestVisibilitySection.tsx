/**
 * Player visibility panel for quests. Renders only when:
 *   - the party module is enabled, AND
 *   - the current viewer is the GM.
 *
 * Owns its own mutation hook. Matches the original QuestDetailPage: the
 * VisibilityPanel is rendered directly, without an outer card wrapper.
 */
import { VisibilityPanel } from '@/shared/ui';
import { useSetQuestVisibility } from '@/features/quests/api/queries';
import { QUEST_VISIBILITY_FIELDS, QUEST_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import type { Quest } from '@/entities/quest';

interface Props {
  campaignId: string;
  quest: Quest;
  isGm: boolean;
  partyEnabled: boolean;
}

export function QuestVisibilitySection({ campaignId, quest, isGm, partyEnabled }: Props) {
  const setQuestVisibility = useSetQuestVisibility();

  if (!isGm || !partyEnabled) return null;

  return (
    <VisibilityPanel
      playerVisible={quest.playerVisible ?? false}
      playerVisibleFields={quest.playerVisibleFields ?? []}
      fields={QUEST_VISIBILITY_FIELDS}
      basicPreset={QUEST_BASIC_PRESET}
      onToggleVisible={(v) => setQuestVisibility.mutate({
        campaignId, id: quest.id,
        playerVisible: v, playerVisibleFields: quest.playerVisibleFields ?? [],
      })}
      onToggleField={(f, on) => {
        const fields = on
          ? [...(quest.playerVisibleFields ?? []), f]
          : (quest.playerVisibleFields ?? []).filter((x) => x !== f);
        setQuestVisibility.mutate({
          campaignId, id: quest.id,
          playerVisible: quest.playerVisible ?? false, playerVisibleFields: fields,
        });
      }}
      onSetPreset={(fields) => setQuestVisibility.mutate({
        campaignId, id: quest.id,
        playerVisible: quest.playerVisible ?? false, playerVisibleFields: fields,
      })}
      isPending={setQuestVisibility.isPending}
    />
  );
}
