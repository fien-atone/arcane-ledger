import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessions, useSaveSession } from '@/features/sessions/api/queries';
import { DatePicker, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import type { Session } from '@/entities/session';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  session?: Session;
}

function parseIso(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: (hh === '00' && min === '00') ? '' : `${hh}:${min}` };
}

function toIso(date: string, time: string): string {
  if (!date) return '';
  const [yyyy, mm, dd] = date.split('-');
  const [hh, min] = (time || '00:00').split(':');
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh) || 0, Number(min) || 0).toISOString();
}

export function SessionEditDrawer({ open, onClose, campaignId, session }: Props) {
  const { t } = useTranslation('sessions');
  const save = useSaveSession(campaignId);
  const { data: allSessions } = useSessions(campaignId);
  const isEdit = !!session;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [number, setNumber] = useState(1);

  useEffect(() => {
    if (!open) return;
    if (session) {
      setTitle(session.title);
      const parsed = parseIso(session.datetime);
      setDate(parsed.date);
      setTime(parsed.time);
      setNumber(session.number);
    } else {
      setTitle('');
      setDate('');
      setTime('');
      const maxNumber = (allSessions ?? []).reduce((max, s) => Math.max(max, s.number), 0);
      setNumber(maxNumber + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = () => {
    const iso = toIso(date, time);
    if (isEdit && session) {
      save.mutate({
        ...session,
        title: title.trim() || session.title,
        datetime: iso,
        number,
      }, { onSuccess: onClose });
    } else {
      save.mutate({
        id: '',
        campaignId,
        title: title.trim() || `Session ${number}`,
        datetime: iso,
        number,
        summary: '',
        createdAt: new Date().toISOString(),
      }, { onSuccess: onClose });
    }
  };

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isEdit ? t('drawer_edit_title') : t('drawer_new_title')}
        subtitle={
          isEdit
            ? t('drawer_edit_subtitle', { number: String(session.number).padStart(2, '0') })
            : t('drawer_new_subtitle', { number: String(number).padStart(2, '0') })
        }
        onClose={onClose}
      />
      <FormDrawer.Body>
          <div>
            <label className={LABEL_CLS}>{t('field_title')} <span className="text-on-surface-variant/30 normal-case tracking-normal">{t('field_title_optional')}</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('placeholder_title', { number })}
              className={INPUT_CLS}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>
                {t('field_date')} <span className="text-on-surface-variant/30 normal-case tracking-normal">{t('field_date_optional')}</span>
              </label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className={LABEL_CLS}>
                {t('field_start_time')} <span className="text-on-surface-variant/30 normal-case tracking-normal">{t('field_start_time_optional')}</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`${INPUT_CLS} h-[42px] [color-scheme:dark]`}
              />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className={LABEL_CLS}>{t('field_session_number')}</label>
              <input
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value) || 1)}
                className={INPUT_CLS}
              />
            </div>
          )}
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        cancelLabel={t('cancel')}
        saveLabel={isEdit ? t('save') : t('create')}
      />
    </FormDrawer>
  );
}
