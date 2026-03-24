import { useEffect, useState } from 'react';
import {
  useLocationTypes,
  useContainmentRules,
  useConnectionRules,
  useSaveContainmentRule,
  useDeleteContainmentRule,
  useSaveConnectionRule,
  useDeleteConnectionRule,
  useSaveLocationType,
  useDeleteLocationType,
} from '@/features/locationTypes';
import type {
  LocationTypeEntry,
  LocationTypeCategory,
  LocationTypeContainmentRule,
  LocationTypeConnectionRule,
} from '@/entities/locationType';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: LocationTypeCategory; label: string; dot: string }[] = [
  { value: 'world',      label: 'World-scale', dot: 'bg-blue-400' },
  { value: 'geographic', label: 'Geographic',  dot: 'bg-emerald-400' },
  { value: 'interior',   label: 'Interior',    dot: 'bg-amber-400' },
  { value: 'explorable', label: 'Explorable',  dot: 'bg-rose-400' },
  { value: 'travel',     label: 'Travel',      dot: 'bg-violet-400' },
];

const CATEGORY_ORDER: LocationTypeCategory[] = ['world', 'geographic', 'interior', 'explorable', 'travel'];

const CATEGORY_BADGE: Record<LocationTypeCategory, string> = {
  world:      'text-blue-300 bg-blue-950/60 border-blue-400/25',
  geographic: 'text-emerald-300 bg-emerald-950/60 border-emerald-400/25',
  interior:   'text-amber-300 bg-amber-950/60 border-amber-400/25',
  explorable: 'text-rose-300 bg-rose-950/60 border-rose-400/25',
  travel:     'text-violet-300 bg-violet-950/60 border-violet-400/25',
};

const CATEGORY_ICON: Record<LocationTypeCategory, string> = {
  world:      'text-blue-400',
  geographic: 'text-emerald-400',
  interior:   'text-amber-400',
  explorable: 'text-rose-400',
  travel:     'text-violet-400',
};

const CONNECTION_TYPES = [
  'road', 'path', 'river', 'sea_route', 'border', 'portal', 'tunnel', 'mountain_pass',
];

