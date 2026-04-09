/**
 * SessionGmNotesSection — private GM-only notes panel for a session.
 *
 * Backed by the per-user `myNote` on the session entity (each user has their
 * own note row). For GMs we render the styled GM notes editor; players get
 * `SessionMyNotesSection` instead. Returns null for non-GM viewers.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { Session } from '@/entities/session';

interface Props {
  session: Session;
  isGm: boolean;
  onSaveNote: (html: string) => void;
}

export function SessionGmNotesSection({ session, isGm, onSaveNote }: Props) {
  const { t } = useTranslation('sessions');
  if (!isGm) return null;

  return (
    <SectionPanel>
      <section>
        <InlineRichField
          label={t('section_gm_notes')}
          value={session.myNote?.content}
          onSave={onSaveNote}
          placeholder={t('placeholder_gm_notes')}
          isGmNotes={true}
        />
      </section>
    </SectionPanel>
  );
}
