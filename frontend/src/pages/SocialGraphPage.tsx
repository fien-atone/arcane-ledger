import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNpcs } from '@/features/npcs/api/queries';
import { useGroups } from '@/features/groups/api';
import { useGroupTypes } from '@/features/groupTypes/api/queries';
import { useRelationsForCampaign } from '@/features/relations/api/queries';
import { useGraphSimulation } from '@/features/social-graph/lib/useGraphSimulation';
import { useGraphZoom } from '@/features/social-graph/lib/useGraphZoom';
import { GraphNodeComponent } from '@/features/social-graph/ui/GraphNode';
import { GraphEdgeComponent } from '@/features/social-graph/ui/GraphEdge';
import { GraphGroupHull } from '@/features/social-graph/ui/GraphGroupHull';
import { GraphTooltip } from '@/features/social-graph/ui/GraphTooltip';
import { GraphControls } from '@/features/social-graph/ui/GraphControls';
import { GraphFilters } from '@/features/social-graph/ui/GraphFilters';
import { GraphLegend } from '@/features/social-graph/ui/GraphLegend';
import { ChordView } from '@/features/social-graph/ui/ChordView';
import { EmptyState } from '@/shared/ui';
import type { NpcStatus } from '@/entities/npc';
import type { GraphEdge as GraphEdgeType } from '@/features/social-graph/lib/graphTypes';

type ViewMode = 'force' | 'chord';

