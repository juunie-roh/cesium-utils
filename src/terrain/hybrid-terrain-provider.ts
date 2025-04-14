import {
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  GeographicTilingScheme,
  Request,
  TerrainData,
  TerrainProvider,
  TileAvailability,
  TilingScheme,
} from 'cesium';

import { TileRanges } from './terrain.types.js';
import { TerrainArea } from './terrain-area.js';
import TerrainAreas from './terrain-areas.js';

/**
 * @class
 * Provides terrain by delegating requests to different terrain providers
 * based on geographic regions and zoom levels. This allows combining
 * multiple terrain sources into a single seamless terrain.
 *
 * @example
 * ``` typescript
 * const hybridTerrain = await HybridTerrainProvider.create({
 *   terrainAreas: [
 *     provider: 'custom-terrain-url',
 *     bounds: {
 *       type: 'tileRange',
 *       tileRanges: {
 *         15: {
 *           start: { x: 55852, y: 9556 },
 *           end: { x: 55871, y: 9575 },
 *         },
 *       },
 *       levels: [15],
 *     }
 *   ],
 *   terrainProvider: 'default-terrain-url',
 *   fallbackProvider: new EllipsoidTerrainProvider(),
 * });
 *
 * viewer.terrainProvider = hybridTerrain;
 * ```
 */
export class HybridTerrainProvider implements TerrainProvider {
  private _terrainAreas = new TerrainAreas();
  private _terrainProvider!: TerrainProvider;
  private _fallbackProvider!: TerrainProvider;
  private _tilingScheme!: TilingScheme;
  private _ready: boolean = false;
  private _availability?: TileAvailability;

  /**
   * Creates a new `HybridTerrainProvider`. Use the {@link HybridTerrainProvider.create}
   * instead of the constructor for async initialization.
   * @param terrainProvider The initialized default terrain provider
   * @param fallbackProvider The initialized fallback terrain provider
   * @param terrainAreas The array of initialized terrain areas
   * @private - Use {@link HybridTerrainProvider.create} instead.
   */
  private constructor(
    terrainProvider: TerrainProvider,
    fallbackProvider: TerrainProvider,
    terrainAreas: TerrainArea[],
  ) {
    this._terrainProvider = terrainProvider;
    this._fallbackProvider = fallbackProvider;
    this._tilingScheme =
      terrainProvider.tilingScheme || new GeographicTilingScheme();
    this._terrainAreas = new TerrainAreas(...terrainAreas);
    this._availability = terrainProvider.availability;
    this._ready = true;
  }

  /**
   * Asynchronously creates a new `HybridTerrainProvider`.
   * @param options {@link HybridTerrainProvider.ConstructorOptions}
   * @returns A promise that resolves to a new `HybridTerrainProvider` instance.
   */
  static async create(
    options: HybridTerrainProvider.ConstructorOptions,
  ): Promise<HybridTerrainProvider> {
    try {
      // Initialize default provider
      let terrainProvider: TerrainProvider;
      if (typeof options.terrainProvider === 'string') {
        terrainProvider = await CesiumTerrainProvider.fromUrl(
          options.terrainProvider,
          {
            requestVertexNormals: true,
          },
        );
      } else {
        terrainProvider = options.terrainProvider;
      }

      // Initialize fallback provider
      let fallbackProvider: TerrainProvider;
      if (options.fallbackProvider) {
        if (typeof options.fallbackProvider === 'string') {
          fallbackProvider = await CesiumTerrainProvider.fromUrl(
            options.fallbackProvider,
            { requestVertexNormals: true },
          );
        } else {
          fallbackProvider = options.fallbackProvider;
        }
      } else {
        // Default fallback is an ellipsoid (flat terrain)
        fallbackProvider = new EllipsoidTerrainProvider();
      }

      // Initialize terrain areas
      const terrainAreas: TerrainArea[] = [];
      for (const opt of options.terrainAreas) {
        const area = await TerrainArea.create(opt);
        terrainAreas.push(area);
      }

      // Create the fully initialized provider
      return new HybridTerrainProvider(
        terrainProvider,
        fallbackProvider,
        terrainAreas,
      );
    } catch (error: any) {
      console.error('Failed to initialize HybridTerrainProvider:', error);
      throw error;
    }
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
   * @see {@link TerrainProvider.credit}
   */
  get credit(): any {
    return this._terrainProvider?.credit;
  }
  /**
   * @see {@link TerrainProvider.errorEvent}
   */
  get errorEvent(): any {
    return this._terrainProvider.errorEvent;
  }
  /**
   * @see {@link TerrainProvider.hasWaterMask}
   */
  get hasWaterMask(): boolean {
    return this._terrainProvider.hasWaterMask;
  }
  /**
   * @see {@link TerrainProvider.hasVertexNormals}
   */
  get hasVertexNormals(): boolean {
    return this._terrainProvider.hasVertexNormals;
  }
  /**
   * @see {@link TerrainProvider.loadTileDataAvailability}
   */
  loadTileDataAvailability(x: number, y: number, level: number) {
    return this._terrainProvider.loadTileDataAvailability(x, y, level);
  }
  /**
   * @see {@link TerrainProvider.getLevelMaximumGeometricError}
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
   * @see {@link TerrainProvider.getTileDataAvailable}
   * @param x
   * @param y
   * @param level
   */
  getTileDataAvailable(
    x: number,
    y: number,
    level: number,
  ): boolean | undefined {
    // Check each terrain area first.
    this._terrainAreas.forEach((area) => {
      if (
        area.contains(x, y, level) &&
        area.getTileDataAvailable(x, y, level)
      ) {
        return true;
      }
    });

    return this._terrainProvider.getTileDataAvailable(x, y, level) || true;
  }
}

/**
 * @namespace
 * Contains types and factory methods for creating `HybridTerrainProvider` instance.
 */
export namespace HybridTerrainProvider {
  /**
   * Initialization options for `HybridTerrainProvider` constructor.
   */
  export interface ConstructorOptions {
    /** An array of terrain areas to include in the hybrid terrain. */
    terrainAreas: TerrainArea.ConstructorOptions[];
    /** Default provider to use outside of specified terrain areas.  */
    terrainProvider: TerrainProvider | string;
    /** Optional fallback provider when data is not available from default provider. @default EllipsoidTerrainProvider */
    fallbackProvider?: TerrainProvider | string;
  }

  /**
   * Creates a `HybridTerrainProvider` with a custom terrain area overlaid on a base terrain.
   * @param customTerrainUrl URL to the custom terrain.
   * @param baseTerrainUrl URL to the base terrain.
   * @param tileRanges Tile ranges defining the custom terrain area.
   * @param levels Levels to apply the custom terrain.
   * @returns A promise resolving to a new `HybridTerrainProvider`.
   */
  export async function createOverlay(
    customTerrainUrl: string,
    baseTerrainUrl: string,
    tileRanges: TileRanges,
    levels?: number[],
  ): Promise<Awaited<HybridTerrainProvider>> {
    return HybridTerrainProvider.create({
      terrainAreas: [
        {
          provider: customTerrainUrl,
          bounds: { type: 'tileRange', tileRanges },
          levels: levels || Object.keys(tileRanges).map((k) => parseInt(k)),
          credit: 'custom',
        },
      ],
      terrainProvider: baseTerrainUrl,
      fallbackProvider: new EllipsoidTerrainProvider(),
    });
  }
}
