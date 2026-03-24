import { useState, useRef, useEffect } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  dot?: string; // optional Tailwind bg-* class for a colour dot
}

interface Props<T extends string> {
  value: T | '';
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (value: T | '') => void;
  nullable?: boolean;
}

export function Select<T extends string>({
  value,
  options,
  placeholder = '— не указано —',
  onChange,
  nullable = true,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between bg-surface-container-low border rounded-sm py-2.5 px-3 text-sm focus:ring-0 focus:outline-none transition-colors ${open ? 'border-primary' : 'border-outline-variant/25 hover:border-outline-variant/50'}`}
      >
          <span className={`flex items-center gap-2 ${selected ? 'text-on-surface' : 'text-on-surface-variant/30'}`}>
          {selected?.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.dot}`} />}
          {selected ? selected.label : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant/20 rounded-sm shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {nullable && (
            <button
              type="button"
              onClick={() => { onChange('' as T | ''); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-sm text-on-surface-variant/40 hover:bg-surface-container-high transition-colors italic border-b border-outline-variant/10"
            >
              {placeholder}
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${
                opt.value === value
                  ? 'bg-primary/8 text-primary font-medium'
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="flex items-center gap-2">
                {opt.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />}
                {opt.label}
              </span>
              {opt.value === value && (
                <span className="material-symbols-outlined text-[14px] text-primary">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
