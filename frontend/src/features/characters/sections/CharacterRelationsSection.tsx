/**
 * Character social relations — GM-only wrapper around the generic
 * SocialRelationsSection used for tracking typed relations between entities.
 */
import { SocialRelationsSection } from '@/features/relations/ui';

interface Props {
  campaignId: string;
  characterId: string;
  isGm: boolean;
}

export function CharacterRelationsSection({ campaignId, characterId, isGm }: Props) {
  if (!isGm) return null;
  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <SocialRelationsSection campaignId={campaignId} entityId={characterId} />
    </div>
  );
}
