interface Props {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
      <span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">{icon}</span>
      <p className="font-headline text-lg text-on-surface-variant">{title}</p>
      {subtitle && <p className="text-xs text-on-surface-variant/40">{subtitle}</p>}
    </div>
  );
}
