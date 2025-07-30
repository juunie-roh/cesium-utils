import type {
  Credit,
  Request,
  TerrainData,
  TerrainProvider,
  TileAvailability,
  TilingScheme,
} from "cesium";
import { EllipsoidTerrainProvider, Rectangle } from "cesium";

import Deprecate from "@/dev/deprecation.js";

/**
 * @class
 * Provides terrain by delegating requests to different terrain providers
 * based on geographic regions and zoom levels. This allows combining
 * multiple terrain sources into a single seamless terrain.
 *
 * @example
 * ``` typescript
 * // Simple rectangle-based regions
 * const hybridTerrain = new HybridTerrainProvider({
 *   regions: [
 *     {
 *       provider: customProvider,
 *       bounds: Rectangle.fromDegrees(-120, 30, -100, 50),
 *       levels: [10, 15] // optional
 *     }
 *   ],
 *   defaultProvider: worldTerrain
 * });
 *
 * // Or tile-coordinate based for precise control (multiple levels)
 * const tileRanges = new Map();
 * tileRanges.set(15, { x: [55852, 55871], y: [9556, 9575] });
 * tileRanges.set(16, { x: [111704, 111742], y: [19112, 19150] });
 *
 * const hybridTerrain = new HybridTerrainProvider({
 *   regions: [
 *     {
 *       provider: customProvider,
 *       tiles: tileRanges
 *     }
 *   ],
 *   defaultProvider: worldTerrain
 * });
 *
 * viewer.terrainProvider = hybridTerrain;
 * ```
 */
class HybridTerrainProvider implements TerrainProvider {
  private _regions: HybridTerrainProvider.TerrainRegion[];
  private _defaultProvider: TerrainProvider;
  private _fallbackProvider: TerrainProvider;
  private _tilingScheme: TilingScheme;
  private _ready: boolean = false;
  private _availability?: TileAvailability;

  /**
   * Creates a new `HybridTerrainProvider` instance.
   * @param options {@link HybridTerrainProvider.ConstructorOptions}
   * @returns A new `HybridTerrainProvider` instance.
   */
  constructor(options: HybridTerrainProvider.ConstructorOptions) {
    this._defaultProvider = options.defaultProvider;
    this._fallbackProvider =
      options.fallbackProvider || new EllipsoidTerrainProvider();
    this._tilingScheme = options.defaultProvider.tilingScheme;
    this._regions = options.regions || [];
    this._availability = options.defaultProvider.availability;
    this._ready = true;
  }

  /**
   * Gets a value indicating whether or not the provider is ready for use,
   * or a promise that resolves when the provider becomes ready.
   */
  get ready(): boolean {
    return this._ready;
  }

  /**
   * Gets the tiling scheme used by this provider.
   */
  get tilingScheme(): TilingScheme {
    return this._tilingScheme;
  }
  /**
   * Gets an object that can be used to determine availability of terrain from this provider.
   */
  get availability(): TileAvailability | undefined {
    return this._availability;
  }
  /**
   * Gets the list of terrain regions managed by this provider.
   */
  get regions(): readonly HybridTerrainProvider.TerrainRegion[] {
    return [...this._regions];
  }
  /**
   * Gets the default terrain provider.
   */
  get defaultProvider(): TerrainProvider {
    return this._defaultProvider;
  }
  /**
   * Gets the fallback terrain provider.
   */
  get fallbackProvider(): TerrainProvider {
    return this._fallbackProvider;
  }

