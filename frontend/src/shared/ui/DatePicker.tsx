import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** 0=Mon … 6=Sun */
function startDay(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date…', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Calendar state
  const today = new Date();
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const days = daysInMonth(viewYear, viewMonth);
  const offset = startDay(viewYear, viewMonth);
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-[42px] flex items-center gap-2.5 bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm px-3 text-sm focus:ring-0 focus:outline-none transition-colors text-left"
      >
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">calendar_today</span>
        {value ? (
          <span className="text-on-surface">{formatDisplay(value)}</span>
        ) : (
          <span className="text-on-surface-variant/30">{placeholder}</span>
        )}
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="ml-auto p-0.5 text-on-surface-variant/30 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-surface-container border border-outline-variant/20 rounded-sm shadow-xl p-4 space-y-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={prevMonth}
              className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors rounded-sm hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="text-xs font-label font-bold uppercase tracking-widest text-on-surface">{monthLabel}</span>
            <button type="button" onClick={nextMonth}
              className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors rounded-sm hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((wd, i) => (
              <div key={wd} className={`text-center text-[9px] font-bold uppercase tracking-wider py-1 ${
                i >= 5 ? 'text-primary/50' : 'text-on-surface-variant/40'
              }`}>
                {wd}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells before the 1st */}
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const iso = toIsoDate(viewYear, viewMonth, day);
              const isSelected = iso === value;
              const isToday = iso === todayIso;
              const dayOfWeek = (offset + i) % 7; // 0=Mon … 6=Sun
              const isWeekend = dayOfWeek >= 5;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-8 flex items-center justify-center rounded-sm text-xs transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary font-bold'
                      : isToday
                      ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                      : isWeekend
                      ? 'text-primary/60 hover:bg-surface-container-high'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="flex justify-center pt-1 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={() => { onChange(todayIso); setOpen(false); }}
              className="text-[10px] font-label uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
