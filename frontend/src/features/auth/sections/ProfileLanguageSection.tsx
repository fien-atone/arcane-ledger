/**
 * ProfileLanguageSection — language selector for the current user.
 *
 * Self-contained: reads the current i18n language and changes it via
 * i18next directly. No server persistence — language is a client pref.
 */
import { useTranslation } from 'react-i18next';
import { Select } from '@/shared/ui';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

export function ProfileLanguageSection() {
  const { t, i18n } = useTranslation('profile');

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {t('language')}
        </h3>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-6">
        <label className={labelCls}>{t('language_label')}</label>
        <div className="max-w-xs">
          <Select
            value={i18n.language.startsWith('ru') ? 'ru' : 'en'}
            options={LANGUAGES}
            onChange={(v) => i18n.changeLanguage(v || 'en')}
          />
        </div>
      </div>
    </div>
  );
}
