import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, Select } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile, useChangePassword } from '@/features/auth/api/queries';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

const inputCls =
  'w-full bg-surface-container border border-outline-variant/20 text-on-surface text-sm rounded-sm py-2.5 px-3 focus:border-primary focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const inputDisabledCls =
  'w-full bg-surface-container-low border border-outline-variant/10 text-on-surface-variant/50 text-sm rounded-sm py-2.5 px-3 cursor-not-allowed';

export default function ProfilePage() {
  const { t, i18n } = useTranslation('profile');

  const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
  ];
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const updateProfile = useUpdateProfile();

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const changePassword = useChangePassword();

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleProfileSave = async () => {
    if (!name.trim()) return;
    setProfileMsg(null);
    try {
      const { data } = await updateProfile.mutate(name.trim());
      if (data?.updateProfile) {
        updateUser({ name: data.updateProfile.name });
        setProfileMsg({ type: 'success', text: t('profile_updated') });
      }
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err?.message || t('profile_update_failed'),
      });
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: t('validation.all_fields_required') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: t('validation.passwords_not_match') });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: t('validation.password_min_length') });
      return;
    }

    try {
      const { data } = await changePassword.mutate(currentPassword, newPassword, confirmPassword);
      if (data?.changePassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ type: 'success', text: t('password_changed') });
      }
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err?.message || t('password_change_failed'),
      });
    }
  };

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
    <div className="flex justify-center pt-6 pb-8">
      <Link
        to="/campaigns"
        className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        {t('common:nav.my_campaigns')}
      </Link>
    </div>

    <div className="px-4 sm:px-8 max-w-3xl mx-auto w-full pb-20">
      {/* Page header */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
          {t('title')}
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Profile section */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t('profile_information')}</h3>
          <div className="h-px flex-1 bg-outline-variant/20" />
        </div>

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

          {profileMsg && (
            <p
              className={`text-xs ${
                profileMsg.type === 'success' ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {profileMsg.text}
            </p>
          )}

          <div className="pt-1">
            <button
              onClick={handleProfileSave}
              disabled={updateProfile.loading || !name.trim() || name.trim() === user?.name}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {updateProfile.loading && (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              )}
              {t('save_changes')}
            </button>
          </div>
        </div>
      </div>

      {/* Language section */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t('language')}</h3>
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

      {/* Change Password section */}
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t('change_password')}</h3>
          <div className="h-px flex-1 bg-outline-variant/20" />
        </div>

        <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-6 space-y-5">
          <div>
            <label className={labelCls}>{t('current_password_label')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              placeholder={t('current_password_placeholder')}
            />
          </div>

          <div>
            <label className={labelCls}>{t('new_password_label')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              placeholder={t('new_password_placeholder')}
            />
          </div>

          <div>
            <label className={labelCls}>{t('confirm_password_label')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder={t('confirm_password_placeholder')}
            />
          </div>

          {passwordMsg && (
            <p
              className={`text-xs ${
                passwordMsg.type === 'success' ? 'text-secondary' : 'text-tertiary'
              }`}
            >
              {passwordMsg.text}
            </p>
          )}

          <div className="pt-1">
            <button
              onClick={handlePasswordChange}
              disabled={changePassword.loading || !currentPassword || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-5 py-2.5 border border-primary/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {changePassword.loading && (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              )}
              {t('change_password_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </main>
    </>
  );
}
