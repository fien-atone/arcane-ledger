import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VisibilityFieldDef } from '@/shared/lib/visibilityFields';

interface VisibilityPanelProps {
  playerVisible: boolean;
  playerVisibleFields: string[];
  fields: VisibilityFieldDef[];
  basicPreset: string[];
  /** Extra always-visible field labels (besides Name) */
  autoVisibleLabels?: string[];
  onToggleVisible: (visible: boolean) => void;
  onToggleField: (field: string, checked: boolean) => void;
  onSetPreset: (fields: string[]) => void;
  isPending?: boolean;
}

export function VisibilityPanel({
  playerVisible,
  playerVisibleFields,
  fields,
  basicPreset,
  autoVisibleLabels,
  onToggleVisible,
  onToggleField,
  onSetPreset,
  isPending,
}: VisibilityPanelProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const visibleSet = new Set(playerVisibleFields ?? []);

  return (
    <section className="border border-outline-variant/20 rounded-sm bg-surface-container-low/50">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container/50 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">
          {playerVisible ? 'visibility' : 'visibility_off'}
        </span>
        <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant flex-1 text-left">
          {t('player_visibility')}
        </span>
        {playerVisible && (
          <span className="text-[9px] text-secondary font-bold uppercase tracking-wider">
            {t('shared')}
          </span>
        )}
        <span className={`material-symbols-outlined text-[14px] text-on-surface-variant/40 transition-transform ${collapsed ? '' : 'rotate-180'}`}>
          expand_more
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/10">
          {/* Main toggle */}
          <label className="flex items-center gap-3 pt-3 cursor-pointer group">
            <button
              type="button"
              role="switch"
              aria-checked={playerVisible}
              onClick={() => onToggleVisible(!playerVisible)}
              disabled={isPending}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border transition-colors duration-200 ${
                playerVisible
                  ? 'bg-secondary border-secondary/50'
                  : 'bg-surface-container-highest border-outline-variant/30'
              } ${isPending ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-on-surface shadow-sm transform transition-transform duration-200 mt-[2px] ${
                  playerVisible ? 'translate-x-[17px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
            <span className="text-xs text-on-surface group-hover:text-primary transition-colors">
              {t('visible_to_players')}
            </span>
          </label>

          {/* Field controls (only when entity is visible) */}
          {playerVisible && (
            <>
              {/* Name — always visible indicator */}
              <div className="flex items-center gap-2.5 py-1 opacity-50">
                <span className="inline-flex h-3.5 w-6.5 flex-shrink-0 rounded-full bg-secondary/70 border border-secondary/40 items-center justify-end pr-[2px]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-on-surface shadow-sm" />
                </span>
                <span className="text-xs text-on-surface">{t('name')}</span>
                <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-wider">{t('always')}</span>
              </div>

              {/* Extra auto-visible fields */}
              {(autoVisibleLabels ?? []).map((label) => (
                <div key={label} className="flex items-center gap-2.5 py-1 opacity-50">
                  <span className="inline-flex h-3.5 w-6.5 flex-shrink-0 rounded-full bg-secondary/70 border border-secondary/40 items-center justify-end pr-[2px]">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-on-surface shadow-sm" />
                  </span>
                  <span className="text-xs text-on-surface">{label}</span>
                  <span className="text-[8px] text-on-surface-variant/40 uppercase tracking-wider">{t('always')}</span>
                </div>
              ))}

              {/* GM Notes — never visible indicator */}
              <div className="flex items-center gap-2.5 py-1 opacity-50">
                <span className="inline-flex h-3.5 w-6.5 flex-shrink-0 rounded-full bg-surface-container-highest border border-outline-variant/20 items-center pl-[2px]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-on-surface-variant/50 shadow-sm" />
                </span>
                <span className="text-xs text-on-surface-variant/40">{t('gm_notes')}</span>
                <span className="text-[8px] text-on-surface-variant/30 uppercase tracking-wider">{t('gm_only')}</span>
              </div>

              {/* Preset buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSetPreset(fields.map((f) => f.key))}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container border border-outline-variant/20 rounded-sm hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-40"
                >
                  {t('all')}
                </button>
                <button
                  type="button"
                  onClick={() => onSetPreset(basicPreset)}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container border border-outline-variant/20 rounded-sm hover:text-secondary hover:border-secondary/30 transition-colors disabled:opacity-40"
                >
                  {t('basic')}
                </button>
                <button
                  type="button"
                  onClick={() => onSetPreset([])}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container border border-outline-variant/20 rounded-sm hover:text-error hover:border-error/30 transition-colors disabled:opacity-40"
                >
                  {t('none')}
                </button>
              </div>

              {/* Field checklist */}
              <div className="space-y-1">
                {fields.map((field) => {
                  const checked = visibleSet.has(field.key);
                  return (
                    <label
                      key={field.key}
                      className="flex items-center gap-2.5 py-1 cursor-pointer group/field"
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={checked}
                        onClick={() => onToggleField(field.key, !checked)}
                        disabled={isPending}
                        className={`relative inline-flex h-3.5 w-6.5 flex-shrink-0 rounded-full border transition-colors duration-150 ${
                          checked
                            ? 'bg-secondary/70 border-secondary/40'
                            : 'bg-surface-container-highest border-outline-variant/20'
                        } ${isPending ? 'opacity-40' : ''}`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full shadow-sm transform transition-transform duration-150 mt-[1px] ${
                            checked
                              ? 'translate-x-[12px] bg-on-surface'
                              : 'translate-x-[2px] bg-on-surface-variant/50'
                          }`}
                        />
                      </button>
                      <span className={`text-xs transition-colors ${
                        checked
                          ? 'text-on-surface'
                          : 'text-on-surface-variant/40 group-hover/field:text-on-surface-variant/70'
                      }`}>
                        {t(field.labelKey)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
