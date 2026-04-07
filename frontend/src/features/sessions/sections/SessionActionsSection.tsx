/**
 * SessionActionsSection — top-right cluster on the hero card.
 *
 * - Add to calendar dropdown (Google + .ics download), shown to anyone if
 *   the session has a datetime.
 * - GM-only edit + inline-confirm delete buttons.
 *
 * Pure UI: receives the session entity and parent-supplied edit/delete
 * handlers. The page owns the edit drawer; this section only flips its open
 * state via `onEdit`.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@/entities/session';

interface Props {
  session: Session;
  isGm: boolean;
  campaignTitle: string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

function toGoogleCalUrl(title: string, datetime: string, description?: string): string {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(description ? { details: description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function generateIcs(title: string, datetime: string, description?: string): string {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arcane Ledger//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    ...(description ? [`DESCRIPTION:${description.replace(/\n/g, '\\n')}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function downloadIcs(title: string, datetime: string, description?: string) {
  const ics = generateIcs(title, datetime, description);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SessionActionsSection({ session, isGm, campaignTitle, onEdit, onDelete }: Props) {
  const { t } = useTranslation('sessions');
  const [calMenuOpen, setCalMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const calTitle = `${campaignTitle ? campaignTitle + ' — ' : ''}Session #${session.number}`;

  return (
    <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
      {/* Add to Calendar */}
      {session.datetime && (
        <div className="relative">
          <button
            onClick={() => setCalMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-on-surface-variant text-xs font-label uppercase tracking-widest rounded-sm hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
            {t('calendar')}
          </button>
          {calMenuOpen && (
            <div className="absolute z-50 top-full mt-1 right-0 w-48 bg-surface-container border border-outline-variant/20 rounded-sm shadow-xl py-1">
              <a
                href={toGoogleCalUrl(calTitle, session.datetime, session.brief)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCalMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-high transition-colors text-xs text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">event</span>
                {t('calendar_google')}
              </a>
              <button
                onClick={() => { downloadIcs(calTitle, session.datetime, session.brief); setCalMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-high transition-colors text-xs text-on-surface text-left"
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">download</span>
                {t('calendar_ics')}
              </button>
            </div>
          )}
        </div>
      )}
      {isGm && (
        <>
          {confirmDelete ? (
            <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
              <span className="text-[9px] text-on-surface-variant">{t('confirm_delete')}</span>
              <button
                onClick={onDelete}
                className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
              >
                {t('confirm_yes')}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {t('confirm_no')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            {t('edit')}
          </button>
        </>
      )}
    </div>
  );
}
