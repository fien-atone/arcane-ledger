/**
 * LocationTypeDetailSection — right column when an existing type is selected.
 *
 * Renders the editable detail view for a single LocationTypeEntry:
 * - icon picker + name + category fields
 * - "can be child of" relation list
 * - "can contain" relation list
 * - save / delete actions
 *
 * Owns its own mutations (save type, delete type, save/delete containment
 * rule). Receives the currently selected entry, the full type list and the
 * containment rules from the parent (which already loaded them in
 * useLocationTypesPage — passing them down avoids duplicate queries).
 *
 * The RelationSection helper lives inside this file because it is only used
 * by this section (twice: parents + children).
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/shared/ui';
import {
  useSaveLocationType,
  useDeleteLocationType,
  useSaveContainmentRule,
  useDeleteContainmentRule,
} from '@/features/locationTypes';
import {
  CATEGORY_ICON_COLOR,
  CATEGORY_HEX_COLOR,
  CATEGORY_DOT_CLS,
} from '@/entities/locationType';
import type {
  LocationTypeEntry,
  LocationTypeCategory,
  LocationTypeContainmentRule,
} from '@/entities/locationType';

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

// ── RelationSection helper ───────────────────────────────────────────────────

interface RelationSectionProps {
  title: string;
  icon: string;
  activeItems: LocationTypeEntry[];
  allOthers: LocationTypeEntry[];
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
  adding: boolean;
  addSearch: string;
  setAdding: (v: boolean) => void;
  setAddSearch: (v: string) => void;
  labels: {
    add: string;
    none: string;
    remove: string;
    filter: string;
    noMore: string;
  };
}

function RelationSection({
  title, icon, activeItems, allOthers,
  onRemove, onAdd, adding, addSearch, setAdding, setAddSearch,
  labels,
}: RelationSectionProps) {
  const inactive = allOthers.filter(
    (t) => !activeItems.some((a) => a.id === t.id) &&
      t.name.toLowerCase().includes(addSearch.toLowerCase()),
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[13px]">{icon}</span>
          {title}
        </h3>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {activeItems.length === 0 && !adding && (
          <span className="text-xs text-on-surface-variant/40 italic">{labels.none}</span>
        )}
        {activeItems.map((t) => (
          <span key={t.id} className="inline-flex items-stretch h-8">
            <span className="flex items-center gap-1.5 pl-2.5 pr-2 text-[10px] font-label uppercase tracking-widest rounded-l-sm border border-r-0 border-outline-variant/30 bg-surface-container text-on-surface-variant">
              <span className={`material-symbols-outlined text-[14px] flex-shrink-0 ${CATEGORY_ICON_COLOR[t.category]}`} style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
              {t.name}
            </span>
            <button
              onClick={() => onRemove(t.id)}
              className="flex items-center px-1.5 rounded-r-sm border border-l-0 border-outline-variant/30 bg-surface-container text-on-surface-variant/40 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/5 transition-colors"
              title={labels.remove}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        ))}
        <button
          onClick={() => { setAdding(!adding); setAddSearch(''); }}
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
            adding
              ? 'border-primary/40 text-primary bg-primary/10'
              : 'border-dashed border-outline-variant/20 text-on-surface-variant/50 hover:border-primary/30 hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[12px]">add</span>
          {labels.add}
        </button>
      </div>
      {adding && (
        <div className="p-3 bg-surface-container rounded-sm border border-outline-variant/15 space-y-2">
          <input
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            placeholder={labels.filter}
            className="w-full bg-surface-container-low border-0 border-b border-outline-variant/20 focus:border-primary py-1.5 px-2 text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant/30 transition-colors"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
            {inactive.map((t) => (
              <button
                key={t.id}
                onClick={() => onAdd(t.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border border-outline-variant/20 text-on-surface-variant/60 hover:border-primary/40 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1", color: CATEGORY_HEX_COLOR[t.category] }}>{t.icon}</span>
                {t.name}
              </button>
            ))}
            {inactive.length === 0 && (
              <p className="text-xs text-on-surface-variant/40 italic py-1">{labels.noMore}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Detail section ───────────────────────────────────────────────────────────

interface Props {
  campaignId: string;
  entry: LocationTypeEntry;
  allTypes: LocationTypeEntry[];
  containRules: LocationTypeContainmentRule[];
  onDeleted: () => void;
}

export function LocationTypeDetailSection({
  campaignId,
  entry,
  allTypes,
  containRules,
  onDeleted,
}: Props) {
  const { t } = useTranslation('locations');

  const saveType = useSaveLocationType(campaignId);
  const deleteType = useDeleteLocationType();
  const saveContain = useSaveContainmentRule();
  const deleteContain = useDeleteContainmentRule();

  const [editName, setEditName] = useState(entry.name);
  const [editIcon, setEditIcon] = useState(entry.icon);
  const [editCat, setEditCat] = useState<LocationTypeCategory>(entry.category);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const [addingChildOf, setAddingChildOf] = useState(false);
  const [addChildOfSearch, setAddChildOfSearch] = useState('');
  const [addingContain, setAddingContain] = useState(false);
  const [addContainSearch, setAddContainSearch] = useState('');

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

  useEffect(() => {
    setEditName(entry.name);
    setEditIcon(entry.icon);
    setEditCat(entry.category);
    setShowIconPicker(false);
    setAddingChildOf(false);
    setAddingContain(false);
  }, [entry.id, entry.name, entry.icon, entry.category]);

  const others = allTypes.filter((t) => t.id !== entry.id);

  const canContain = (childId: string) =>
    containRules.some((r) => r.parentTypeId === entry.id && r.childTypeId === childId);
  const isChildOf = (parentId: string) =>
    containRules.some((r) => r.parentTypeId === parentId && r.childTypeId === entry.id);

  const toggleContain = (childId: string) => {
    const rule = containRules.find((r) => r.parentTypeId === entry.id && r.childTypeId === childId);
    if (rule) deleteContain.mutate(rule.id);
    else saveContain.mutate({ id: '', parentTypeId: entry.id, childTypeId: childId });
  };

  const toggleChildOf = (parentId: string) => {
    const rule = containRules.find((r) => r.parentTypeId === parentId && r.childTypeId === entry.id);
    if (rule) deleteContain.mutate(rule.id);
    else saveContain.mutate({ id: '', parentTypeId: parentId, childTypeId: entry.id });
  };

  const activeParents = others.filter((t) => isChildOf(t.id));
  const activeChildren = others.filter((t) => canContain(t.id));

  const filteredIcons = iconSearch.trim()
    ? ICON_SUGGESTIONS.filter((ic) => ic.includes(iconSearch.toLowerCase().replace(/\s+/g, '_')))
    : ICON_SUGGESTIONS;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-3.5 border-b border-outline-variant/10">
        {!entry.builtin && (
          <button
            onClick={() => { deleteType.mutate(entry.id); onDeleted(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-rose-400 text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-rose-500/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
            {t('types_delete')}
          </button>
        )}
        <button
          onClick={() => saveType.mutate({ ...entry, name: editName.trim(), icon: editIcon.trim() || entry.icon, category: editCat })}
          disabled={!editName.trim() || saveType.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[13px]">save</span>
          {t('types_save_changes')}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">

        {/* Fields */}
        <section className="space-y-4">

          {/* Icon + Name combined row */}
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
                  className={`material-symbols-outlined text-[22px] ${CATEGORY_ICON_COLOR[editCat]}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {editIcon || entry.icon}
                </span>
              </button>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputCls} flex-1`} />
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
                      onClick={() => { setEditIcon(ic); setShowIconPicker(false); }}
                      title={ic}
                      className={`flex items-center justify-center p-1.5 rounded-sm border transition-colors ${
                        editIcon === ic
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

          <div>
            <label className={labelCls}>{t('types_field_category')}</label>
            <Select<LocationTypeCategory>
              value={editCat}
              options={CATEGORIES.map((c) => ({ value: c.value, label: c.label, dot: c.dot }))}
              onChange={(v) => { if (v) setEditCat(v); }}
            />
          </div>
        </section>

        {/* Can be child of */}
        <RelationSection
          title={t('types_relation_can_be_child_of')}
          icon="arrow_upward"
          activeItems={activeParents}
          allOthers={others}
          onRemove={(id) => toggleChildOf(id)}
          onAdd={(id) => toggleChildOf(id)}
          adding={addingChildOf}
          addSearch={addChildOfSearch}
          setAdding={setAddingChildOf}
          setAddSearch={setAddChildOfSearch}
          labels={{
            add: t('types_add_btn'),
            none: t('types_none'),
            remove: t('types_remove'),
            filter: t('types_filter_placeholder'),
            noMore: t('types_no_more_to_add'),
          }}
        />

        {/* Can contain */}
        <RelationSection
          title={t('types_relation_can_contain')}
          icon="arrow_downward"
          activeItems={activeChildren}
          allOthers={others}
          onRemove={(id) => toggleContain(id)}
          onAdd={(id) => toggleContain(id)}
          adding={addingContain}
          addSearch={addContainSearch}
          setAdding={setAddingContain}
          setAddSearch={setAddContainSearch}
          labels={{
            add: t('types_add_btn'),
            none: t('types_none'),
            remove: t('types_remove'),
            filter: t('types_filter_placeholder'),
            noMore: t('types_no_more_to_add'),
          }}
        />

      </div>
    </div>
  );
}
