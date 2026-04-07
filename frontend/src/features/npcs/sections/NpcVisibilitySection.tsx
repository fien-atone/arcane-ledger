/**
 * Player visibility panel for NPCs. Renders only when:
 *   - the party module is enabled, AND
 *   - the current viewer is the GM.
 *
 * Owns its own mutation hook.
 */
import { VisibilityPanel } from '@/shared/ui';
import { useSetNpcVisibility } from '@/features/npcs/api/queries';
import { NPC_VISIBILITY_FIELDS, NPC_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import type { NPC } from '@/entities/npc';

interface Props {
  campaignId: string;
  npc: NPC;
  isGm: boolean;
  partyEnabled: boolean;
}

export function NpcVisibilitySection({ campaignId, npc, isGm, partyEnabled }: Props) {
  const setNpcVisibility = useSetNpcVisibility();

  if (!isGm || !partyEnabled) return null;

  return (
    <VisibilityPanel
      playerVisible={npc.playerVisible ?? false}
      playerVisibleFields={npc.playerVisibleFields ?? []}
      fields={NPC_VISIBILITY_FIELDS}
      basicPreset={NPC_BASIC_PRESET}
      onToggleVisible={(v) => setNpcVisibility.mutate({
        campaignId, id: npc.id,
        playerVisible: v, playerVisibleFields: npc.playerVisibleFields ?? [],
      })}
      onToggleField={(f, on) => {
        const fields = on
          ? [...(npc.playerVisibleFields ?? []), f]
          : (npc.playerVisibleFields ?? []).filter((x) => x !== f);
        setNpcVisibility.mutate({
          campaignId, id: npc.id,
          playerVisible: npc.playerVisible ?? false, playerVisibleFields: fields,
        });
      }}
      onSetPreset={(fields) => setNpcVisibility.mutate({
        campaignId, id: npc.id,
        playerVisible: npc.playerVisible ?? false, playerVisibleFields: fields,
      })}
      isPending={setNpcVisibility.isPending}
    />
  );
}
