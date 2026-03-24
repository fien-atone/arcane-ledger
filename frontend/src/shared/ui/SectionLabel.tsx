interface Props {
  children: React.ReactNode;
  /** 'primary' = gold/accent text (default), 'muted' = on-surface-variant */
  color?: 'primary' | 'muted';
  className?: string;
}

export function SectionLabel({ children, color = 'primary', className = '' }: Props) {
  const colorCls = color === 'primary' ? 'text-primary' : 'text-on-surface-variant';
  return (
    <span className={`text-[10px] font-label uppercase tracking-widest block ${colorCls} ${className}`}>
      {children}
    </span>
  );
}
