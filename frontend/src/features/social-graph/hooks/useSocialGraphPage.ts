/**
 * Page-level state, data, and derived values for SocialGraphPage (Tier 3).
 *
 * Loads:
 * - The campaign (for the back-link title + section flags)
 * - All NPCs for the campaign
 * - The party characters (rendered as virtual NPCs with a virtual "party" group)
 * - Groups, group types and relations for the campaign
 *
 * Owns the page-level UI state:
 * - viewMode (force | chord)
 * - statusFilters (Set<NpcStatus>) — status chips in the filter panel
 * - groupFilters (Set<string> | null) — null means "all groups selected"
 * - hoveredNodeId + tooltipEdge (force-graph hover state)
 * - layoutKey — bumped to re-run the force simulation
 * - container dimensions (tracked via ResizeObserver on containerRef)
 *
 * Derives:
 * - allEntities (NPCs + party as NPC-shaped nodes, with the virtual party group)
 * - filteredNpcs / filteredGroups / filteredRelations
 * - graph simulation output (nodes, edges, graphGroups)
 * - connectedNodeIds / connectedEdgeIds for hover highlight
 * - nodeMap, partyIds (for click routing)
 *
 * Also exposes SVG refs + the useGraphZoom zoom helpers so the view section
 * can render the force svg without re-creating any of this logic.
 *
 * The section widgets use this hook directly rather than threading ~20 props
 * from the page. This keeps the page file thin while preserving the single
 * source of truth for shared state (e.g. viewMode drives both the header
 * switcher and the view section).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNpcs } from '@/features/npcs/api/queries';
import { useParty } from '@/features/characters/api/queries';
import { useGroups } from '@/features/groups/api';
import { useGroupTypes } from '@/features/groupTypes/api/queries';
import { useRelationsForCampaign } from '@/features/relations/api/queries';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useGraphSimulation } from '@/features/social-graph/lib/useGraphSimulation';
import { useGraphZoom } from '@/features/social-graph/lib/useGraphZoom';
import type { NPC, NpcStatus } from '@/entities/npc';
import type { GraphEdge as GraphEdgeType } from '@/features/social-graph/lib/graphTypes';

export type ViewMode = 'force' | 'chord';
export const PARTY_GROUP_ID = '__party__';

export interface TooltipEdgeState {
  edge: GraphEdgeType;
  x: number;
  y: number;
}

export function useSocialGraphPage(campaignId: string) {
  const { t } = useTranslation('social');
  const navigate = useNavigate();

  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const socialGraphEnabled = useSectionEnabled(campaignId, 'social_graph');
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const groupsEnabled = useSectionEnabled(campaignId, 'groups');
  const groupTypesEnabled = useSectionEnabled(campaignId, 'group_types');

  const { data: campaign } = useCampaign(campaignId);
  const { data: npcs, isLoading: npcsLoading } = useNpcs(campaignId);
  const { data: party } = useParty(campaignId);
  const { data: groups } = useGroups(campaignId);
  const { data: groupTypes } = useGroupTypes(campaignId);
  const { data: relations } = useRelationsForCampaign(campaignId);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('chord');

  // Filters
  const [statusFilters, setStatusFilters] = useState<Set<NpcStatus>>(
    new Set(['alive', 'unknown']),
  );
  const [groupFilters, setGroupFilters] = useState<Set<string> | null>(null);

  // All group IDs (real + virtual party)
  const allGroupIds = useMemo(
    () => [
      ...(groups ?? []).map((g) => g.id),
      ...(party && party.length > 0 ? [PARTY_GROUP_ID] : []),
    ],
    [groups, party],
  );

  useEffect(() => {
    if (groups && party && groupFilters === null) {
      setGroupFilters(new Set(allGroupIds));
    }
  }, [groups, party, groupFilters, allGroupIds]);

  const activeGroupFilters = groupFilters ?? new Set(allGroupIds);

  // Hover state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipEdge, setTooltipEdge] = useState<TooltipEdgeState | null>(null);

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
        setDimensions((prev) =>
          prev.width === w && prev.height === h ? prev : { width: w, height: h },
        );
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
    // Re-attach when the container is (re)mounted (loading -> loaded transition).
  }, [npcsLoading, npcs]);

  // Virtual group for the party
  const partyGroup = useMemo(
    () => ({
      id: PARTY_GROUP_ID,
      campaignId,
      name: t('virtual_group_party'),
      type: '',
      aliases: [],
      description: '',
      createdAt: '',
      updatedAt: '',
    }),
    [campaignId, t],
  );

  // Convert party characters to NPC-like nodes with virtual group membership
  const partyAsNpcs = useMemo<NPC[]>(
    () =>
      !partyEnabled
        ? []
        : (party ?? []).map((c) => ({
            id: c.id,
            campaignId: c.campaignId,
            name: c.name,
            aliases: [],
            status: 'alive' as const,
            gender: c.gender,
            age: c.age,
            species: c.species,
            speciesId: c.speciesId,
            image: c.image,
            description: '',
            groupMemberships: [
              {
                npcId: c.id,
                groupId: PARTY_GROUP_ID,
                relation: 'Member',
              },
              ...(c.groupMemberships ?? []).map((m) => ({
                npcId: c.id,
                groupId: m.groupId,
                relation: m.relation,
                subfaction: m.subfaction,
              })),
            ],
            locationPresences: [],
            relations: [],
            createdAt: c.createdAt,
            updatedAt: c.updatedAt ?? c.createdAt,
          })),
    [party, partyEnabled],
  );

  // Merge NPCs + party, filter by status
  const allEntities = useMemo(
    () => [...(npcs ?? []), ...partyAsNpcs],
    [npcs, partyAsNpcs],
  );
  const filteredNpcs = useMemo(
    () => allEntities.filter((n) => statusFilters.has(n.status)),
    [allEntities, statusFilters],
  );

  // Include virtual party group + real groups
  const allGroups = useMemo(
    () => [
      ...(groups ?? []),
      ...(partyAsNpcs.length > 0 ? [partyGroup] : []),
    ],
    [groups, partyAsNpcs, partyGroup],
  );
  const filteredGroups = useMemo(
    () =>
      groupsEnabled
        ? allGroups.filter((g) => activeGroupFilters.has(g.id))
        : [],
    [allGroups, activeGroupFilters, groupsEnabled],
  );

  const filteredRelations = relations ?? [];

  // Run simulation
  const {
    nodes,
    edges,
    groups: graphGroups,
  } = useGraphSimulation(
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
      if (
        edge.sourceId === hoveredNodeId ||
        edge.targetId === hoveredNodeId
      ) {
        ids.add(edge.id);
      }
    }
    return ids;
  }, [hoveredNodeId, edges]);

  // Party id lookup (for click routing)
  const partyIds = useMemo(
    () => new Set((party ?? []).map((c) => c.id)),
    [party],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (partyIds.has(nodeId)) {
        navigate(`/campaigns/${campaignId}/characters/${nodeId}`);
      } else {
        navigate(`/campaigns/${campaignId}/npcs/${nodeId}`);
      }
    },
    [navigate, campaignId, partyIds],
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

  const toggleGroup = useCallback(
    (groupId: string) => {
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
    },
    [allGroupIds],
  );

  const handleResetLayout = useCallback(() => {
    setLayoutKey((k) => k + 1);
  }, []);

  const handleFitToView = useCallback(() => {
    fitToView(nodes);
  }, [fitToView, nodes]);

  const isLoading = npcsLoading;
  const isEmpty = !isLoading && (npcs ?? []).length === 0;

  return {
    // Flags / meta
    campaignId,
    campaignTitle: campaign?.title,
    npcsEnabled,
    socialGraphEnabled,
    partyEnabled,
    groupsEnabled,
    groupTypesEnabled,
    isLoading,
    isEmpty,

    // View mode
    viewMode,
    setViewMode,

    // Filters
    statusFilters,
    toggleStatus,
    activeGroupFilters,
    toggleGroup,
    allGroups,
    groupTypes: groupTypes ?? [],

    // Data
    filteredNpcs,
    filteredGroups,
    filteredRelations,

    // Simulation output
    nodes,
    edges,
    graphGroups,
    nodeMap,

    // Hover state
    hoveredNodeId,
    setHoveredNodeId,
    tooltipEdge,
    handleEdgeHover,
    handleEdgeLeave,
    connectedNodeIds,
    connectedEdgeIds,

    // Refs + dimensions
    containerRef,
    svgRef,
    gRef,
    dimensions,

    // Actions
    handleNodeClick,
    handleResetLayout,
    handleFitToView,
    zoomIn,
    zoomOut,
  };
}

export type UseSocialGraphPageResult = ReturnType<typeof useSocialGraphPage>;
