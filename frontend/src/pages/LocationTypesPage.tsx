import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  MarkerType,
  Panel,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import '@xyflow/react/dist/style.css';

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
import { LocationTypeNode, type LocationTypeNodeData } from '@/features/locationTypes/ui/LocationTypeNode';
import type { LocationTypeEntry, LocationTypeCategory } from '@/entities/locationType';
import { LoadingSpinner } from '@/shared/ui';

// ── Dagre auto-layout ─────────────────────────────────────────────────────────

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });
  nodes.forEach((n) => g.setNode(n.id, { width: 120, height: 80 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - 60, y: pos.y - 40 } };
    }),
    edges,
  };
}

// ── Edge mode ─────────────────────────────────────────────────────────────────

type EdgeMode = 'containment' | 'connection';

// ── Category options ──────────────────────────────────────────────────────────

const CATEGORIES: { value: LocationTypeCategory; label: string }[] = [
  { value: 'world',      label: 'World-scale' },
  { value: 'geographic', label: 'Geographic' },
  { value: 'interior',   label: 'Interior' },
  { value: 'explorable', label: 'Explorable' },
  { value: 'linear',     label: 'Linear' },
];

const CONNECTION_TYPE_OPTIONS = [
  'road', 'path', 'river', 'sea_route', 'border', 'portal', 'tunnel', 'mountain_pass',
];

const inputCls = 'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls = 'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

