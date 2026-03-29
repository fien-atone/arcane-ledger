const LEGEND_ITEMS = [
  { label: 'Hostile', color: '#f87171' },
  { label: 'Unfriendly', color: '#fb923c' },
  { label: 'Neutral', color: '#fbbf24' },
  { label: 'Friendly', color: '#4ade80' },
  { label: 'Allied', color: '#34d399' },
];

export function GraphLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-surface-container/90 backdrop-blur-sm rounded-sm border border-outline-variant/20 shadow-lg px-3 py-2 flex items-center gap-4">
      {LEGEND_ITEMS.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <svg width={18} height={4}>
            <line x1={0} y1={2} x2={18} y2={2} stroke={color} strokeWidth={2} />
          </svg>
          <span className="text-[9px] text-on-surface-variant/60 font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
