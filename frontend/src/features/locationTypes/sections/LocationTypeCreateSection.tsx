/**
 * LocationTypeCreateSection — right column when the user clicked "Add type".
 *
 * Form for creating a new LocationTypeEntry. Owns its own save mutation and
 * its own local form state. Reports cancel + success back to the parent so
 * the page can swap the right panel back to the detail view.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/shared/ui';
import { useSaveLocationType } from '@/features/locationTypes';
import { CATEGORY_ICON_COLOR, CATEGORY_DOT_CLS } from '@/entities/locationType';
import type { LocationTypeCategory } from '@/entities/locationType';

const inputCls =
  'w-full bg-surface-container border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const ICON_SUGGESTIONS = [
  'place', 'public', 'terrain', 'forest', 'landscape', 'water', 'waves', 'stream', 'grass', 'map',
  'apartment', 'location_city', 'cottage', 'holiday_village', 'domain', 'house', 'home', 'villa',
  'skull', 'route', 'merge', 'water_full', 'account_balance', 'warehouse', 'store', 'museum',
  'hub', 'explore', 'anchor', 'flag', 'business', 'park', 'agriculture', 'beach_access',
  'sailing', 'hiking', 'temple_buddhist', 'church', 'monument', 'school',
  'local_fire_department', 'local_hospital', 'fence', 'spa', 'door_front',
];

interface Props {
  campaignId: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
}

export function LocationTypeCreateSection({ campaignId, onCreated, onCancel }: Props) {
  const { t } = useTranslation('locations');
  const saveType = useSaveLocationType(campaignId);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('place');
  const [cat, setCat] = useState<LocationTypeCategory>('geographic');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const labelCls =
    'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

  const CATEGORIES: { value: LocationTypeCategory; label: string; dot: string }[] = [
    { value: 'world',        label: t('category_world'),        dot: CATEGORY_DOT_CLS.world },
    { value: 'civilization', label: t('category_civilization'), dot: CATEGORY_DOT_CLS.civilization },
    { value: 'geographic',   label: t('category_geographic'),   dot: CATEGORY_DOT_CLS.geographic },
    { value: 'water',        label: t('category_water'),        dot: CATEGORY_DOT_CLS.water },
    { value: 'poi',          label: t('category_poi'),          dot: CATEGORY_DOT_CLS.poi },
    { value: 'travel',       label: t('category_travel'),       dot: CATEGORY_DOT_CLS.travel },
  ];

  const handleCreate = () => {
    if (!name.trim()) return;
    saveType.mutate(
      {
        id: '',
        name: name.trim(),
        icon,
        category: cat,
        biomeOptions: [],
        isSettlement: false,
        createdAt: new Date().toISOString(),
      },
      { onSuccess: () => onCreated('') },
    );
  };

  const filteredIcons = iconSearch.trim()
    ? ICON_SUGGESTIONS.filter((ic) => ic.includes(iconSearch.toLowerCase().replace(/\s+/g, '_')))
    : ICON_SUGGESTIONS;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-3.5 border-b border-outline-variant/10">
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:border-outline-variant/40 transition-colors">
          {t('types_cancel')}
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || saveType.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[13px]">add</span>
          {t('types_create_type')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">

        {/* Icon + Name */}
        <div>
          <label className={labelCls}>{t('types_field_name')}</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowIconPicker((p) => !p); setIconSearch(''); }}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm border transition-colors ${
                showIconPicker
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-outline-variant/25 bg-surface-container hover:border-primary/30'
              }`}
              title={t('types_field_icon')}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${CATEGORY_ICON_COLOR[cat]}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icon}
              </span>
            </button>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('type_name_placeholder')}
              className={`${inputCls} flex-1`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          {showIconPicker && (
            <div className="mt-2 p-3 bg-surface-container rounded-sm border border-outline-variant/20 space-y-2">
              <input
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder={t('types_search_icons')}
                className="w-full bg-surface-container-low border-0 border-b border-outline-variant/20 focus:border-primary py-1.5 px-2 text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/30 transition-colors"
                autoFocus
              />
              <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
                {filteredIcons.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                    title={ic}
                    className={`flex items-center justify-center p-1.5 rounded-sm border transition-colors ${
                      icon === ic
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-transparent hover:border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant/70'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{ic}</span>
                  </button>
                ))}
                {filteredIcons.length === 0 && (
                  <p className="col-span-8 text-[10px] text-on-surface-variant/40 italic py-2 text-center">{t('types_no_icons_match')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>{t('types_field_category')}</label>
          <Select<LocationTypeCategory>
            value={cat}
            options={CATEGORIES.map((c) => ({ value: c.value, label: c.label, dot: c.dot }))}
            onChange={(v) => { if (v) setCat(v); }}
          />
        </div>

      </div>
    </div>
  );
}
