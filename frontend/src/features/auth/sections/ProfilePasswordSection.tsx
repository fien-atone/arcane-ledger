/**
 * ProfilePasswordSection — change password form for the current user.
 *
 * Self-contained: owns its own form state (current/new/confirm), runs
 * client-side validation, calls the changePassword mutation, and shows
 * a success/error message.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChangePassword } from '@/features/auth/api/queries';
import { SectionPanel, LABEL_CLS, INPUT_CLS } from '@/shared/ui';

export function ProfilePasswordSection() {
  const { t } = useTranslation('profile');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const changePassword = useChangePassword();

  const handleChange = async () => {
    setMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: t('validation.all_fields_required') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: t('validation.passwords_not_match') });
      return;
    }
    if (newPassword.length < 4) {
      setMsg({ type: 'error', text: t('validation.password_min_length') });
      return;
    }

    try {
      const { data } = await changePassword.mutate(currentPassword, newPassword, confirmPassword);
      if (data?.changePassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMsg({ type: 'success', text: t('password_changed') });
      }
    } catch {
      setMsg({
        type: 'error',
        text: t('password_change_failed'),
      });
    }
  };

  return (
    <SectionPanel size="sm" title={t('change_password')} className="mb-8">
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-6 space-y-5">
        <div>
          <label className={LABEL_CLS}>{t('current_password_label')}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={INPUT_CLS}
            placeholder={t('current_password_placeholder')}
          />
        </div>

        <div>
          <label className={LABEL_CLS}>{t('new_password_label')}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={INPUT_CLS}
            placeholder={t('new_password_placeholder')}
          />
        </div>

        <div>
          <label className={LABEL_CLS}>{t('confirm_password_label')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={INPUT_CLS}
            placeholder={t('confirm_password_placeholder')}
          />
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
            onClick={handleChange}
            disabled={
              changePassword.loading || !currentPassword || !newPassword || !confirmPassword
            }
            className="flex items-center gap-2 px-5 py-2.5 border border-primary/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {changePassword.loading && (
              <span className="material-symbols-outlined animate-spin text-sm">
                progress_activity
              </span>
            )}
            {t('change_password_button')}
          </button>
        </div>
      </div>
    </SectionPanel>
  );
}
