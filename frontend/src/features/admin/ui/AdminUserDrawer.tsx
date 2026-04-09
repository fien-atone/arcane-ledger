import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateUser, useUpdateUser } from '@/features/admin/api/queries';
import { Select, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
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

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isEdit ? t('edit_user_title') : t('create_user_title')}
        subtitle={isEdit ? user.name : t('add_user_subtitle')}
        onClose={onClose}
      />
      <FormDrawer.Body>
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
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={isPending}
        saveDisabled={!canSave}
        cancelLabel={t('cancel')}
        saveLabel={isEdit ? t('save_changes') : t('create_user')}
      />
    </FormDrawer>
  );
}
