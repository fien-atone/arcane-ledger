/**
 * ProfileInfoSection — name + email form for the current user.
 *
 * Self-contained: owns its own form state, validation, Apollo mutation,
 * and feedback message. Reads/updates the Zustand auth store directly.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile } from '@/features/auth/api/queries';
import { SectionPanel } from '@/shared/ui';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

const inputCls =
  'w-full bg-surface-container border border-outline-variant/20 text-on-surface text-sm rounded-sm py-2.5 px-3 focus:border-primary focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const inputDisabledCls =
  'w-full bg-surface-container-low border border-outline-variant/10 text-on-surface-variant/50 text-sm rounded-sm py-2.5 px-3 cursor-not-allowed';

export function ProfileInfoSection() {
  const { t } = useTranslation('profile');
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setMsg(null);
    try {
      const { data } = await updateProfile.mutate(name.trim());
      if (data?.updateProfile) {
        updateUser({ name: data.updateProfile.name });
        setMsg({ type: 'success', text: t('profile_updated') });
      }
    } catch {
      setMsg({
        type: 'error',
        text: t('profile_update_failed'),
      });
    }
  };

  return (
    <SectionPanel size="sm" title={t('profile_information')} className="mb-8">
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-6 space-y-5">
        <div>
          <label className={labelCls}>{t('name_label')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder={t('name_placeholder')}
          />
        </div>

        <div>
          <label className={labelCls}>{t('email_label')}</label>
          <input
            type="text"
            value={user?.email || ''}
            disabled
            className={inputDisabledCls}
          />
          <p className="text-[10px] text-on-surface-variant/40 mt-1.5 italic">
            {t('email_cannot_change')}
          </p>
        </div>

        {msg && (
          <p
            className={`text-xs ${
              msg.type === 'success' ? 'text-secondary' : 'text-tertiary'
            }`}
          >
            {msg.text}
          </p>
        )}

        <div className="pt-1">
          <button
            onClick={handleSave}
            disabled={updateProfile.loading || !name.trim() || name.trim() === user?.name}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {updateProfile.loading && (
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
            )}
            {t('save_changes')}
          </button>
        </div>
      </div>
    </SectionPanel>
  );
}
