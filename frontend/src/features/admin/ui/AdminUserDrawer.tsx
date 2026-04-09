import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateUser, useUpdateUser } from '@/features/admin/api/queries';
import { Select, LABEL_CLS, INPUT_CLS } from '@/shared/ui';
import type { User } from '@/entities/user';

interface Props {
  open: boolean;
  onClose: () => void;
  user?: User;
}

const ROLE_KEYS: { value: string; labelKey: string }[] = [
  { value: 'USER', labelKey: 'roles.user' },
  { value: 'ADMIN', labelKey: 'roles.admin' },
];

export function AdminUserDrawer({ open, onClose, user }: Props) {
  const { t } = useTranslation('admin');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEdit = !!user;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  useEffect(() => {
    if (!open) return;
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPassword('');
      setRole(user.role?.toUpperCase() || 'USER');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('USER');
    }
  }, [open, user]);

  const canSave = isEdit
    ? name.trim() && email.trim()
    : name.trim() && email.trim() && password.trim();

  const isPending = createUser.isPending || updateUser.isPending;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      if (isEdit) {
        const input: Record<string, string> = {
          name: name.trim(),
          email: email.trim(),
          role,
        };
        if (password.trim()) input.password = password.trim();
        await updateUser.mutate(user.id, input);
      } else {
        await createUser.mutate({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        });
      }
      onClose();
    } catch {
      // mutation error handled by Apollo
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isEdit ? t('edit_user_title') : t('create_user_title')}
            </h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {isEdit ? user.name : t('add_user_subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {/* Name */}
          <div>
            <label className={LABEL_CLS}>
              {t('form.name_label')} <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('form.name_placeholder')}
              className={INPUT_CLS}
            />
          </div>

          {/* Email */}
          <div>
            <label className={LABEL_CLS}>
              {t('form.email_label')} <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('form.email_placeholder')}
              className={INPUT_CLS}
            />
          </div>

          {/* Password */}
          <div>
            <label className={LABEL_CLS}>
              {t('form.password_label')} {!isEdit && <span className="text-primary">*</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? t('form.password_placeholder_edit') : t('form.password_placeholder_create')}
              autoComplete="new-password"
              className={INPUT_CLS}
            />
          </div>

          {/* Role */}
          <div>
            <label className={LABEL_CLS}>{t('form.role_label')}</label>
            <Select
              value={role}
              options={ROLE_KEYS.map((r) => ({ value: r.value, label: t(r.labelKey) }))}
              nullable={false}
              onChange={(v) => setRole(v || 'USER')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {isEdit ? t('save_changes') : t('create_user')}
          </button>
        </div>
      </div>
    </>
  );
}
