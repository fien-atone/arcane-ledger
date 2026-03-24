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
import { LoadingSpinner } from '@/shared/ui';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: LocationTypeCategory; label: string; dot: string }[] = [
  { value: 'world',      label: 'World-scale', dot: 'bg-blue-400' },
  { value: 'geographic', label: 'Geographic',  dot: 'bg-emerald-400' },
  { value: 'interior',   label: 'Interior',    dot: 'bg-amber-400' },
  { value: 'explorable', label: 'Explorable',  dot: 'bg-rose-400' },
  { value: 'linear',     label: 'Linear',      dot: 'bg-violet-400' },
];

const CATEGORY_BADGE: Record<LocationTypeCategory, string> = {
  world:      'text-blue-300 bg-blue-950/60 border-blue-400/25',
  geographic: 'text-emerald-300 bg-emerald-950/60 border-emerald-400/25',
  interior:   'text-amber-300 bg-amber-950/60 border-amber-400/25',
  explorable: 'text-rose-300 bg-rose-950/60 border-rose-400/25',
  linear:     'text-violet-300 bg-violet-950/60 border-violet-400/25',
};

const CATEGORY_ICON_COLOR: Record<LocationTypeCategory, string> = {
  world:      'text-blue-400',
  geographic: 'text-emerald-400',
  interior:   'text-amber-400',
  explorable: 'text-rose-400',
  linear:     'text-violet-400',
};

const CONNECTION_TYPES = [
  'road', 'path', 'river', 'sea_route', 'border', 'portal', 'tunnel', 'mountain_pass',
];

const inputCls =
  'w-full bg-surface-container border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

// ── Pill ──────────────────────────────────────────────────────────────────────

