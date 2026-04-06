import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { D20Icon } from '@/shared/ui';

const DICE = [4, 6, 8, 10, 12, 20, 100] as const;
type Die = typeof DICE[number];

// ── SVG die shapes ────────────────────────────────────────────────────────────

function DieFace({ die, size = 36 }: { die: Die; size?: number }) {
  const s = size;
  const style = { display: 'block' as const };

  switch (die) {
    case 4:
      return (
        <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor">
          <path d="M240.1 56.5L35.4 310.6 240.1 465.9V56.5zm32 409.2L476.6 310.6 272.1 56.7V465.8zM256 0c7.3 0 14.1 3.3 18.7 8.9l232 288c4.1 5.1 5.9 11.5 5.1 18s-4.1 12.3-9.3 16.2l-232 176c-8.6 6.5-20.4 6.5-29 0l-232-176c-5.2-3.9-8.5-9.8-9.3-16.2s1.1-12.9 5.1-18l232-288C241.9 3.3 248.7 0 256 0z" />
        </svg>
      );
    case 6:
      return (
        <svg width={s} height={s} viewBox="0 0 448 512" style={style} fill="currentColor">
          <path d="M220.1 35.6L47.9 136.2l176 101.2L400 133l-172-97.5 11.6-20.4L228.1 35.5c-2.5-1.4-5.5-1.4-8 .1zM32 164V366.6c0 2.9 1.6 5.6 4.1 7L208 469.9V265.3L32 164zM240 469.9l171.9-96.3c2.5-1.4 4.1-4.1 4.1-7V160.8L240 265.1V469.9zM203.9 7.9c12.3-7.2 27.5-7.3 39.9-.3L427.7 112c12.5 7.1 20.3 20.4 20.3 34.8V366.6c0 14.5-7.8 27.8-20.5 34.9l-184 103c-12.1 6.8-26.9 6.8-39.1 0l-184-103C7.8 394.4 0 381.1 0 366.6V150.1c0-14.2 7.5-27.4 19.8-34.5L203.9 7.9z" />
        </svg>
      );
    case 8:
      return (
        <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor">
          <path d="M240 51.3L44.3 247.1l195.7 81V51.3zM72.8 293.5L240 460.7v-98L72.8 293.5zM272 460.7L439.2 293.5 272 362.7v98zM467.8 247.1L272 51.3V328.1l195.8-81zM239 7c9.4-9.4 24.6-9.4 33.9 0L505 239c9.4 9.4 9.4 24.6 0 33.9L273 505c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L239 7z" />
        </svg>
      );
    case 10:
      return (
        <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor">
          <path d="M213.8 84.1L55.6 264.1l92.7-21.8L213.8 84.1zM48.6 298.6L240 463.6V328.6l-83.1-55.4L48.6 298.6zM272 463.6l191.4-165L355.1 273.2 272 328.6V463.6zM456.4 264.1L298.2 84.1l65.4 158.2 92.7 21.8zM256 0c6.9 0 13.5 3 18 8.2l232 264c4.2 4.8 6.4 11.1 5.9 17.5s-3.4 12.3-8.3 16.5l-232 200c-9 7.8-22.3 7.8-31.3 0l-232-200C3.5 302 .5 296 .1 289.7S1.7 277 6 272.2L238 8.2C242.5 3 249.1 0 256 0zm0 300.8L332.2 250 256 65.8 179.8 250 256 300.8z" />
        </svg>
      );
    case 12:
      return (
        <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor">
          <path d="M200.3 32c-2.8 0-5.6 .7-8 2.1L128.7 70.9 256 111.2 383.3 70.9 319.7 34.1c-2.4-1.4-5.2-2.1-8-2.1L200.3 32zM92 92.8c-.8 .9-1.6 1.9-2.2 2.9L34.2 192.2c.6 .5 1.2 1 1.7 1.6l95.8 106.4L240 246.1V139.7L92 92.8zM32 237.3l0 74.4c0 2.8 .7 5.6 2.1 8l55.7 96.5c1.4 2.4 3.4 4.5 5.9 5.9l62.7 36.2-44.5-130L32 237.3zM199.7 480c.2 0 .4 0 .6 0H311.7c.7 0 1.4 0 2.1-.1l50.6-151.8L256 273.9 147.7 328.1l52 151.9zM355 457.5l61.2-35.4c2.4-1.4 4.5-3.4 5.9-5.9l55.7-96.5c1.4-2.4 2.1-5.2 2.1-8V237.3l-81.9 90.9L355 457.5zM477.8 192.2L422.1 95.7c-.6-1.1-1.3-2-2.2-2.9L272 139.7V246.1l108.3 54.1 95.8-106.4c.5-.6 1.1-1.1 1.7-1.6zM176.3 6.4c7.3-4.2 15.6-6.4 24-6.4H311.7c8.4 0 16.7 2.2 24 6.4l96.5 55.7c7.3 4.2 13.4 10.3 17.6 17.6l55.7 96.5c4.2 7.3 6.4 15.6 6.4 24V311.7c0 8.4-2.2 16.7-6.4 24l-55.7 96.5c-4.2 7.3-10.3 13.4-17.6 17.6l-96.5 55.7c-7.3 4.2-15.6 6.4-24 6.4H200.3c-8.4 0-16.7-2.2-24-6.4L79.7 449.8c-7.3-4.2-13.4-10.3-17.6-17.6L6.4 335.7c-4.2-7.3-6.4-15.6-6.4-24V200.3c0-8.4 2.2-16.7 6.4-24L62.2 79.7c4.2-7.3 10.3-13.4 17.6-17.6L176.3 6.4z" />
        </svg>
      );
    case 20:
      return (
        <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor">
          <path d="M217.5 56.4L77.9 140.2l61.4 44.7L217.5 56.4zM64 169.6V320.3l59.2-107.6L64 169.6zM104.8 388L240 469.1V398.8L104.8 388zM272 469.1L407.2 388 272 398.8v70.3zM448 320.3V169.6l-59.2 43L448 320.3zM434.1 140.2L294.5 56.4l78.2 128.4 61.4-44.7zM243.7 3.4c7.6-4.6 17.1-4.6 24.7 0l200 120c7.2 4.3 11.7 12.1 11.7 20.6V368c0 8.4-4.4 16.2-11.7 20.6l-200 120c-7.6 4.6-17.1 4.6-24.7 0l-200-120C36.4 384.2 32 376.4 32 368V144c0-8.4 4.4-16.2 11.7-20.6l200-120zM225.3 365.5L145 239.4 81.9 354l143.3 11.5zM338.9 224H173.1L256 354.2 338.9 224zM256 54.8L172.5 192H339.5L256 54.8zm30.7 310.7L430.1 354 367 239.4 286.7 365.5z" />
        </svg>
      );
    case 100:
      // d100 uses the same die shape as d10 (same physical percentile die)
      return (
        <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor">
          <path d="M213.8 84.1L55.6 264.1l92.7-21.8L213.8 84.1zM48.6 298.6L240 463.6V328.6l-83.1-55.4L48.6 298.6zM272 463.6l191.4-165L355.1 273.2 272 328.6V463.6zM456.4 264.1L298.2 84.1l65.4 158.2 92.7 21.8zM256 0c6.9 0 13.5 3 18 8.2l232 264c4.2 4.8 6.4 11.1 5.9 17.5s-3.4 12.3-8.3 16.5l-232 200c-9 7.8-22.3 7.8-31.3 0l-232-200C3.5 302 .5 296 .1 289.7S1.7 277 6 272.2L238 8.2C242.5 3 249.1 0 256 0zm0 300.8L332.2 250 256 65.8 179.8 250 256 300.8z" />
        </svg>
      );
    default:
      return <svg width={s} height={s} viewBox="0 0 512 512" style={style} fill="currentColor"><circle cx="256" cy="256" r="240" /></svg>;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DieGroup {
  die: Die;
  rolls: number[];
}

interface RollEntry {
  id: string;
  groups: DieGroup[];
  modifier: number;
  total: number;
  ts: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function formatModifier(mod: number): string {
  if (mod === 0) return '';
  return mod > 0 ? `+${mod}` : `${mod}`;
}


function isSingleD20(entry: RollEntry, value: number): boolean {
  return entry.groups.length === 1 && entry.groups[0].die === 20 && entry.groups[0].rolls.length === 1 && entry.groups[0].rolls[0] === value;
}
function isNatural20(entry: RollEntry) { return isSingleD20(entry, 20); }
function isNatural1(entry: RollEntry)  { return isSingleD20(entry, 1);  }

function entryFormula(entry: RollEntry): string {
  const parts = entry.groups.map((g) => `${g.rolls.length}d${g.die}`);
  if (entry.modifier !== 0) parts.push(formatModifier(entry.modifier));
  return parts.join(' + ');
}

// ── Die button colours ────────────────────────────────────────────────────────

const DIE_COLORS: Record<Die, string> = {
  4:   'text-amber-400',
  6:   'text-sky-400',
  8:   'text-violet-400',
  10:  'text-emerald-400',
  12:  'text-rose-400',
  20:  'text-primary',
  100: 'text-orange-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DiceRoller() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [pool, setPool] = useState<Partial<Record<Die, number>>>({});
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState<RollEntry[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const historyScrollRef = useRef<HTMLDivElement>(null);

  const addDie = (die: Die) => setPool((p) => ({ ...p, [die]: (p[die] ?? 0) + 1 }));
  const removeDie = (die: Die) =>
    setPool((p) => {
      const next = { ...p, [die]: (p[die] ?? 1) - 1 };
      if (next[die] === 0) delete next[die];
      return next;
    });
  const clearPool = () => setPool({});

  const poolEmpty = Object.keys(pool).length === 0;

  const handleRoll = useCallback(() => {
    if (poolEmpty) return;
    const groups: DieGroup[] = DICE.filter((d) => (pool[d] ?? 0) > 0).map((d) => ({
      die: d,
      rolls: Array.from({ length: pool[d]! }, () => rollDie(d)),
    }));
    const sum = groups.reduce((acc, g) => acc + g.rolls.reduce((a, b) => a + b, 0), 0);
    const total = sum + modifier;
    const entry: RollEntry = {
      id: `${Date.now()}-${Math.random()}`,
      groups,
      modifier,
      total,
      ts: Date.now(),
    };
    setAnimKey((k) => k + 1);
    setExpandedIds((prev) => new Set([...prev, entry.id]));
    setHistory((prev) => [entry, ...prev].slice(0, 50));
  }, [pool, modifier, poolEmpty]);

  // Scroll history to bottom whenever a new entry is added
  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
  }, [history.length]);

  // Crit / fumble only for single d20 roll

  return (
    <>
      {/* FAB — hidden when panel open */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title={t('dice_roller.title')}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-xl shadow-primary/25 flex items-center justify-center active:scale-95 transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 transition-transform duration-700 group-hover:rotate-[360deg]">
            <DieFace die={20} size={32} />
          </div>
        </button>
      )}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      {/* Panel */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-50 w-[340px] flex flex-col bg-surface-container-low border-l border-outline-variant/10 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <D20Icon className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-base font-bold text-on-surface">{t('dice_roller.title')}</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── SECTION 1: History ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Title bar */}
          <div className="px-4 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/30 font-bold">{t('dice_roller.history')}</span>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="text-[9px] uppercase tracking-widest text-on-surface-variant/20 hover:text-on-surface-variant/60 transition-colors cursor-pointer"
              >
                {t('dice_roller.clear')}
              </button>
            )}
          </div>

          {/* Scrollable entries — mt-auto pushes entries to bottom, custom scrollbar */}
          <div
            ref={historyScrollRef}
            className="flex-1 overflow-y-auto flex flex-col min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/30 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {history.length === 0 ? (
              <p className="m-auto text-center text-on-surface-variant/20 text-xs italic">{t('dice_roller.no_rolls_yet')}</p>
            ) : (
              <div className="mt-auto px-4 pb-3 space-y-1.5">
                {[...history].reverse().map((entry, i, arr) => {
                  const isLatest = i === arr.length - 1;
                  const isExpanded = expandedIds.has(entry.id);
                  const entryCrit = isNatural20(entry);
                  const entryFumble = isNatural1(entry);
                  return (
                    <div
                      key={entry.id}
                      onClick={() => setExpandedIds((prev) => { const next = new Set(prev); isExpanded ? next.delete(entry.id) : next.add(entry.id); return next; })}
                      className={`rounded-sm border px-3 cursor-pointer transition-all ${
                        isLatest
                          ? `py-3 border-outline-variant/30 bg-surface-container ${entryCrit ? 'border-l-2 border-l-secondary' : entryFumble ? 'border-l-2 border-l-primary/40' : ''}`
                          : 'py-2 border-outline-variant/10 bg-surface-container-lowest opacity-40 hover:opacity-70'
                      }`}
                    >
                      {/* Always visible: formula + total */}
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] text-on-surface-variant font-medium">{entryFormula(entry)}</span>
                        <span key={isLatest ? animKey : entry.id} className={`font-headline font-bold flex-shrink-0 leading-none ${
                          isLatest
                            ? entryCrit ? 'text-secondary text-4xl' : entryFumble ? 'text-primary/50 text-4xl' : 'text-on-surface text-4xl'
                            : 'text-on-surface/60 text-xl'
                        }`}>
                          {entry.total}
                        </span>
                      </div>
                      {entryCrit && <p className="text-[9px] font-bold uppercase tracking-widest text-secondary mt-1">★ {t('dice_roller.critical_hit')}</p>}
                      {entryFumble && <p className="text-[9px] font-bold uppercase tracking-widest text-red-400 mt-1">{t('dice_roller.critical_fail')}</p>}

                      {/* Breakdown — only when expanded, one row per die type */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-outline-variant/10 space-y-1.5">
                          {entry.groups.map((g) => (
                            <div key={g.die} className="flex items-center gap-2">
                              <div className={`flex-shrink-0 ${DIE_COLORS[g.die]}`}>
                                <DieFace die={g.die} size={14} />
                              </div>
                              <span className={`text-[10px] font-bold uppercase ${DIE_COLORS[g.die]} w-8 flex-shrink-0`}>d{g.die}</span>
                              <div className="flex gap-1 flex-wrap">
                                {g.rolls.map((v, ri) => (
                                  <span key={ri} className={`text-[11px] font-headline font-bold px-1.5 py-0.5 rounded-sm bg-current/10 ${DIE_COLORS[g.die]}`}>
                                    {v}
                                  </span>
                                ))}
                              </div>
                              {g.rolls.length > 1 && (
                                <span className="ml-auto text-[10px] text-on-surface-variant/40 flex-shrink-0">
                                  = {g.rolls.reduce((a, b) => a + b, 0)}
                                </span>
                              )}
                            </div>
                          ))}
                          {entry.modifier !== 0 && (
                            <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/10">
                              <span className="text-[10px] text-on-surface-variant/40 uppercase tracking-wider">{t('dice_roller.modifier')}</span>
                              <span className="text-[11px] font-headline font-bold text-on-surface-variant/60">{formatModifier(entry.modifier)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Roll block ───────────────────────────────────────── */}
        <div className="flex-shrink-0 flex flex-col border-t-2 border-outline-variant/20 bg-surface-container">

          {/* Die picker — top of roll block */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/30 mb-2">
              {t('dice_roller.click_to_add')}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {DICE.map((d) => {
                const count = pool[d] ?? 0;
                const color = DIE_COLORS[d];
                return (
                  <button
                    key={d}
                    onClick={() => addDie(d)}
                    onContextMenu={(e) => { e.preventDefault(); if (count > 0) removeDie(d); }}
                    title={`d${d}`}
                    className="relative flex flex-col items-center gap-1 group py-1 cursor-pointer"
                  >
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center leading-none">
                        {count}
                      </span>
                    )}
                    <div className={`transition-all duration-150 ${
                      count > 0 ? color : 'text-on-surface-variant/25 group-hover:text-on-surface-variant/60'
                    } ${count > 0 ? 'scale-110' : 'group-hover:scale-105'}`}>
                      <DieFace die={d} size={34} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wide transition-colors ${
                      count > 0 ? 'text-on-surface' : 'text-on-surface-variant/30 group-hover:text-on-surface-variant/60'
                    }`}>
                      d{d}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-outline-variant/15" />

          {/* Pool chips + modifier + roll — bottom of roll block */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Pool chips */}
            <div className="min-h-[24px] flex items-center gap-1.5 flex-wrap">
              {poolEmpty ? (
                <span className="text-[11px] text-on-surface-variant/25 italic">{t('dice_roller.no_dice_selected')}</span>
              ) : (
                <>
                  {DICE.filter((d) => (pool[d] ?? 0) > 0).map((d, i) => (
                    <span key={d} className="flex items-center gap-0.5">
                      {i > 0 && <span className="text-on-surface-variant/30 text-xs mx-0.5">+</span>}
                      <button
                        onClick={() => removeDie(d)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all hover:opacity-70 cursor-pointer ${DIE_COLORS[d]} border-current/30 bg-current/5`}
                      >
                        {pool[d]}d{d}
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearPool}
                    className="ml-auto text-[10px] text-on-surface-variant/30 hover:text-on-surface-variant transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    {t('dice_roller.clear')}
                  </button>
                </>
              )}
            </div>

            {/* Modifier + Roll button */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 flex-shrink-0">{t('dice_roller.modifier')}</span>
              <button onClick={() => setModifier((m) => m - 1)} className="w-7 h-7 rounded-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer">
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="w-8 text-center font-headline font-bold text-on-surface text-sm flex-shrink-0">
                {modifier >= 0 ? `+${modifier}` : modifier}
              </span>
              <button onClick={() => setModifier((m) => m + 1)} className="w-7 h-7 rounded-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
              {modifier !== 0 && (
                <button onClick={() => setModifier(0)} className="text-[10px] text-on-surface-variant/30 hover:text-on-surface-variant transition-colors flex-shrink-0 cursor-pointer">
                  {t('common:reset')}
                </button>
              )}
              <button
                onClick={handleRoll}
                disabled={poolEmpty}
                className="ml-auto flex-1 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-label text-[10px] uppercase tracking-widest rounded-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                <D20Icon className="w-3.5 h-3.5" />
                {t('dice_roller.roll')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