  /**
   * Gets the credit to display when this terrain provider is active.  Typically this is used to credit
   * the source of the terrain.
   */
  get credit(): Credit {
    return this._defaultProvider?.credit;
  }
  /**
   * Gets an event that is raised when the terrain provider encounters an asynchronous error.  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of `TileProviderError`.
   */
  get errorEvent(): any {
    return this._defaultProvider.errorEvent;
  }
  /**
   * Gets a value indicating whether or not the provider includes a water mask.  The water mask
   * indicates which areas of the globe are water rather than land, so they can be rendered
   * as a reflective surface with animated waves.
   */
  get hasWaterMask(): boolean {
    return this._defaultProvider.hasWaterMask;
  }
  /** Gets a value indicating whether or not the requested tiles include vertex normals. */
  get hasVertexNormals(): boolean {
    return this._defaultProvider.hasVertexNormals;
  }
  /**
   * Makes sure we load availability data for a tile
   * @param x - The X coordinate of the tile for which to request geometry.
   * @param y - The Y coordinate of the tile for which to request geometry.
   * @param level - The level of the tile for which to request geometry.
   * @returns Undefined if nothing need to be loaded or a Promise that resolves when all required tiles are loaded
   */
  loadTileDataAvailability(
    x: number,
    y: number,
    level: number,
  ): Promise<void> | undefined {
    return this._defaultProvider.loadTileDataAvailability(x, y, level);
  }
  /**
   * Gets the maximum geometric error allowed in a tile at a given level.
   * @param level - The tile level for which to get the maximum geometric error.
   * @returns The maximum geometric error.
   */
  getLevelMaximumGeometricError(level: number): number {
    return this._defaultProvider.getLevelMaximumGeometricError(level);
  }

  /**
   * Requests the terrain for a given tile coordinate.
   * @param x The X coordinate of the tile.
   * @param y The Y coordinate of the tile.
   * @param level The zoom level of the tile.
   * @param request The request.
   * @returns A promise for the requested terrain.
   */
  requestTileGeometry(
    x: number,
    y: number,
    level: number,
    request?: Request,
  ): Promise<Awaited<TerrainData>> | undefined {
    if (!this._ready) return undefined;

    // Check regions for a match
    for (const region of this._regions) {
      if (this._regionContains(region, x, y, level)) {
        return region.provider.requestTileGeometry(x, y, level, request);
      }
    }

    // Fall back to default provider
    if (this._defaultProvider.getTileDataAvailable(x, y, level)) {
      return this._defaultProvider.requestTileGeometry(x, y, level, request);
    }

    // Final fallback
    return this._fallbackProvider.requestTileGeometry(x, y, level, request);
  }

  /**
   * Determines whether data for a tile is available to be loaded. Checks the specified terrain regions first.
   * @param x - The X coordinate of the tile for which to request geometry.
   * @param y - The Y coordinate of the tile for which to request geometry.
   * @param level - The level of the tile for which to request geometry.
   * @returns Undefined if not supported by the terrain provider, otherwise true or false.
   */
  getTileDataAvailable(
    x: number,
    y: number,
    level: number,
  ): boolean | undefined {
    // First check if any terrain region contains this tile
    for (const region of this._regions) {
      if (this._regionContains(region, x, y, level)) {
        return region.provider.getTileDataAvailable(x, y, level);
      }
    }

    // Fall back to default provider
    return this._defaultProvider.getTileDataAvailable(x, y, level);
  }

  /**
   * Checks if a terrain region contains the specified tile.
   * @private
   */
  private _regionContains(
    region: HybridTerrainProvider.TerrainRegion,
    x: number,
    y: number,
    level: number,
  ): boolean {
    // Check level constraints if specified
    if (region.levels && !region.levels.includes(level)) {
      return false;
    }

    // Tile-coordinate based bounds
    if (region.tiles) {
      const tileRange = region.tiles.get(level);
      if (!tileRange) return false;

      const [xMin, xMax] = Array.isArray(tileRange.x)
        ? tileRange.x
        : [tileRange.x, tileRange.x];
      const [yMin, yMax] = Array.isArray(tileRange.y)
        ? tileRange.y
        : [tileRange.y, tileRange.y];

      return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
    }

    // Rectangle-based bounds
    if (region.bounds) {
      const tileRectangle = this._tilingScheme.tileXYToRectangle(x, y, level);
      return Rectangle.intersection(tileRectangle, region.bounds) !== undefined;
    }

    return false;
  }
}

