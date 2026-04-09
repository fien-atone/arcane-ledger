/**
 * Player visibility panel for groups. Renders only when:
 *   - the party module is enabled, AND
 *   - the current viewer is the GM.
 *
 * Owns its own mutation hook.
 */
import { VisibilityPanel, SectionPanel } from '@/shared/ui';
import { useSetGroupVisibility } from '@/features/groups/api';
import { GROUP_VISIBILITY_FIELDS, GROUP_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import type { Group } from '@/entities/group';

interface Props {
  campaignId: string;
  group: Group;
  isGm: boolean;
  partyEnabled: boolean;
}

export function GroupVisibilitySection({ campaignId, group, isGm, partyEnabled }: Props) {
  const setGroupVisibility = useSetGroupVisibility();

  if (!isGm || !partyEnabled) return null;

  return (
    <SectionPanel>
      <VisibilityPanel
        playerVisible={group.playerVisible ?? false}
        playerVisibleFields={group.playerVisibleFields ?? []}
        fields={GROUP_VISIBILITY_FIELDS}
        basicPreset={GROUP_BASIC_PRESET}
        onToggleVisible={(v) => setGroupVisibility.mutate({
          campaignId, id: group.id,
          playerVisible: v, playerVisibleFields: group.playerVisibleFields ?? [],
        })}
        onToggleField={(f, on) => {
          const fields = on
            ? [...(group.playerVisibleFields ?? []), f]
            : (group.playerVisibleFields ?? []).filter((x) => x !== f);
          setGroupVisibility.mutate({
            campaignId, id: group.id,
            playerVisible: group.playerVisible ?? false, playerVisibleFields: fields,
          });
        }}
        onSetPreset={(fields) => setGroupVisibility.mutate({
          campaignId, id: group.id,
          playerVisible: group.playerVisible ?? false, playerVisibleFields: fields,
        })}
        isPending={setGroupVisibility.isPending}
      />
    </SectionPanel>
  );
}
