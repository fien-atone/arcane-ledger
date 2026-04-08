/**
 * ProfileHeroSection — header card at the top of the profile page.
 *
 * Presentation-only: shows the page title and subtitle.
 */
import { useTranslation } from 'react-i18next';

export function ProfileHeroSection() {
  const { t } = useTranslation('profile');

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
      <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
        {t('title')}
      </h1>
      <p className="text-on-surface-variant text-sm mt-1">
        {t('subtitle')}
      </p>
    </div>
  );
}