const nodeTypes: NodeTypes = { locationTypeNode: LocationTypeNode };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LocationTypesPage() {
  useParams<{ campaignId: string }>();

  const { data: types,          isLoading: loadingTypes }   = useLocationTypes();
  const { data: containRules,   isLoading: loadingContain } = useContainmentRules();
  const { data: connectRules,   isLoading: loadingConnect } = useConnectionRules();

  const saveType          = useSaveLocationType();
  const deleteType        = useDeleteLocationType();
  const saveContain       = useSaveContainmentRule();
  const deleteContain     = useDeleteContainmentRule();
  const saveConnect       = useSaveConnectionRule();
  const deleteConnect     = useDeleteConnectionRule();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [edgeMode, setEdgeMode]             = useState<EdgeMode>('containment');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Edit type panel
  const [editEntry, setEditEntry] = useState<LocationTypeEntry | null>(null);
  const [editName, setEditName]   = useState('');
  const [editIcon, setEditIcon]   = useState('');
  const [editCat, setEditCat]     = useState<LocationTypeCategory>('geographic');

  // New type form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName]         = useState('');
  const [newIcon, setNewIcon]         = useState('place');
  const [newCat, setNewCat]           = useState<LocationTypeCategory>('geographic');

  // Selected edge connection type toggles
  const [edgeConnTypes, setEdgeConnTypes] = useState<string[]>([]);

  // ── Build nodes & edges from data ──────────────────────────────────────────

  const rawNodes: Node[] = useMemo(() => {
    if (!types) return [];
    return types.map((t) => ({
      id: t.id,
      type: 'locationTypeNode',
      position: { x: 0, y: 0 },
      data: { entry: t, selected: t.id === selectedNodeId } satisfies LocationTypeNodeData,
    }));
  }, [types, selectedNodeId]);

  const rawEdges: Edge[] = useMemo(() => {
    const result: Edge[] = [];
    if (edgeMode === 'containment' && containRules) {
      containRules.forEach((r) => {
        result.push({
          id: `c-${r.id}`,
          source: r.parentTypeId,
          target: r.childTypeId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#6b7280' },
          style: { stroke: '#6b7280', strokeWidth: 1.5 },
          label: '',
          data: { ruleId: r.id, mode: 'containment' },
        });
      });
    }
    if (edgeMode === 'connection' && connectRules) {
      connectRules.forEach((r) => {
        result.push({
          id: `cn-${r.id}`,
          source: r.typeAId,
          target: r.typeBId,
          type: 'straight',
          animated: true,
          style: { stroke: '#f2ca50', strokeWidth: 1.5, strokeDasharray: '5 3' },
          label: r.allowedConnectionTypes.slice(0, 2).join(', ') + (r.allowedConnectionTypes.length > 2 ? '…' : ''),
          labelStyle: { fill: '#d0c5af', fontSize: 9 },
          labelBgStyle: { fill: '#1a1b20', fillOpacity: 0.85 },
          data: { ruleId: r.id, mode: 'connection', allowedConnectionTypes: r.allowedConnectionTypes },
        });
      });
    }
    return result;
  }, [edgeMode, containRules, connectRules]);

  // Apply dagre layout when data changes
  useEffect(() => {
    if (rawNodes.length === 0) return;
    const { nodes: ln, edges: le } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(ln);
    setEdges(le);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes.length, edgeMode]);

  // Keep edge data in sync without re-layouting
  useEffect(() => {
    setEdges(rawEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containRules, connectRules, edgeMode]);

  // ── Interaction handlers ───────────────────────────────────────────────────

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedEdgeId(null);
    const id = node.id;
    setSelectedNodeId((prev) => (prev === id ? null : id));
    const entry = types?.find((t) => t.id === id);
    if (entry) {
      setEditEntry(entry);
      setEditName(entry.name);
      setEditIcon(entry.icon);
      setEditCat(entry.category);
    }
  }, [types]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedNodeId(null);
    setEditEntry(null);
    setSelectedEdgeId(edge.id);
    const ct = (edge.data as { allowedConnectionTypes?: string[] })?.allowedConnectionTypes ?? [];
    setEdgeConnTypes(ct);
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (edgeMode === 'containment') {
      // Check duplicate
      const exists = containRules?.some(
        (r) => r.parentTypeId === connection.source && r.childTypeId === connection.target
      );
      if (exists) return;
      saveContain.mutate({ id: `cr-${id}`, parentTypeId: connection.source, childTypeId: connection.target });
    } else {
      const exists = connectRules?.some(
        (r) =>
          (r.typeAId === connection.source && r.typeBId === connection.target) ||
          (r.typeAId === connection.target && r.typeBId === connection.source)
      );
      if (exists) return;
      saveConnect.mutate({ id: `cnr-${id}`, typeAId: connection.source, typeBId: connection.target, allowedConnectionTypes: ['road', 'path'] });
    }
    setEdges((eds) => addEdge(connection, eds));
  }, [edgeMode, containRules, connectRules, saveContain, saveConnect, setEdges]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    const edge = edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return;
    const ruleId = (edge.data as { ruleId: string })?.ruleId;
    if (edge.data && (edge.data as { mode: string }).mode === 'containment') {
      deleteContain.mutate(ruleId);
    } else {
      deleteConnect.mutate(ruleId);
    }
    setSelectedEdgeId(null);
  }, [selectedEdgeId, edges, deleteContain, deleteConnect]);

  const saveEdgeConnTypes = useCallback(() => {
    if (!selectedEdgeId) return;
    const edge = edges.find((e) => e.id === selectedEdgeId);
    if (!edge) return;
    const ruleId = (edge.data as { ruleId: string })?.ruleId;
    const rule = connectRules?.find((r) => r.id === ruleId);
    if (!rule) return;
    saveConnect.mutate({ ...rule, allowedConnectionTypes: edgeConnTypes });
  }, [selectedEdgeId, edges, connectRules, edgeConnTypes, saveConnect]);

  const handleSaveType = useCallback(() => {
    if (!editEntry || !editName.trim()) return;
    saveType.mutate({ ...editEntry, name: editName.trim(), icon: editIcon.trim() || editEntry.icon, category: editCat });
  }, [editEntry, editName, editIcon, editCat, saveType]);

  const handleDeleteType = useCallback(() => {
    if (!editEntry || editEntry.builtin) return;
    deleteType.mutate(editEntry.id);
    setSelectedNodeId(null);
    setEditEntry(null);
  }, [editEntry, deleteType]);

  const handleCreateType = useCallback(() => {
    if (!newName.trim()) return;
    const id = `lt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    saveType.mutate({
      id,
      name: newName.trim(),
      icon: newIcon.trim() || 'place',
      category: newCat,
      biomeOptions: [],
      isSettlement: false,
      createdAt: new Date().toISOString(),
    });
    setNewName('');
    setNewIcon('place');
    setShowNewForm(false);
  }, [newName, newIcon, newCat, saveType]);

  const applyLayout = useCallback(() => {
    const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges);
    setNodes(ln);
    setEdges(le);
  }, [nodes, edges, setNodes, setEdges]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const isLoading = loadingTypes || loadingContain || loadingConnect;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) return <LoadingSpinner as="main" text="Loading location types…" />;

  return (
    <main className="flex-1 min-h-screen bg-surface flex flex-col">

      {/* Header */}
      <div className="px-10 pt-8 pb-4 flex items-end justify-between flex-shrink-0">
        <div>
          <span className="text-[10px] font-label uppercase tracking-widest text-primary block mb-1">
            World Configuration
          </span>
          <h1 className="font-headline text-3xl font-bold text-on-surface">Location Types</h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
            Define what types of locations exist and which can contain or connect to each other.
            Drag between nodes to create rules. Click a node or edge to edit or delete it.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Type
        </button>
      </div>

      {/* New type form */}
      {showNewForm && (
        <div className="mx-10 mb-4 p-5 bg-surface-container-low border border-outline-variant/20 rounded-sm flex items-end gap-4 flex-shrink-0">
          <div className="flex-1">
            <label className={labelCls}>Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Dungeon Complex" className={inputCls} autoFocus />
          </div>
          <div className="w-36">
            <label className={labelCls}>Icon</label>
            <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="material icon" className={inputCls} />
          </div>
          <div className="w-44">
            <label className={labelCls}>Category</label>
            <select value={newCat} onChange={(e) => setNewCat(e.target.value as LocationTypeCategory)}
              className={inputCls + ' cursor-pointer'}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <button onClick={handleCreateType} disabled={!newName.trim()}
            className="px-5 py-2 bg-primary text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90">
            Create
          </button>
          <button onClick={() => setShowNewForm(false)}
            className="px-4 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Graph + side panel */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* React Flow canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); setEditEntry(null); }}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            colorMode="dark"
            defaultEdgeOptions={{ animated: edgeMode === 'connection' }}
          >
            <Background color="#2a2b30" gap={20} />
            <Controls className="!bg-surface-container !border-outline-variant/20 !rounded-sm" />
            <MiniMap
              nodeColor={(n) => {
                const entry = types?.find((t) => t.id === n.id);
                const map: Record<string, string> = { world: '#3b82f6', geographic: '#10b981', interior: '#f59e0b', explorable: '#f43f5e', linear: '#8b5cf6' };
                return map[entry?.category ?? 'geographic'] ?? '#6b7280';
              }}
              className="!bg-surface-container !border-outline-variant/20 !rounded-sm"
            />

            {/* Mode toggle + layout button */}
            <Panel position="top-left" className="flex items-center gap-2">
              {(['containment', 'connection'] as EdgeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setEdgeMode(mode); setSelectedEdgeId(null); }}
                  className={`px-3 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
                    edgeMode === mode
                      ? 'bg-primary/10 border-primary/50 text-primary'
                      : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-primary/30'
                  }`}
                >
                  {mode === 'containment'
                    ? <><span className="material-symbols-outlined text-[12px] align-middle mr-1">account_tree</span>Containment</>
                    : <><span className="material-symbols-outlined text-[12px] align-middle mr-1">hub</span>Connections</>
                  }
                </button>
              ))}
              <button onClick={applyLayout}
                className="px-3 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm border bg-surface-container border-outline-variant/20 text-on-surface-variant hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-[12px] align-middle mr-1">auto_fix_high</span>
                Auto-layout
              </button>
            </Panel>

            {/* Legend */}
            <Panel position="bottom-left">
              <div className="flex flex-col gap-1 bg-surface-container/80 border border-outline-variant/20 rounded-sm p-3 text-[10px] font-label uppercase tracking-widest">
                {[
                  { color: 'bg-blue-400',    label: 'World-scale' },
                  { color: 'bg-emerald-400', label: 'Geographic' },
                  { color: 'bg-amber-400',   label: 'Interior' },
                  { color: 'bg-rose-400',    label: 'Explorable' },
                  { color: 'bg-violet-400',  label: 'Linear' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2 text-on-surface-variant/70">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                    {label}
                  </div>
                ))}
                <div className="border-t border-outline-variant/10 mt-1 pt-1 text-on-surface-variant/40">
                  {edgeMode === 'containment'
                    ? '→ Solid: can contain'
                    : '╌ Dashed: can connect'}
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Side panel — node editor */}
        {editEntry && (
          <div className="w-72 flex-shrink-0 bg-surface-container-low border-l border-outline-variant/15 flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-primary mb-0.5">Edit Type</p>
                <h3 className="font-headline text-lg font-bold text-on-surface">{editEntry.name}</h3>
              </div>
              <button onClick={() => { setEditEntry(null); setSelectedNodeId(null); }}
                className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Icon <span className="normal-case text-on-surface-variant/40">(material symbol)</span></label>
                <div className="flex items-center gap-3">
                  <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} className={inputCls} placeholder={editEntry.icon} />
                  <span className="material-symbols-outlined text-on-surface-variant/60 flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    {editIcon || editEntry.icon}
                  </span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} onClick={() => setEditCat(c.value)}
                      className={`px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
                        editCat === c.value
                          ? 'bg-primary/10 border-primary/50 text-primary'
                          : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/30'
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {editEntry.builtin && (
                <p className="text-[10px] text-on-surface-variant/30 italic">Built-in types cannot be deleted.</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10 flex gap-2">
              <button onClick={handleSaveType} disabled={!editName.trim() || saveType.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity hover:opacity-90">
                <span className="material-symbols-outlined text-sm">save</span>
                Save
              </button>
              {!editEntry.builtin && (
                <button onClick={handleDeleteType}
                  className="px-3 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-label uppercase tracking-widest rounded-sm transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Side panel — edge editor */}
        {selectedEdge && !editEntry && (
          <div className="w-72 flex-shrink-0 bg-surface-container-low border-l border-outline-variant/15 flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-primary mb-0.5">
                  {edgeMode === 'containment' ? 'Containment Rule' : 'Connection Rule'}
                </p>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  {types?.find((t) => t.id === selectedEdge.source)?.name}
                  <span className="text-on-surface-variant/40 mx-1">→</span>
                  {types?.find((t) => t.id === selectedEdge.target)?.name}
                </h3>
              </div>
              <button onClick={() => setSelectedEdgeId(null)}
                className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {edgeMode === 'containment' ? (
                <p className="text-sm text-on-surface-variant/70">
                  <span className="text-on-surface font-medium">{types?.find((t) => t.id === selectedEdge.source)?.name}</span>
                  {' '}can contain{' '}
                  <span className="text-on-surface font-medium">{types?.find((t) => t.id === selectedEdge.target)?.name}</span>.
                </p>
              ) : (
                <>
                  <p className="text-sm text-on-surface-variant/70 mb-2">Allowed connection types for this pair:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CONNECTION_TYPE_OPTIONS.map((ct) => {
                      const active = edgeConnTypes.includes(ct);
                      return (
                        <button key={ct} onClick={() => setEdgeConnTypes((prev) =>
                          active ? prev.filter((x) => x !== ct) : [...prev, ct]
                        )}
                          className={`px-2.5 py-1 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
                            active
                              ? 'bg-primary/10 border-primary/50 text-primary'
                              : 'border-outline-variant/20 text-on-surface-variant hover:border-primary/30'
                          }`}>
                          {ct}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/10 flex gap-2">
              {edgeMode === 'connection' && (
                <button onClick={saveEdgeConnTypes} disabled={saveConnect.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity">
                  <span className="material-symbols-outlined text-sm">save</span>
                  Save
                </button>
              )}
              <button onClick={deleteSelectedEdge}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-label uppercase tracking-widest rounded-sm transition-colors">
                <span className="material-symbols-outlined text-sm">delete</span>
                Remove Rule
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
