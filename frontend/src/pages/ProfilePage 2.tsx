import { useState, useEffect } from 'react';
import { BackLink } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile, useChangePassword } from '@/features/auth/api/queries';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

const inputCls =
  'w-full bg-surface-container border border-outline-variant/20 text-on-surface text-sm rounded-sm py-2.5 px-3 focus:border-primary focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const inputDisabledCls =
  'w-full bg-surface-container-low border border-outline-variant/10 text-on-surface-variant/50 text-sm rounded-sm py-2.5 px-3 cursor-not-allowed';

export default function ProfilePage() {
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
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      }
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err?.message || 'Failed to update profile.',
      });
    }
  };

  const handlePasswordChange = async () => {
    setPasswordMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    try {
      const { data } = await changePassword.mutate(currentPassword, newPassword, confirmPassword);
      if (data?.changePassword) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      }
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err?.message || 'Failed to change password.',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {/* Back link */}
      <div className="mb-6">
        <BackLink to="/campaigns">Campaigns</BackLink>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-10">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: '32px' }}
        >
          person
        </span>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Profile Settings
          </h1>
          <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest mt-0.5">
            Account preferences
          </p>
        </div>
      </div>

      {/* Profile section */}
      <section className="mb-10">
        <h2 className="text-[10px] font-label uppercase tracking-widest text-primary mb-5">
          Profile Information
        </h2>

        <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-6 space-y-5">
          <div>
            <label className={labelCls}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className={inputDisabledCls}
            />
            <p className="text-[10px] text-on-surface-variant/40 mt-1.5 italic">
              Email cannot be changed.
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
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* Change Password section */}
      <section>
        <h2 className="text-[10px] font-label uppercase tracking-widest text-primary mb-5">
          Change Password
        </h2>

        <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-6 space-y-5">
          <div>
            <label className={labelCls}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className={labelCls}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="Confirm new password"
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
              Change Password
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