function Pill({
  label, active, onClick, dim,
}: { label: string; active: boolean; onClick: () => void; dim?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
        active
          ? 'bg-primary/10 border-primary/40 text-primary'
          : dim
          ? 'border-outline-variant/10 text-on-surface-variant/30 hover:border-outline-variant/30 hover:text-on-surface-variant/60'
          : 'border-outline-variant/20 text-on-surface-variant/60 hover:border-primary/30 hover:text-on-surface-variant'
      }`}
    >
      {label}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
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
  expanded: boolean;
  onToggle: () => void;
}

function LocationTypeCard({
  entry, allTypes, containRules, connectRules,
  saveType, deleteType, saveContain, deleteContain, saveConnect, deleteConnect,
  expanded, onToggle,
}: CardProps) {
  const [editName, setEditName] = useState(entry.name);
  const [editIcon, setEditIcon] = useState(entry.icon);
  const [editCat, setEditCat] = useState<LocationTypeCategory>(entry.category);
  const [expandedConnectId, setExpandedConnectId] = useState<string | null>(null);

  // Sync identity fields when entry is updated from outside (after save)
  useEffect(() => {
    setEditName(entry.name);
    setEditIcon(entry.icon);
    setEditCat(entry.category);
  }, [entry.name, entry.icon, entry.category]);

  const others = allTypes.filter((t) => t.id !== entry.id);

  // Containment helpers
  const canContain = (childId: string) =>
    containRules.some((r) => r.parentTypeId === entry.id && r.childTypeId === childId);
  const isChildOf = (parentId: string) =>
    containRules.some((r) => r.parentTypeId === parentId && r.childTypeId === entry.id);

  const toggleContain = (childId: string) => {
    const rule = containRules.find((r) => r.parentTypeId === entry.id && r.childTypeId === childId);
    if (rule) {
      deleteContain.mutate(rule.id);
    } else {
      saveContain.mutate({
        id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        parentTypeId: entry.id,
        childTypeId: childId,
      });
    }
  };

  const toggleChildOf = (parentId: string) => {
    const rule = containRules.find((r) => r.parentTypeId === parentId && r.childTypeId === entry.id);
    if (rule) {
      deleteContain.mutate(rule.id);
    } else {
      saveContain.mutate({
        id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        parentTypeId: parentId,
        childTypeId: entry.id,
      });
    }
  };

  // Connection helpers
  const getConnectRule = (otherId: string) =>
    connectRules.find(
      (r) =>
        (r.typeAId === entry.id && r.typeBId === otherId) ||
        (r.typeAId === otherId && r.typeBId === entry.id),
    );

  const isConnected = (otherId: string) => !!getConnectRule(otherId);

  const toggleConnect = (otherId: string) => {
    const rule = getConnectRule(otherId);
    if (rule) {
      deleteConnect.mutate(rule.id);
      if (expandedConnectId === otherId) setExpandedConnectId(null);
    } else {
      saveConnect.mutate({
        id: `cnr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        typeAId: entry.id,
        typeBId: otherId,
        allowedConnectionTypes: ['road', 'path'],
      });
    }
  };

  const toggleConnectType = (otherId: string, ct: string) => {
    const rule = getConnectRule(otherId);
    if (!rule) return;
    const current = rule.allowedConnectionTypes;
    const next = current.includes(ct) ? current.filter((x) => x !== ct) : [...current, ct];
    saveConnect.mutate({ ...rule, allowedConnectionTypes: next });
  };

  const handleSaveType = () => {
    if (!editName.trim()) return;
    saveType.mutate({
      ...entry,
      name: editName.trim(),
      icon: editIcon.trim() || entry.icon,
      category: editCat,
    });
  };

  return (
    <div className={`border rounded-sm transition-colors ${
      expanded
        ? 'border-outline-variant/30 bg-surface-container-low'
        : 'border-outline-variant/15 bg-surface-container-low/50 hover:border-outline-variant/25'
    }`}>

      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
      >
        <span
          className={`material-symbols-outlined text-[20px] flex-shrink-0 ${CATEGORY_ICON_COLOR[entry.category]}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {entry.icon}
        </span>

        <span className="font-medium text-sm text-on-surface flex-1">{entry.name}</span>

        <span className={`text-[9px] font-label uppercase tracking-widest px-2 py-0.5 rounded-sm border ${CATEGORY_BADGE[entry.category]}`}>
          {entry.category}
        </span>

        {entry.builtin && (
          <span className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/30 border border-outline-variant/15 px-2 py-0.5 rounded-sm">
            built-in
          </span>
        )}

        <span className={`material-symbols-outlined text-[16px] text-on-surface-variant/40 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-outline-variant/15 px-5 py-5 space-y-6">

          {/* ── Identity ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <p className="text-[10px] font-label uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">edit</span>
              Identity
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Icon{' '}
                  <span className="normal-case text-on-surface-variant/35">(material symbol)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className={inputCls}
                    placeholder={entry.icon}
                  />
                  <span
                    className={`material-symbols-outlined text-[22px] flex-shrink-0 ${CATEGORY_ICON_COLOR[editCat]}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
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
                      editCat === c.value
                        ? CATEGORY_BADGE[c.value]
                        : 'border-outline-variant/20 text-on-surface-variant/50 hover:border-outline-variant/40'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSaveType}
                disabled={!editName.trim() || saveType.isPending}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                Save
              </button>
              {!entry.builtin ? (
                <button
                  onClick={() => deleteType.mutate(entry.id)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-label uppercase tracking-widest rounded-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Delete
                </button>
              ) : (
                <span className="text-[10px] text-on-surface-variant/30 italic">
                  Built-in types cannot be deleted.
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-outline-variant/10" />

          {/* ── Can be child of ───────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">arrow_upward</span>
              Can be child of
            </p>
            <div className="flex flex-wrap gap-1.5">
              {others.map((t) => (
                <Pill
                  key={t.id}
                  label={t.name}
                  active={isChildOf(t.id)}
                  onClick={() => toggleChildOf(t.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Can contain ──────────────────────────────────────────*/}
          <div className="space-y-2">
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
              Can contain
            </p>
            <div className="flex flex-wrap gap-1.5">
              {others.map((t) => (
                <Pill
                  key={t.id}
                  label={t.name}
                  active={canContain(t.id)}
                  onClick={() => toggleContain(t.id)}
                />
              ))}
            </div>
          </div>

          {/* ── Can connect to ───────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">hub</span>
              Can connect to
            </p>
            <div className="flex flex-wrap gap-1.5">
              {others.map((t) => {
                const connected = isConnected(t.id);
                return (
                  <div key={t.id} className="flex items-center gap-0.5">
                    <Pill
                      label={t.name}
                      active={connected}
                      onClick={() => toggleConnect(t.id)}
                    />
                    {connected && (
                      <button
                        onClick={() => setExpandedConnectId((prev) => (prev === t.id ? null : t.id))}
                        className={`p-1 rounded-sm transition-colors ${
                          expandedConnectId === t.id
                            ? 'text-primary'
                            : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                        }`}
                        title="Configure connection types"
                      >
                        <span className="material-symbols-outlined text-[13px]">settings</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connection type sub-editor */}
            {expandedConnectId && isConnected(expandedConnectId) && (() => {
              const rule = getConnectRule(expandedConnectId);
              const other = allTypes.find((t) => t.id === expandedConnectId);
              if (!rule || !other) return null;
              return (
                <div className="mt-2 p-3 bg-surface-container rounded-sm border border-outline-variant/15 space-y-2">
                  <p className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/50">
                    Via — {entry.name} ↔ {other.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CONNECTION_TYPES.map((ct) => {
                      const active = rule.allowedConnectionTypes.includes(ct);
                      return (
                        <Pill
                          key={ct}
                          label={ct.replace('_', ' ')}
                          active={active}
                          onClick={() => toggleConnectType(expandedConnectId, ct)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: LocationTypeCategory[] = ['world', 'geographic', 'interior', 'explorable', 'linear'];

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

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New type form
  const [showNew, setShowNew]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [newIcon, setNewIcon]   = useState('place');
  const [newCat, setNewCat]     = useState<LocationTypeCategory>('geographic');

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = `lt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    saveType.mutate(
      {
        id,
        name: newName.trim(),
        icon: newIcon.trim() || 'place',
        category: newCat,
        biomeOptions: [],
        isSettlement: false,
        createdAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewIcon('place');
          setShowNew(false);
          setExpandedId(id);
        },
      },
    );
  };

  if (loadingTypes || loadingContain || loadingConnect) {
    return <LoadingSpinner as="main" text="Loading location types…" />;
  }

  const sorted = [...(types ?? [])].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  return (
    <main className="flex-1 min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] font-label uppercase tracking-widest text-primary block mb-1">
              World Configuration
            </span>
            <h1 className="font-headline text-3xl font-bold text-on-surface">Location Types</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Define which location types exist and how they relate to each other.
            </p>
          </div>
          <button
            onClick={() => setShowNew((v) => !v)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">{showNew ? 'close' : 'add'}</span>
            {showNew ? 'Cancel' : 'New Type'}
          </button>
        </div>

        {/* New type form */}
        {showNew && (
          <div className="p-5 bg-surface-container-low border border-outline-variant/20 rounded-sm space-y-4">
            <p className="text-[10px] font-label uppercase tracking-widest text-primary">New Location Type</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name <span className="text-primary">*</span></label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dungeon Complex"
                  className={inputCls}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className={labelCls}>
                  Icon <span className="normal-case text-on-surface-variant/35">(material symbol)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    placeholder="place"
                    className={inputCls}
                  />
                  <span
                    className="material-symbols-outlined text-[22px] text-on-surface-variant/50 flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {newIcon || 'place'}
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
                    onClick={() => setNewCat(c.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
                      newCat === c.value
                        ? CATEGORY_BADGE[c.value]
                        : 'border-outline-variant/20 text-on-surface-variant/50 hover:border-outline-variant/40'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || saveType.isPending}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Create Type
              </button>
            </div>
          </div>
        )}

        {/* Type list — grouped by category */}
        {CATEGORY_ORDER.map((cat) => {
          const group = sorted.filter((t) => t.category === cat);
          if (group.length === 0) return null;
          const meta = CATEGORIES.find((c) => c.value === cat)!;
          return (
            <div key={cat} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">
                  {meta.label}
                </span>
              </div>
              <div className="space-y-1.5">
                {group.map((entry) => (
                  <LocationTypeCard
                    key={entry.id}
                    entry={entry}
                    allTypes={types ?? []}
                    containRules={containRules ?? []}
                    connectRules={connectRules ?? []}
                    saveType={saveType}
                    deleteType={deleteType}
                    saveContain={saveContain}
                    deleteContain={delContain}
                    saveConnect={saveConnect}
                    deleteConnect={delConnect}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId((prev) => (prev === entry.id ? null : entry.id))}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="text-xs text-on-surface-variant/40 italic text-center py-12">
            No location types found.
          </p>
        )}
      </div>
    </main>
  );
}
