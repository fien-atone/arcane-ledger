/**
 * SocialGraphViewSection — the graph render surface.
 *
 * Renders either the chord diagram or the force graph inside a resizable
 * container, with filters/controls/legend overlaid. All logic (state,
 * simulation, hover, handlers) comes from useSocialGraphPage so this file
 * is purely composition of the existing rendering primitives from
 * features/social-graph/ui/.
 *
 * Intentionally not unit-tested: it's a thin glue layer around d3 primitives
 * that jsdom cannot render meaningfully. See REFACTOR_PLAN.md.
 */
import { GraphNodeComponent } from '@/features/social-graph/ui/GraphNode';
import { GraphEdgeComponent } from '@/features/social-graph/ui/GraphEdge';
import { GraphGroupHull } from '@/features/social-graph/ui/GraphGroupHull';
import { GraphTooltip } from '@/features/social-graph/ui/GraphTooltip';
import { GraphControls } from '@/features/social-graph/ui/GraphControls';
import { GraphFilters } from '@/features/social-graph/ui/GraphFilters';
import { GraphLegend } from '@/features/social-graph/ui/GraphLegend';
import { ChordView } from '@/features/social-graph/ui/ChordView';
import type { UseSocialGraphPageResult } from '../hooks/useSocialGraphPage';

interface Props {
  state: UseSocialGraphPageResult;
}

export function SocialGraphViewSection({ state }: Props) {
  const {
    viewMode,
    containerRef,
    svgRef,
    gRef,
    dimensions,
    filteredNpcs,
    filteredGroups,
    filteredRelations,
    nodes,
    edges,
    graphGroups,
    nodeMap,
    hoveredNodeId,
    setHoveredNodeId,
    tooltipEdge,
    handleEdgeHover,
    handleEdgeLeave,
    connectedNodeIds,
    connectedEdgeIds,
    handleNodeClick,
    handleResetLayout,
    handleFitToView,
    zoomIn,
    zoomOut,
    statusFilters,
    toggleStatus,
    allGroups,
    activeGroupFilters,
    toggleGroup,
    groupTypes,
    groupsEnabled,
    groupTypesEnabled,
  } = state;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden mx-4 sm:mx-8 border border-outline-variant/20 rounded-sm bg-surface-container"
    >
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
                  dimmed={
                    !!hoveredNodeId &&
                    !group.memberNodeIds.some((id) =>
                      connectedNodeIds.has(id),
                    )
                  }
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
                    dimmed={
                      !!hoveredNodeId && !connectedEdgeIds.has(edge.id)
                    }
                    highlighted={
                      hoveredNodeId ? connectedEdgeIds.has(edge.id) : false
                    }
                    center={{
                      x: dimensions.width / 2,
                      y: dimensions.height / 2,
                    }}
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
                  dimmed={
                    !!hoveredNodeId && !connectedNodeIds.has(node.id)
                  }
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
        groups={groupsEnabled ? allGroups : []}
        groupFilters={activeGroupFilters}
        onToggleGroup={toggleGroup}
        groupColorMap={new Map(graphGroups.map((g) => [g.id, g.colorIndex]))}
        groupTypes={groupTypesEnabled ? groupTypes : []}
      />

      {/* Legend */}
      <GraphLegend />
    </div>
  );
}
