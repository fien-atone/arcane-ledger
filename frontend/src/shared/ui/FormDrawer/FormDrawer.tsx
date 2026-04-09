/**
 * FormDrawer — the right-side overlay form drawer used for creating and
 * editing entities across the app (NPCs, Locations, Sessions, etc.).
 *
 * Compound component. No field config, no generic, no form-state management.
 * Callers keep their own useState for fields and pass JSX into <FormDrawer.Body>.
 *
 *   <FormDrawer open={open} onClose={onClose}>
 *     <FormDrawer.Header title={t('edit_npc')} onClose={onClose} />
 *     <FormDrawer.Body> {fields} </FormDrawer.Body>
 *     <FormDrawer.Footer onCancel={onClose} onSave={handleSave} saving={save.isPending} />
 *   </FormDrawer>
 *
 * The `elevated` variant bumps the z-index to z-[110]/z-[120] so the drawer
 * renders above z-[100] full-screen overlays (currently only MapViewer).
 *
 * When `open` is false the component renders nothing — there's no enter/exit
 * animation (matches the existing dominant behavior).
 */
import type { ReactNode } from 'react';
import { FormDrawerHeader } from './FormDrawerHeader';
import { FormDrawerBody } from './FormDrawerBody';
import { FormDrawerFooter } from './FormDrawerFooter';

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  elevated?: boolean;
  children: ReactNode;
}

function FormDrawerBase({ open, onClose, elevated, children }: FormDrawerProps) {
  if (!open) return null;

  const backdropZ = elevated ? 'z-[110]' : 'z-60';
  const panelZ = elevated ? 'z-[120]' : 'z-70';

  return (
    <>
      <div
        className={`fixed inset-0 ${backdropZ} bg-black/50 backdrop-blur-sm`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 ${panelZ} w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20`}
      >
        {children}
      </div>
    </>
  );
}

export const FormDrawer = Object.assign(FormDrawerBase, {
  Header: FormDrawerHeader,
  Body: FormDrawerBody,
  Footer: FormDrawerFooter,
});
