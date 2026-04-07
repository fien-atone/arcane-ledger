import DOMPurify from 'dompurify';

/** Convert a plain-text string to minimal HTML if it doesn't already contain tags. */
export function toHtml(value: string | undefined | null): string {
  if (!value) return '';
  if (/<[a-z][\s\S]*?>/i.test(value)) return value;
  // Plain text: wrap each non-empty line in <p>
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
}

const PROSE_CLS =
  'prose prose-sm prose-invert max-w-none font-sans ' +
  'prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1 ' +
  'prose-strong:text-on-surface prose-strong:font-semibold ' +
  'prose-em:text-on-surface-variant/80 ' +
  'prose-ul:text-on-surface-variant prose-ol:text-on-surface-variant ' +
  'prose-li:my-0.5 prose-li:marker:text-primary/50 ' +
  'prose-blockquote:border-l-primary/40 prose-blockquote:text-on-surface-variant/70 prose-blockquote:italic ' +
  'prose-hr:border-outline-variant/20';

interface Props {
  value: string | undefined | null;
  className?: string;
}

export function RichContent({ value, className }: Props) {
  const html = toHtml(value);
  if (!html) return null;
  return (
    <div
      className={`${PROSE_CLS} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
