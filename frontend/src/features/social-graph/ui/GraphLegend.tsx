import { useTranslation } from 'react-i18next';

const LEGEND_ITEMS = [
  { key: 'attitude_hostile', color: '#f87171' },
  { key: 'attitude_unfriendly', color: '#fb923c' },
  { key: 'attitude_neutral', color: '#fbbf24' },
  { key: 'attitude_friendly', color: '#4ade80' },
  { key: 'attitude_allied', color: '#34d399' },
];

export function GraphLegend() {
  const { t } = useTranslation('social');

  return (
    <div className="absolute bottom-4 left-4 bg-surface-container/90 backdrop-blur-sm rounded-sm border border-outline-variant/20 shadow-lg px-3 py-2 flex items-center gap-4">
      {LEGEND_ITEMS.map(({ key, color }) => (
        <div key={key} className="flex items-center gap-1.5">
          <svg width={18} height={4}>
            <line x1={0} y1={2} x2={18} y2={2} stroke={color} strokeWidth={2} />
          </svg>
          <span className="text-[9px] text-on-surface-variant/60 font-medium uppercase tracking-wider">
            {t(key)}
          </span>
        </div>
      ))}
    </div>
  );
}
