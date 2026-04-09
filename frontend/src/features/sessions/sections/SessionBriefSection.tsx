/**
 * SessionBriefSection — public-facing brief field shown to both GM and players.
 *
 * GM gets the inline rich-text editor; players get read-only formatted content
 * (or an empty placeholder if no brief was written).
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, RichContent, SectionPanel } from '@/shared/ui';
import type { Session } from '@/entities/session';

interface Props {
  session: Session;
  isGm: boolean;
  onSaveField: (field: keyof Session, html: string) => void;
}

export function SessionBriefSection({ session, isGm, onSaveField }: Props) {
  const { t } = useTranslation('sessions');

  return (
    <SectionPanel>
      {isGm ? (
        <InlineRichField
          label={t('section_brief')}
          value={session.brief}
          onSave={(html) => onSaveField('brief', html)}
          placeholder={t('placeholder_brief')}
        />
      ) : session.brief ? (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">{t('section_brief')}</h2>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <RichContent value={session.brief} className="prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">{t('section_brief')}</h2>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-xs text-on-surface-variant/40 italic">{t('no_brief')}</p>
        </div>
      )}
    </SectionPanel>
  );
}
