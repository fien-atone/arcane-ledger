/**
 * SessionMyNotesSection — per-user private notes panel for a session,
 * shown to non-GM viewers (players).
 *
 * Visually distinct from the GM notes (teal "private" pill + edit_note icon)
 * to make it obvious that only the current user can see this content.
 * Returns null for the GM, who uses `SessionGmNotesSection` instead.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
import type { Session } from '@/entities/session';

interface Props {
  session: Session;
  isGm: boolean;
  onSaveNote: (html: string) => void;
}

export function SessionMyNotesSection({ session, isGm, onSaveNote }: Props) {
  const { t } = useTranslation('sessions');
  if (isGm) return null;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <section className="bg-surface-container-low/50 p-4 border border-secondary/15 rounded-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-secondary text-sm">edit_note</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">{t('section_my_notes')}</h3>
          <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/30 border border-outline-variant/15 px-1.5 py-0.5 rounded-full">{t('notes_private')}</span>
        </div>
        <InlineRichField
          label=""
          value={session.myNote?.content}
          onSave={onSaveNote}
          placeholder={t('placeholder_player_notes')}
          isGmNotes={false}
        />
      </section>
    </div>
  );
}