const inputCls =
  'w-full bg-surface-container border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
        active
          ? 'bg-primary/10 border-primary/40 text-primary'
          : 'border-outline-variant/20 text-on-surface-variant/60 hover:border-primary/30 hover:text-on-surface-variant'
      }`}
    >
      {label}
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

interface DetailProps {
  entry: LocationTypeEntry;
  allTypes: LocationTypeEntry[];
  containRules: LocationTypeContainmentRule[];
  connectRules: LocationTypeConnectionRule[];
  saveType: ReturnType<typeof useSaveLocationType>;
  deleteType: ReturnType<typeof useDeleteLocationType>;
  saveContain: ReturnType<typeof useSaveContainmentRule>;
  deleteContain: ReturnType<typeof useDeleteContainmentRule>;
  saveConnect: ReturnType<typeof useSaveConnectionRule>;
  deleteConnect: ReturnType<typeof useDeleteConnectionRule>;
  onDeleted: () => void;
}

function LocationTypeDetail({
  entry, allTypes, containRules, connectRules,
  saveType, deleteType, saveContain, deleteContain, saveConnect, deleteConnect,
  onDeleted,
}: DetailProps) {
  const [editName, setEditName] = useState(entry.name);
  const [editIcon, setEditIcon] = useState(entry.icon);
  const [editCat, setEditCat] = useState<LocationTypeCategory>(entry.category);
  const [expandedConnectId, setExpandedConnectId] = useState<string | null>(null);

  useEffect(() => {
    setEditName(entry.name);
    setEditIcon(entry.icon);
    setEditCat(entry.category);
    setExpandedConnectId(null);
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
    else saveContain.mutate({ id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, parentTypeId: entry.id, childTypeId: childId });
  };

  const toggleChildOf = (parentId: string) => {
    const rule = containRules.find((r) => r.parentTypeId === parentId && r.childTypeId === entry.id);
    if (rule) deleteContain.mutate(rule.id);
    else saveContain.mutate({ id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, parentTypeId: parentId, childTypeId: entry.id });
  };

  // Connection helpers
  const getConnectRule = (otherId: string) =>
    connectRules.find(
      (r) => (r.typeAId === entry.id && r.typeBId === otherId) || (r.typeAId === otherId && r.typeBId === entry.id),
    );

  const toggleConnect = (otherId: string) => {
    const rule = getConnectRule(otherId);
    if (rule) { deleteConnect.mutate(rule.id); if (expandedConnectId === otherId) setExpandedConnectId(null); }
    else saveConnect.mutate({ id: `cnr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, typeAId: entry.id, typeBId: otherId, allowedConnectionTypes: ['road', 'path'] });
  };

  const toggleConnectType = (otherId: string, ct: string) => {
    const rule = getConnectRule(otherId);
    if (!rule) return;
    const next = rule.allowedConnectionTypes.includes(ct)
      ? rule.allowedConnectionTypes.filter((x) => x !== ct)
      : [...rule.allowedConnectionTypes, ct];
    saveConnect.mutate({ ...rule, allowedConnectionTypes: next });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">

      {/* Hero */}
      <div className="relative w-full h-44 flex-shrink-0 bg-surface-container-low flex items-center justify-center overflow-hidden">
        <span
          className={`material-symbols-outlined text-[7rem] ${CATEGORY_ICON[entry.category]} opacity-20 select-none leading-none`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {editIcon || entry.icon}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border rounded-sm text-[10px] font-bold uppercase tracking-widest ${CATEGORY_BADGE[entry.category]}`}>
            {CATEGORIES.find((c) => c.value === entry.category)?.label}
          </span>
          {entry.builtin && (
            <span className="px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
              built-in
            </span>
          )}
        </div>
        <div className="absolute top-3 right-4 flex items-center gap-2">
          {!entry.builtin && (
            <button
              onClick={() => { deleteType.mutate(entry.id); onDeleted(); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-rose-400 text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-rose-500/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6 space-y-8">

        {/* ── Identity ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Identity</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Icon <span className="normal-case text-on-surface-variant/35">(material symbol)</span></label>
              <div className="flex items-center gap-2">
                <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className={inputCls} placeholder={entry.icon} />
                <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${CATEGORY_ICON[editCat]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {editIcon || entry.icon}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setEditCat(c.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
                    editCat === c.value ? CATEGORY_BADGE[c.value] : 'border-outline-variant/20 text-on-surface-variant/50 hover:border-outline-variant/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => saveType.mutate({ ...entry, name: editName.trim(), icon: editIcon.trim() || entry.icon, category: editCat })}
            disabled={!editName.trim() || saveType.isPending}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save Changes
          </button>
        </section>

        {/* ── Can be child of ──────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant whitespace-nowrap flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              Can be child of
            </h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-xs text-on-surface-variant/40">
            Which types can contain a <span className="text-on-surface-variant/70">{entry.name}</span>?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {others.map((t) => (
              <Pill key={t.id} label={t.name} active={isChildOf(t.id)} onClick={() => toggleChildOf(t.id)} />
            ))}
          </div>
        </section>

        {/* ── Can contain ──────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant whitespace-nowrap flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
              Can contain
            </h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-xs text-on-surface-variant/40">
            Which types can be nested inside a <span className="text-on-surface-variant/70">{entry.name}</span>?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {others.map((t) => (
              <Pill key={t.id} label={t.name} active={canContain(t.id)} onClick={() => toggleContain(t.id)} />
            ))}
          </div>
        </section>

        {/* ── Can connect to ───────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant whitespace-nowrap flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">hub</span>
              Can connect to
            </h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-xs text-on-surface-variant/40">
            Which types can be physically linked to a <span className="text-on-surface-variant/70">{entry.name}</span>?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {others.map((t) => {
              const connected = !!getConnectRule(t.id);
              return (
                <div key={t.id} className="flex items-center gap-0.5">
                  <Pill label={t.name} active={connected} onClick={() => toggleConnect(t.id)} />
                  {connected && (
                    <button
                      onClick={() => setExpandedConnectId((prev) => (prev === t.id ? null : t.id))}
                      className={`p-1 rounded-sm transition-colors ${expandedConnectId === t.id ? 'text-primary' : 'text-on-surface-variant/30 hover:text-on-surface-variant'}`}
                      title="Configure connection types"
                    >
                      <span className="material-symbols-outlined text-[13px]">settings</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {expandedConnectId && !!getConnectRule(expandedConnectId) && (() => {
            const rule = getConnectRule(expandedConnectId)!;
            const other = allTypes.find((t) => t.id === expandedConnectId);
            return (
              <div className="p-3 bg-surface-container rounded-sm border border-outline-variant/15 space-y-2">
                <p className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/50">
                  Via — {entry.name} ↔ {other?.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CONNECTION_TYPES.map((ct) => (
                    <Pill
                      key={ct}
                      label={ct.replace('_', ' ')}
                      active={rule.allowedConnectionTypes.includes(ct)}
                      onClick={() => toggleConnectType(expandedConnectId, ct)}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
}

// ── New type form ─────────────────────────────────────────────────────────────

interface NewTypeFormProps {
  saveType: ReturnType<typeof useSaveLocationType>;
  onCreated: (id: string) => void;
  onCancel: () => void;
}

function NewTypeForm({ saveType, onCreated, onCancel }: NewTypeFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('place');
  const [cat, setCat] = useState<LocationTypeCategory>('geographic');

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = `lt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    saveType.mutate(
      { id, name: name.trim(), icon: icon.trim() || 'place', category: cat, biomeOptions: [], isSettlement: false, createdAt: new Date().toISOString() },
      { onSuccess: () => onCreated(id) },
    );
  };

  return (
    <div className="px-8 py-8 space-y-5">
      <div>
        <p className="text-[10px] font-label uppercase tracking-widest text-primary mb-1">New Location Type</p>
        <p className="text-xs text-on-surface-variant/50">After creating, configure containment and connection rules below.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Name <span className="text-primary">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dungeon Complex"
            className={inputCls} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
        </div>
        <div>
          <label className={labelCls}>Icon <span className="normal-case text-on-surface-variant/35">(material symbol)</span></label>
          <div className="flex items-center gap-2">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="place" className={inputCls} />
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant/50 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon || 'place'}
            </span>
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
                cat === c.value ? CATEGORY_BADGE[c.value] : 'border-outline-variant/20 text-on-surface-variant/50 hover:border-outline-variant/40'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button onClick={handleCreate} disabled={!name.trim() || saveType.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90">
          <span className="material-symbols-outlined text-sm">add</span>
          Create Type
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LocationTypesPage() {
  const { data: types,        isLoading: loadingTypes }   = useLocationTypes();
  const { data: containRules, isLoading: loadingContain } = useContainmentRules();
  const { data: connectRules, isLoading: loadingConnect } = useConnectionRules();

  const saveType    = useSaveLocationType();
  const deleteType  = useDeleteLocationType();
  const saveContain = useSaveContainmentRule();
  const delContain  = useDeleteContainmentRule();
  const saveConnect = useSaveConnectionRule();
  const delConnect  = useDeleteConnectionRule();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const isLoading = loadingTypes || loadingContain || loadingConnect;

  const sorted = [...(types ?? [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  const selected = types?.find((t) => t.id === selectedId) ?? sorted[0] ?? null;

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface overflow-hidden">

      {/* Sticky header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Location Types</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Define which location types exist and how they relate to each other.
            </p>
          </div>
          <button
            onClick={() => { setShowNew(true); setSelectedId(null); }}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Type</span>
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel — list */}
          <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {CATEGORY_ORDER.map((cat) => {
                const group = sorted.filter((t) => t.category === cat);
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
                    {group.map((t) => {
                      const isActive = !showNew && selected?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => { setSelectedId(t.id); setShowNew(false); }}
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
                              className={`material-symbols-outlined text-[17px] ${isActive ? 'text-primary' : CATEGORY_ICON[t.category]}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {t.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate transition-colors ${isActive ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
                              {t.name}
                            </p>
                            {t.builtin && (
                              <p className={`text-[9px] mt-0.5 uppercase tracking-widest ${isActive ? 'text-primary/40' : 'text-on-surface-variant/30'}`}>
                                built-in
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
              <p className="text-[10px] text-on-surface-variant/40">
                <span className="text-primary font-bold">{sorted.length}</span> types
              </p>
            </div>
          </div>

          {/* Right panel — detail / new form */}
          <div className="flex-1 overflow-hidden relative">
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
                connectRules={connectRules ?? []}
                saveType={saveType}
                deleteType={deleteType}
                saveContain={saveContain}
                deleteContain={delContain}
                saveConnect={saveConnect}
                deleteConnect={delConnect}
                onDeleted={() => setSelectedId(null)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                Select a location type
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
