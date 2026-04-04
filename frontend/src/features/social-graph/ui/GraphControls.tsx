interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToView: () => void;
  onResetLayout: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onFitToView, onResetLayout }: Props) {
  const buttons = [
    { icon: 'zoom_in', label: 'Zoom in', onClick: onZoomIn },
    { icon: 'zoom_out', label: 'Zoom out', onClick: onZoomOut },
    { icon: 'fit_screen', label: 'Fit to view', onClick: onFitToView },
    { icon: 'refresh', label: 'Reset layout', onClick: onResetLayout },
  ];

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-0.5 bg-surface-container rounded-sm border border-outline-variant/20 overflow-hidden shadow-lg">
      {buttons.map((btn) => (
        <button
          key={btn.icon}
          onClick={btn.onClick}
          title={btn.label}
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
        </button>
      ))}
    </div>
  );
}
