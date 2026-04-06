import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { Select, EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import {
  useLocationTypes,
  useContainmentRules,
  useSaveContainmentRule,
  useDeleteContainmentRule,
  useSaveLocationType,
  useDeleteLocationType,
} from '@/features/locationTypes';
import type {
  LocationTypeEntry,
  LocationTypeCategory,
  LocationTypeContainmentRule,
} from '@/entities/locationType';
import {
  CATEGORY_ICON_COLOR,
  CATEGORY_HEX_COLOR,
  CATEGORY_DOT_CLS,
} from '@/entities/locationType';

// -- Constants ----------------------------------------------------------------

const CATEGORY_ORDER: LocationTypeCategory[] = ['world', 'civilization', 'geographic', 'water', 'poi', 'travel'];

// Re-alias for local convenience
const CATEGORY_ICON = CATEGORY_ICON_COLOR;

const inputCls =
  'w-full bg-surface-container border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

// -- Icon suggestions ---------------------------------------------------------

const ICON_SUGGESTIONS = [
  'place', 'public', 'terrain', 'forest', 'landscape', 'water', 'waves', 'stream', 'grass', 'map',
  'apartment', 'location_city', 'cottage', 'holiday_village', 'domain', 'house', 'home', 'villa',
  'skull', 'route', 'merge', 'water_full', 'account_balance', 'warehouse', 'store', 'museum',
  'hub', 'explore', 'anchor', 'flag', 'business', 'park', 'agriculture', 'beach_access',
  'sailing', 'hiking', 'temple_buddhist', 'church', 'monument', 'school',
  'local_fire_department', 'local_hospital', 'fence', 'spa', 'door_front',
];

// -- Relation section ---------------------------------------------------------

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
              <span className={`material-symbols-outlined text-[14px] flex-shrink-0 ${CATEGORY_ICON[t.category]}`} style={{ fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
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

// -- Detail panel -------------------------------------------------------------

interface DetailProps {
  entry: LocationTypeEntry;
  allTypes: LocationTypeEntry[];
  containRules: LocationTypeContainmentRule[];
  saveType: ReturnType<typeof useSaveLocationType>;
  deleteType: ReturnType<typeof useDeleteLocationType>;
  saveContain: ReturnType<typeof useSaveContainmentRule>;
  deleteContain: ReturnType<typeof useDeleteContainmentRule>;
  onDeleted: () => void;
}

function LocationTypeDetail({
  entry, allTypes, containRules,
  saveType, deleteType, saveContain, deleteContain,
  onDeleted,
}: DetailProps) {
  const { t } = useTranslation('locations');
  const [editName, setEditName] = useState(entry.name);
  const [editIcon, setEditIcon] = useState(entry.icon);
  const [editCat, setEditCat] = useState<LocationTypeCategory>(entry.category);

  // Icon picker
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  // Relation adder state
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

  // Containment helpers
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

  // Active relations
  const activeParents = others.filter((t) => isChildOf(t.id));
  const activeChildren = others.filter((t) => canContain(t.id));

  // Icon picker filtered list
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
                  className={`material-symbols-outlined text-[22px] ${CATEGORY_ICON[editCat]}`}
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

// -- New type form ------------------------------------------------------------

interface NewTypeFormProps {
  saveType: ReturnType<typeof useSaveLocationType>;
  onCreated: (id: string) => void;
  onCancel: () => void;
}

function NewTypeForm({ saveType, onCreated, onCancel }: NewTypeFormProps) {
  const { t } = useTranslation('locations');
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
      { id: '', name: name.trim(), icon, category: cat, biomeOptions: [], isSettlement: false, createdAt: new Date().toISOString() },
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
                className={`material-symbols-outlined text-[22px] ${CATEGORY_ICON[cat]}`}
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

// -- Type row (left panel) ----------------------------------------------------

function TypeRow({ t: entry, isActive, onSelect, builtInLabel }: { t: LocationTypeEntry; isActive: boolean; onSelect: () => void; builtInLabel: string }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
        isActive
          ? 'bg-primary/8 border-l-2 border-l-primary'
          : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
      }`}
    >
      <div className={`w-9 h-9 rounded-sm flex-shrink-0 flex items-center justify-center border ${
        isActive ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'
      }`}>
        <span
          className={`material-symbols-outlined text-[17px] ${CATEGORY_ICON[entry.category]}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {entry.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate transition-colors ${isActive ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
          {entry.name}
        </p>
        {entry.builtin && (
          <p className={`text-[9px] mt-0.5 uppercase tracking-widest ${isActive ? 'text-primary/40' : 'text-on-surface-variant/30'}`}>
            {builtInLabel}
          </p>
        )}
      </div>
    </button>
  );
}

// -- Page ---------------------------------------------------------------------

export default function LocationTypesPage() {
  const { t } = useTranslation('locations');
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const locationsEnabled = useSectionEnabled(campaignId ?? '', 'location_types');
  const { data: types,        isLoading: loadingTypes }   = useLocationTypes(campaignId);
  const { data: containRules, isLoading: loadingContain } = useContainmentRules();

  const saveType    = useSaveLocationType(campaignId ?? '');
  const deleteType  = useDeleteLocationType();
  const saveContain = useSaveContainmentRule();
  const delContain  = useDeleteContainmentRule();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');

  const isLoading = loadingTypes || loadingContain;

  const sorted = [...(types ?? [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  const filtered = search.trim()
    ? sorted.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const selected = types?.find((t) => t.id === selectedId) ?? sorted[0] ?? null;

  const CATEGORIES: { value: LocationTypeCategory; label: string; dot: string }[] = [
    { value: 'world',        label: t('category_world'),        dot: CATEGORY_DOT_CLS.world },
    { value: 'civilization', label: t('category_civilization'), dot: CATEGORY_DOT_CLS.civilization },
    { value: 'geographic',   label: t('category_geographic'),   dot: CATEGORY_DOT_CLS.geographic },
    { value: 'water',        label: t('category_water'),        dot: CATEGORY_DOT_CLS.water },
    { value: 'poi',          label: t('category_poi'),          dot: CATEGORY_DOT_CLS.poi },
    { value: 'travel',       label: t('category_travel'),       dot: CATEGORY_DOT_CLS.travel },
  ];

  if (!locationsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? t('common:campaign')}
        </Link>
      </div>

      {/* Content -- single max-width container */}
      <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 pb-20">

        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('types_title')}</h1>
              <p className="text-on-surface-variant text-sm mt-1">
                {t('types_subtitle')}
              </p>
            </div>
            <button
              onClick={() => { setShowNew(true); setSelectedId(null); }}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">{t('types_add')}</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 p-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            {t('types_loading')}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 min-h-[480px]">

            {/* Left panel -- type list card */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex flex-col w-full md:w-[320px] md:flex-shrink-0 overflow-hidden">

              {/* Search */}
              <div className="px-3 py-2.5 border-b border-outline-variant/10 flex-shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                  <input
                    type="text"
                    placeholder={t('types_search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
                {filtered.length === 0 && (
                  <EmptyState icon="account_tree" title={search.trim() ? t('types_empty_search') : t('types_empty')} subtitle={search.trim() ? undefined : t('types_empty_subtitle')} />
                )}
                {search.trim() ? (
                  // Flat list when searching
                  filtered.map((lt) => <TypeRow key={lt.id} t={lt} isActive={!showNew && selected?.id === lt.id} onSelect={() => { setSelectedId(lt.id); setShowNew(false); }} builtInLabel={t('types_built_in')} />)
                ) : (
                  // Grouped by category
                  CATEGORY_ORDER.map((cat) => {
                    const group = filtered.filter((lt) => lt.category === cat);
                    if (group.length === 0) return null;
                    const meta = CATEGORIES.find((c) => c.value === cat)!;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/35">
                            {meta.label}
                          </span>
                        </div>
                        {group.map((lt) => <TypeRow key={lt.id} t={lt} isActive={!showNew && selected?.id === lt.id} onSelect={() => { setSelectedId(lt.id); setShowNew(false); }} builtInLabel={t('types_built_in')} />)}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
                <p className="text-[10px] text-on-surface-variant/40">
                  <span className="text-primary font-bold">{sorted.length}</span> {t('types_count_suffix')}
                </p>
              </div>
            </div>

            {/* Right panel -- detail / new form card */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex-1 overflow-hidden min-h-[400px]">
              {showNew ? (
                <NewTypeForm
                  saveType={saveType}
                  onCreated={(id) => { setSelectedId(id); setShowNew(false); }}
                  onCancel={() => setShowNew(false)}
                />
              ) : selected ? (
                <LocationTypeDetail
                  key={selected.id}
                  entry={selected}
                  allTypes={types ?? []}
                  containRules={containRules ?? []}
                  saveType={saveType}
                  deleteType={deleteType}
                  saveContain={saveContain}
                  deleteContain={delContain}
                  onDeleted={() => setSelectedId(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                  {t('types_select_prompt')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
