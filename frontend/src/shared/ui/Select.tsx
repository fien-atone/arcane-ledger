import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  dot?: string;       // optional Tailwind bg-* class for a colour dot
  icon?: string;      // optional Material Symbol name
  iconColor?: string; // optional Tailwind text-* class for the icon colour
  group?: string;     // optional group label for section headers
}

interface Props<T extends string> {
  value: T | '';
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (value: T | '') => void;
  nullable?: boolean;
  searchable?: boolean;
}

export function Select<T extends string>({
  value,
  options,
  placeholder = '— не указано —',
  onChange,
  nullable = true,
  searchable = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen((v) => {
      if (!v) setSearch('');
      return !v;
    });
  }, []);

  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open, searchable]);

  const selected = options.find((o) => o.value === value);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // Build grouped structure only when at least one option has a group
  const grouped = useMemo(() => {
    const hasGroups = filteredOptions.some((o) => o.group);
    if (!hasGroups) return null;
    const map = new Map<string, SelectOption<T>[]>();
    for (const opt of filteredOptions) {
      const g = opt.group ?? '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(opt);
    }
    return map;
  }, [filteredOptions]);

  const renderOption = (opt: SelectOption<T>) => (
    <button
      key={opt.value}
      type="button"
      onClick={() => { onChange(opt.value); setOpen(false); }}
      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
        opt.value === value
          ? 'bg-primary/8 text-primary font-medium'
          : 'text-on-surface hover:bg-surface-container-high'
      }`}
    >
      <span className="flex items-center gap-2">
        {opt.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />}
        {opt.icon && (
          <span className={`material-symbols-outlined text-[14px] flex-shrink-0 ${
            opt.value === value ? 'text-primary' : (opt.iconColor ?? 'text-on-surface-variant/50')
          }`}>
            {opt.icon}
          </span>
        )}
        {opt.label}
      </span>
      {opt.value === value && (
        <span className="material-symbols-outlined text-[14px] text-primary">check</span>
      )}
    </button>
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between bg-surface-container-low border rounded-sm py-2.5 px-3 text-sm focus:ring-0 focus:outline-none transition-colors ${open ? 'border-primary' : 'border-outline-variant/25 hover:border-outline-variant/50'}`}
      >
        <span className={`flex items-center gap-2 ${selected ? 'text-on-surface' : 'text-on-surface-variant/30'}`}>
          {selected?.dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected.dot}`} />}
          {selected?.icon && (
            <span className={`material-symbols-outlined text-[14px] flex-shrink-0 ${selected.iconColor ?? 'text-on-surface-variant/60'}`}>
              {selected.icon}
            </span>
          )}
          {selected ? selected.label : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-[16px] text-on-surface-variant/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface-container border border-outline-variant/20 rounded-sm shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {searchable && (
            <div className="px-2 py-2 border-b border-outline-variant/10 sticky top-0 bg-surface-container z-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[14px] text-on-surface-variant/40">search</span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-7 pr-2 py-1.5 bg-surface-container-low border border-outline-variant/20 focus:border-primary rounded-sm text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none transition-colors"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          {nullable && (
            <button
              type="button"
              onClick={() => { onChange('' as T | ''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-on-surface-variant/40 hover:bg-surface-container-high transition-colors italic border-b border-outline-variant/10"
            >
              {placeholder}
            </button>
          )}
          {grouped
            ? [...grouped.entries()].map(([groupLabel, groupOptions], gi) => (
                <div key={groupLabel || gi}>
                  {groupLabel && (
                    <div className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/40 border-b border-outline-variant/8">
                      {groupLabel}
                    </div>
                  )}
                  {groupOptions.map(renderOption)}
                </div>
              ))
            : filteredOptions.map(renderOption)}
        </div>
      )}
    </div>
  );
}
