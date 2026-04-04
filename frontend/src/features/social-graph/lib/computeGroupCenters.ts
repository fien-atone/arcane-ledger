/**
 * Distribute group cluster centers evenly around a circle.
 * Returns a map of groupId -> { cx, cy }.
 */
export function computeGroupCenters(
  groupIds: string[],
  viewportWidth: number,
  viewportHeight: number,
): Map<string, { cx: number; cy: number }> {
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const radius = Math.min(viewportWidth, viewportHeight) * 0.3;
  const result = new Map<string, { cx: number; cy: number }>();

  if (groupIds.length === 0) return result;

  if (groupIds.length === 1) {
    result.set(groupIds[0], { cx: centerX, cy: centerY });
    return result;
  }

  groupIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / groupIds.length - Math.PI / 2;
    result.set(id, {
      cx: centerX + radius * Math.cos(angle),
      cy: centerY + radius * Math.sin(angle),
    });
  });

  return result;
}