/**
 * @namespace
 * Contains types and factory methods for `HybridTerrainProvider` instance.
 */
namespace HybridTerrainProvider {
  /** Initialization options for `HybridTerrainProvider` constructor. */
  export interface ConstructorOptions {
    /** An array of terrain regions to include in the hybrid terrain. */
    regions?: TerrainRegion[];
    /** Default provider to use outside of specified terrain regions. */
    defaultProvider: TerrainProvider;
    /** Optional fallback provider when data is not available from default provider. @default EllipsoidTerrainProvider */
    fallbackProvider?: TerrainProvider;
  }

  /** Represents a terrain region with provider and geographic bounds. */
  export interface TerrainRegion {
    /** The terrain provider for this region. */
    provider: TerrainProvider;
    /** Rectangle-based geographic bounds (simpler). */
    bounds?: Rectangle;
    /**
     * Tile-coordinate based bounds (precise control).
     * Map of level to tile coordinate ranges for that level.
     */
    tiles?: Map<
      number,
      {
        /** X tile coordinate range [min, max] or single value. */
        x: number | [number, number];
        /** Y tile coordinate range [min, max] or single value. */
        y: number | [number, number];
      }
    >;
    /** Optional level constraints. If specified, region only applies to these levels. */
    levels?: number[];
  }

  /**
   * Creates a HybridTerrainProvider from rectangle-based regions.
   * @param regions Array of regions with rectangle bounds
   * @param defaultProvider Default terrain provider
   * @param fallbackProvider Optional fallback provider
   */
  export function fromRectangles(
    regions: Array<{
      provider: TerrainProvider;
      bounds: Rectangle;
      levels?: number[];
    }>,
    defaultProvider: TerrainProvider,
    fallbackProvider?: TerrainProvider,
  ): HybridTerrainProvider {
    return new HybridTerrainProvider({
      regions: regions.map((r) => ({ ...r })),
      defaultProvider,
      fallbackProvider,
    });
  }

  /**
   * Creates a HybridTerrainProvider from tile-coordinate based regions.
   * @param regions Array of regions with tile-coordinate bounds
   * @param defaultProvider Default terrain provider
   * @param fallbackProvider Optional fallback provider
   */
  export function fromTileRanges(
    regions: Array<{
      provider: TerrainProvider;
      tiles: Map<
        number,
        {
          x: number | [number, number];
          y: number | [number, number];
        }
      >;
      levels?: number[];
    }>,
    defaultProvider: TerrainProvider,
    fallbackProvider?: TerrainProvider,
  ): HybridTerrainProvider {
    return new HybridTerrainProvider({
      regions: regions.map((r) => ({ ...r })),
      defaultProvider,
      fallbackProvider,
    });
  }

  /**
   * @deprecated Use Rectangle.fromDegrees() instead. This method is maintained for backward compatibility.
   * Calculates a bounding rectangle that encompasses all the specified tile ranges.
   * @param tilingScheme The tiling scheme to use for calculation.
   * @param from Tile ranges to calculate from.
   */
  export function computeRectangle(
    tilingScheme: TilingScheme,
    from: Map<number, any>,
  ): Rectangle {
    Deprecate.warn(
      "computeRectangle() is deprecated. Use Rectangle.fromDegrees() instead.",
      { removeInVersion: "v0.3.0" },
    );

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

      const endRect = tilingScheme.tileXYToRectangle(
        end.x,
        end.y,
        minimumLevel,
      );

      west = Math.min(startRect.west, west);
      south = Math.min(endRect.south, south);
      east = Math.max(endRect.east, east);
      north = Math.max(startRect.north, north);
    }

    return new Rectangle(west, south, east, north);
  }
}

export default HybridTerrainProvider;
