import { useParams } from 'react-router-dom';
import { useLocationTypes } from '@/features/locationTypes/api/queries';
import { CATEGORY_HEX_COLOR } from '@/entities/locationType';

interface Props {
  /** The location's `type` field (e.g. 'city', 'dungeon', 'river') */
  locationType: string;
  /** Material Symbols font-size class, e.g. 'text-[13px]' */
  size?: string;
  className?: string;
  /** When true, renders a generic location_on icon ignoring the type */
  generic?: boolean;
}

export function LocationIcon({ locationType, size = 'text-[14px]', className = '', generic }: Props) {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: types } = useLocationTypes(campaignId);
  const entry = generic ? undefined : types?.find((t) => t.id === locationType);
  const icon = entry?.icon ?? 'location_on';
  const hex = entry ? CATEGORY_HEX_COLOR[entry.category] : undefined;

  return (
    <span
      className={`material-symbols-outlined ${size} ${className} ${hex ? '' : 'text-on-surface-variant/40'}`}
      style={hex ? { color: hex } : undefined}
    >
      {icon}
    </span>
  );
}
