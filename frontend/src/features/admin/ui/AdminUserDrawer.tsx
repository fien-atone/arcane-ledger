import { useEffect, useState } from 'react';
import { useCreateUser, useUpdateUser } from '@/features/admin/api/queries';
import { Select } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { User } from '@/entities/user';

interface Props {
  open: boolean;
  onClose: () => void;
  user?: User;
}

const ROLE_OPTIONS: SelectOption<string>[] = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
];

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

export function AdminUserDrawer({ open, onClose, user }: Props) {
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
              {isEdit ? 'Edit User' : 'Create User'}
            </h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {isEdit ? user.name : 'Add a new user to the system'}
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
            <label className={labelCls}>
              Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name..."
              className={inputCls}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>
              Email <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelCls}>
              Password {!isEdit && <span className="text-primary">*</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Leave empty to keep current' : 'Enter password...'}
              autoComplete="new-password"
              className={inputCls}
            />
          </div>

          {/* Role */}
          <div>
            <label className={labelCls}>Role</label>
            <Select
              value={role}
              options={ROLE_OPTIONS}
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
            Cancel
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
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </>
  );
}
