import { useEffect, useRef, useCallback } from 'react';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';

interface UseGraphZoomOptions {
  svgRef: React.RefObject<SVGSVGElement | null>;
  gRef: React.RefObject<SVGGElement | null>;
  onTransformChange?: (transform: ZoomTransform) => void;
  /** Change this value to force re-initialization of zoom (e.g. after SVG remount) */
  key?: number | string;
}

export function useGraphZoom({ svgRef, gRef, onTransformChange, key }: UseGraphZoomOptions) {
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        select(g).attr('transform', event.transform.toString());
        onTransformChange?.(event.transform);
      });

    select(svg).call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      select(svg).on('.zoom', null);
    };
  }, [svgRef, gRef, onTransformChange, key]);

  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svg || !zb) return;
    select(svg).transition().duration(300).call(zb.scaleBy as any, 1.25);
  }, [svgRef]);

  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svg || !zb) return;
    select(svg).transition().duration(300).call(zb.scaleBy as any, 0.8);
  }, [svgRef]);

  const fitToView = useCallback(
    (nodes: { x: number; y: number }[]) => {
      const svg = svgRef.current;
      const zb = zoomBehaviorRef.current;
      if (!svg || !zb || nodes.length === 0) return;

      const svgRect = svg.getBoundingClientRect();
      const padding = 80;

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const n of nodes) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      }

      const graphWidth = maxX - minX + padding * 2;
      const graphHeight = maxY - minY + padding * 2;

      const scale = Math.min(
        svgRect.width / graphWidth,
        svgRect.height / graphHeight,
        2,
      );

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      const transform = zoomIdentity
        .translate(svgRect.width / 2, svgRect.height / 2)
        .scale(scale)
        .translate(-cx, -cy);

      select(svg).transition().duration(500).call(zb.transform as any, transform);
    },
    [svgRef],
  );

  return { zoomIn, zoomOut, fitToView };
}