export default function SocialGraphPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: npcs, isLoading: npcsLoading } = useNpcs(campaignId ?? '');
  const { data: groups } = useGroups(campaignId ?? '');
  const { data: groupTypes } = useGroupTypes(campaignId ?? '');
  const { data: relations } = useRelationsForCampaign(campaignId ?? '');

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('force');

  // Filters
  const [statusFilters, setStatusFilters] = useState<Set<NpcStatus>>(new Set(['alive', 'unknown']));
  const [groupFilters, setGroupFilters] = useState<Set<string> | null>(null);

  // Initialize group filters when groups data loads
  const allGroupIds = useMemo(
    () => (groups ?? []).map((g) => g.id),
    [groups],
  );
  useEffect(() => {
    if (groups && groupFilters === null) {
      setGroupFilters(new Set(allGroupIds));
    }
  }, [groups, groupFilters, allGroupIds]);

  const activeGroupFilters = groupFilters ?? new Set(allGroupIds);
  // Hover state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipEdge, setTooltipEdge] = useState<{
    edge: GraphEdgeType;
    x: number;
    y: number;
  } | null>(null);

  // Layout key — increment to force re-layout
  const [layoutKey, setLayoutKey] = useState(0);

  // Container size
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        setDimensions((prev) => (prev.width === w && prev.height === h) ? prev : { width: w, height: h });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Filter NPCs by status
  const filteredNpcs = useMemo(
    () => (npcs ?? []).filter((n) => statusFilters.has(n.status)),
    [npcs, statusFilters],
  );

  const filteredGroups = useMemo(
    () => (groups ?? []).filter((g) => activeGroupFilters.has(g.id)),
    [groups, activeGroupFilters],
  );

  const filteredRelations = relations ?? [];

  // Run simulation
  const { nodes, edges, groups: graphGroups } = useGraphSimulation(
    filteredNpcs,
    filteredGroups,
    filteredRelations,
    dimensions.width,
    dimensions.height,
    layoutKey,
  );

  // SVG refs for zoom
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const { zoomIn, zoomOut, fitToView } = useGraphZoom({
    svgRef,
    gRef,
    key: viewMode,
  });

  // Auto-fit when switching to force view or on initial load
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  useEffect(() => {
    if (viewMode === 'force') {
      const timer = setTimeout(() => {
        if (nodesRef.current.length > 0) fitToView(nodesRef.current);
      }, 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, layoutKey]);

  // Node lookup
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  // Edges connected to hovered node
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>([hoveredNodeId]);
    for (const edge of edges) {
      if (edge.sourceId === hoveredNodeId) ids.add(edge.targetId);
      if (edge.targetId === hoveredNodeId) ids.add(edge.sourceId);
    }
    return ids;
  }, [hoveredNodeId, edges]);

  const connectedEdgeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>();
    for (const edge of edges) {
      if (edge.sourceId === hoveredNodeId || edge.targetId === hoveredNodeId) {
        ids.add(edge.id);
      }
    }
    return ids;
  }, [hoveredNodeId, edges]);

  // Handlers
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      navigate(`/campaigns/${campaignId}/npcs/${nodeId}`);
    },
    [navigate, campaignId],
  );

  const handleEdgeHover = useCallback(
    (e: React.MouseEvent, edge: GraphEdgeType) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setTooltipEdge({
        edge,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleEdgeLeave = useCallback(() => {
    setTooltipEdge(null);
  }, []);

  const toggleStatus = useCallback((status: NpcStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        // Don't allow removing all statuses
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setGroupFilters((prev) => {
      const current = prev ?? new Set(allGroupIds);
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, [allGroupIds]);

  const handleResetLayout = useCallback(() => {
    setLayoutKey((k) => k + 1);
  }, []);

  const handleFitToView = useCallback(() => {
    fitToView(nodes);
  }, [fitToView, nodes]);

  const isLoading = npcsLoading;
  const isEmpty = !isLoading && (npcs ?? []).length === 0;

  return (
    <main className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Social Graph
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Relationships between NPCs visualized.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-surface-container rounded-sm border border-outline-variant/20 overflow-hidden">
              <Link
                to={`/campaigns/${campaignId}/npcs`}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                title="List view"
              >
                <span className="material-symbols-outlined text-[20px]">list</span>
              </Link>
              <button
                className="p-2 bg-primary/15 text-primary"
                title="Graph view"
                disabled
              >
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading...
        </div>
      )}

      {isEmpty && (
        <EmptyState
          icon="group_off"
          title="No NPCs yet."
          subtitle="Create some NPCs first, then come back to see their social web."
        />
      )}

      {!isLoading && !isEmpty && (
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {viewMode === 'chord' ? (
            <ChordView
              npcs={filteredNpcs}
              groups={filteredGroups}
              relations={filteredRelations}
              width={dimensions.width}
              height={dimensions.height}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <>
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="w-full h-full"
                style={{ background: '#12121c' }}
              >
                {/* Subtle grid pattern */}
                <defs>
                  <pattern
                    id="graph-grid"
                    width={40}
                    height={40}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#1e1e2e"
                      strokeWidth={0.5}
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#graph-grid)" />

                <g ref={gRef}>
                  {/* Group hulls (render behind everything) */}
                  {graphGroups.map((group) => (
                    <GraphGroupHull
                      key={group.id}
                      group={group}
                      nodes={nodes}
                      dimmed={!!hoveredNodeId && !group.memberNodeIds.some((id) => connectedNodeIds.has(id))}
                    />
                  ))}

                  {/* Edges */}
                  {edges.map((edge) => {
                    const src = nodeMap.get(edge.sourceId);
                    const tgt = nodeMap.get(edge.targetId);
                    if (!src || !tgt) return null;
                    return (
                      <GraphEdgeComponent
                        key={edge.id}
                        edge={edge}
                        sourceNode={src}
                        targetNode={tgt}
                        dimmed={!!hoveredNodeId && !connectedEdgeIds.has(edge.id)}
                        highlighted={hoveredNodeId ? connectedEdgeIds.has(edge.id) : false}
                        onMouseEnter={handleEdgeHover}
                        onMouseLeave={handleEdgeLeave}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => (
                    <GraphNodeComponent
                      key={node.id}
                      node={node}
                      dimmed={!!hoveredNodeId && !connectedNodeIds.has(node.id)}
                      highlighted={hoveredNodeId === node.id}
                      onMouseEnter={setHoveredNodeId}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={handleNodeClick}
                    />
                  ))}
                </g>
              </svg>

              {/* Tooltip */}
              {tooltipEdge && (
                <GraphTooltip
                  edge={tooltipEdge.edge}
                  sourceNode={nodeMap.get(tooltipEdge.edge.sourceId)!}
                  targetNode={nodeMap.get(tooltipEdge.edge.targetId)!}
                  x={tooltipEdge.x}
                  y={tooltipEdge.y}
                />
              )}
            </>
          )}

          {/* View mode toggle */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex bg-surface-container rounded-sm border border-outline-variant/20 overflow-hidden shadow-lg">
            <button
              onClick={() => setViewMode('force')}
              title="Force graph"
              className={`p-2 transition-colors ${
                viewMode === 'force'
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </button>
            <button
              onClick={() => setViewMode('chord')}
              title="Chord diagram"
              className={`p-2 transition-colors ${
                viewMode === 'chord'
                  ? 'bg-primary/15 text-primary'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">donut_large</span>
            </button>
          </div>

          {/* Controls */}
          {viewMode === 'force' && (
            <GraphControls
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFitToView={handleFitToView}
              onResetLayout={handleResetLayout}
            />
          )}

          {/* Filters */}
          <GraphFilters
            statusFilters={statusFilters}
            onToggleStatus={toggleStatus}
            groups={groups ?? []}
            groupFilters={activeGroupFilters}
            onToggleGroup={toggleGroup}
            groupColorMap={new Map(graphGroups.map((g) => [g.id, g.colorIndex]))}
            groupTypes={groupTypes ?? []}
          />

          {/* Legend */}
          <GraphLegend />
        </div>
      )}
    </main>
  );
}
