interface Props {
  /** Wrapper element — 'main' for page-level, 'div' for inline */
  as?: 'main' | 'div';
  text?: string;
}

export function LoadingSpinner({ as: Tag = 'div', text = 'Loading…' }: Props) {
  return (
    <Tag className="flex items-center gap-3 p-12 text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin">progress_activity</span>
      {text}
    </Tag>
  );
}
