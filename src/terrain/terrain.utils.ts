import { Rectangle, TilingScheme } from 'cesium';

import { TileRange } from '@/terrain/terrain.types.js';

/**
 * Calculates a bounding rectangle that encompasses all the specified tile ranges.
 * @param tilingScheme The tiling scheme to use for calculation.
 * @param from Tile ranges to calculate from.
 */
function computeRectangle(
  tilingScheme: TilingScheme,
  from: Map<number, TileRange>,
): Rectangle {
  if (from.size === 0) return new Rectangle();

  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  const levels = Array.from(from.keys());
  const minimumLevel = Math.min(...levels);
  const tileRange = from.get(minimumLevel);

  if (tileRange) {
    const { start, end } = tileRange;

    const startRect = tilingScheme.tileXYToRectangle(
      start.x,
      start.y,
      minimumLevel,
    );

    const endRect = tilingScheme.tileXYToRectangle(end.x, end.y, minimumLevel);

    west = Math.min(startRect.west, west);
    south = Math.min(endRect.south, south);
    east = Math.max(endRect.east, east);
    north = Math.max(startRect.north, north);
  }

  return new Rectangle(west, south, east, north);
}

export { computeRectangle };
