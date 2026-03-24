import { Link } from 'react-router-dom';

interface Props {
  to: string;
  children: React.ReactNode;
}

export function BackLink({ to, children }: Props) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors"
    >
      <span className="material-symbols-outlined text-sm">chevron_left</span>
      {children}
    </Link>
  );
}
