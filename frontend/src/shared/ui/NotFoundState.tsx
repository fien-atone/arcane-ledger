import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NotFoundStateProps {
  /** Material Symbols icon name (default: 'search_off') */
  icon?: string;
  /** Headline text — defaults to 'Not found' translation */
  title?: string;
  /** Subtitle text explaining what's missing or why */
  subtitle?: string;
  /** Where the back button should navigate. If omitted, no back button is shown. */
  backTo?: string;
  /** Label for the back button (default: campaign dashboard) */
  backLabel?: string;
  /** Variant: 'not_found' (entity missing) or 'no_access' (permission denied) */
  variant?: 'not_found' | 'no_access';
}

/**
 * Friendly empty/error state shown when a requested entity doesn't exist
 * or the user has no access to it. Replaces ugly raw "Not found" text.
 */
export function NotFoundState({
  icon,
  title,
  subtitle,
  backTo,
  backLabel,
  variant = 'not_found',
}: NotFoundStateProps) {
  const { t } = useTranslation();

  const defaultIcon = variant === 'no_access' ? 'lock' : 'search_off';
  const resolvedIcon = icon ?? defaultIcon;
  const resolvedTitle = title ?? (variant === 'no_access' ? t('no_access_title') : t('not_found_title'));
  const resolvedSubtitle = subtitle ?? (variant === 'no_access' ? t('no_access_subtitle') : t('not_found_subtitle'));

  return (
    <main className="flex-1 flex items-center justify-center bg-surface min-h-screen">
      <div className="text-center space-y-6 max-w-md px-8">
        {/* Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-surface-container-low border border-outline-variant/15 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">{resolvedIcon}</span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            {resolvedTitle}
          </h2>
          <p className="text-sm text-on-surface-variant/50 leading-relaxed">
            {resolvedSubtitle}
          </p>
        </div>

        {/* Back button */}
        {backTo && (
          <div className="flex items-center justify-center pt-2">
            <Link
              to={backTo}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-label uppercase tracking-widest text-on-surface-variant border border-outline-variant/25 rounded-sm hover:border-outline-variant/50 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              {backLabel ?? t('nav.back')}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
