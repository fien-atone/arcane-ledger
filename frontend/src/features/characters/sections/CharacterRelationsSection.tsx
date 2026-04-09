/**
 * Character social relations — GM-only wrapper around the generic
 * SocialRelationsSection used for tracking typed relations between entities.
 */
import { SocialRelationsSection } from '@/features/relations/ui';
import { SectionPanel } from '@/shared/ui';

interface Props {
  campaignId: string;
  characterId: string;
  isGm: boolean;
}

export function CharacterRelationsSection({ campaignId, characterId, isGm }: Props) {
  if (!isGm) return null;
  return (
    <SectionPanel>
      <SocialRelationsSection campaignId={campaignId} entityId={characterId} />
    </SectionPanel>
  );
}
