import {
  EllipsoidTerrainProvider,
  Request,
  TerrainData,
  TerrainProvider,
  TileAvailability,
  TilingScheme,
} from "cesium";

import { TerrainArea } from "./terrain-area.js";
import TerrainAreaCollection from "./terrain-area-collection.js";

/**
 * @class
 * Provides terrain by delegating requests to different terrain providers
 * based on geographic regions and zoom levels. This allows combining
 * multiple terrain sources into a single seamless terrain.
 *
 * @example
 * ``` typescript
 * // Set up tile ranges
 * const tileRanges = new Map<number, TileRange>;
 * tileRanges.set(15, { start: { x: 55852, y: 9556 }, end: { x: 55871, y: 9575 } });
 * // Set up tile areas
 * const area = new TerrainArea({ terrainProvider: provider, tileRanges });
 *
 * const hybridTerrain = new HybridTerrainProvider({
 *   terrainAreas: [area],
 *   terrainProvider: new EllipsoidTerrainProvider(),
 * });
 *
 * viewer.terrainProvider = hybridTerrain;
 * ```
 */
export class HybridTerrainProvider implements TerrainProvider {
  private _terrainAreas = new TerrainAreaCollection();
  private _terrainProvider: TerrainProvider;
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
    this._terrainProvider = options.terrainProvider;
    this._fallbackProvider =
      options.fallbackProvider || new EllipsoidTerrainProvider();
    this._tilingScheme = options.terrainProvider.tilingScheme;
    this._terrainAreas = new TerrainAreaCollection(...options.terrainAreas);
    this._availability = options.terrainProvider.availability;
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
   * Gets the list of terrain areas managed by this provider.
   */
  get terrainAreas(): readonly TerrainArea[] {
    return [...this._terrainAreas];
  }
  /**
   * Gets the default terrain provider.
   */
  get defaultProvider(): TerrainProvider {
    return this._terrainProvider;
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
  get credit(): any {
    return this._terrainProvider?.credit;
  }
  /**
   * Gets an event that is raised when the terrain provider encounters an asynchronous error.  By subscribing
   * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
   * are passed an instance of `TileProviderError`.
   */
  get errorEvent(): any {
    return this._terrainProvider.errorEvent;
  }
  /**
   * Gets a value indicating whether or not the provider includes a water mask.  The water mask
   * indicates which areas of the globe are water rather than land, so they can be rendered
   * as a reflective surface with animated waves.
   */
  get hasWaterMask(): boolean {
    return this._terrainProvider.hasWaterMask;
  }
  /** Gets a value indicating whether or not the requested tiles include vertex normals. */
  get hasVertexNormals(): boolean {
    return this._terrainProvider.hasVertexNormals;
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
    return this._terrainProvider.loadTileDataAvailability(x, y, level);
  }
  /**
   * Gets the maximum geometric error allowed in a tile at a given level.
   * @param level - The tile level for which to get the maximum geometric error.
   * @returns The maximum geometric error.
   */
  getLevelMaximumGeometricError(level: number): number {
    return this._terrainProvider.getLevelMaximumGeometricError(level);
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

    for (const area of this._terrainAreas) {
      if (area.contains(x, y, level)) {
        return area.requestTileGeometry(x, y, level, request);
      }
    }

    if (this._terrainProvider.getTileDataAvailable(x, y, level)) {
      return this._terrainProvider.requestTileGeometry(x, y, level, request);
    }

    return this._fallbackProvider.requestTileGeometry(x, y, level, request);
  }

  /**
   * Determines whether data for a tile is available to be loaded. Checks the specified terrain areas first.
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
    // First check if any terrain area contains this tile
    for (const area of this._terrainAreas) {
      if (area.contains(x, y, level)) {
        return area.getTileDataAvailable(x, y, level);
      }
    }

    // Don't force to true - let the provider determine actual availability
    return this._terrainProvider.getTileDataAvailable(x, y, level);
  }
}

/**
 * @namespace
 * Contains types and factory methods for creating `HybridTerrainProvider` instance.
 */
export namespace HybridTerrainProvider {
  /** Initialization options for `HybridTerrainProvider` constructor. */
  export interface ConstructorOptions {
    /** An array of terrain areas to include in the hybrid terrain. */
    terrainAreas: TerrainArea[];
    /** Default provider to use outside of specified terrain areas.  */
    terrainProvider: TerrainProvider;
    /** Optional fallback provider when data is not available from default provider. @default EllipsoidTerrainProvider */
    fallbackProvider?: TerrainProvider;
  }
}
