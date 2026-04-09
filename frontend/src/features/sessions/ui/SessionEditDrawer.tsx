import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessions, useSaveSession } from '@/features/sessions/api/queries';
import { DatePicker, LABEL_CLS, INPUT_CLS } from '@/shared/ui';
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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {isEdit ? t('drawer_edit_title') : t('drawer_new_title')}
            </h2>
            {isEdit && (
              <p className="text-xs text-on-surface-variant/50 mt-0.5">
                {t('drawer_edit_subtitle', { number: String(session.number).padStart(2, '0') })}
              </p>
            )}
            {!isEdit && (
              <p className="text-xs text-on-surface-variant/50 mt-0.5">
                {t('drawer_new_subtitle', { number: String(number).padStart(2, '0') })}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:border-primary/50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isEdit ? t('save') : t('create')}
          </button>
        </div>
      </div>
    </>
  );
}
