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

import { TerrainArea } from './terrain-area.js';
import { TileRanges } from './terrain-bounds.js';

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
 *       levels: [13, 14, 15],
 *     }
 *   ],
 *   defaultProvider: 'default-terrain-url',
 *   fallbackProvider: new EllipsoidTerrainProvider(),
 * });
 *
 * viewer.terrainProvider = hybridTerrain;
 * ```
 */
export class HybridTerrainProvider implements TerrainProvider {
  private _terrainAreas: TerrainArea[] = [];
  private _defaultProvider!: TerrainProvider;
  private _fallbackProvider!: TerrainProvider;
  private _tilingScheme!: TilingScheme;
  private _ready: boolean | Promise<boolean> = false;
  private _availability?: TileAvailability;

  /**
   * Creates a new `HybridTerrainProvider`. Use the static `create()` method
   * instead of the constructor for async initialization.
   * @param options {@link HybridTerrainProvider.ConstructorOptions}
   * @private - Use static `create()` method instead.
   */
  private constructor(options: HybridTerrainProvider.ConstructorOptions) {
    this._ready = this._initialize(options);
  }

  /**
   * Initializes the hybrid terrain provider and all its components.
   * @param options {@link HybridTerrainProvider.ConstructorOptions}
   * @private
   */
  private async _initialize(
    options: HybridTerrainProvider.ConstructorOptions,
  ): Promise<boolean> {
    try {
      // Default provider
      if (typeof options.defaultProvider === 'string') {
        this._defaultProvider = await CesiumTerrainProvider.fromUrl(
          options.defaultProvider,
          { requestVertexNormals: true },
        );
      } else {
        this._defaultProvider = options.defaultProvider;
      }

      if (options.fallbackProvider) {
        if (typeof options.fallbackProvider === 'string') {
          this._fallbackProvider = await CesiumTerrainProvider.fromUrl(
            options.fallbackProvider,
            { requestVertexNormals: true },
          );
        } else {
          this._fallbackProvider = options.fallbackProvider;
        }
      } else {
        // Default fallback is an ellipsoid (flat terrain)
        this._fallbackProvider = new EllipsoidTerrainProvider();
      }

      this._tilingScheme =
        this._defaultProvider.tilingScheme || new GeographicTilingScheme();

      for (const opt of options.terrainAreas) {
        const area = new TerrainArea(opt);
        await area.ready;
        this._terrainAreas.push(area);
      }

      this._availability = this._defaultProvider.availability;
      this._ready = true;
      return true;
    } catch (error: any) {
      console.error('Failed to initialize HybridTerrainProvider:', error);
      this._ready = false;
      throw error;
    }
  }

  /**
   * Asynchronously creates a new `HybridTerrainProvider`.
   * @param options {@link HybridTerrainProvider.ConstructorOptions}
   * @returns A promise that resolves to a new `HybridTerrainProvider` instance.
   */
  static async create(
    options: HybridTerrainProvider.ConstructorOptions,
  ): Promise<HybridTerrainProvider> {
    const provider = new HybridTerrainProvider(options);
    await provider.ready;
    return provider;
  }

  /**
   * Gets a value indicating whether or not the provider is ready for use,
   * or a promise that resolves when the provider becomes ready.
   */
  get ready(): boolean | Promise<boolean> {
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
    return this._defaultProvider;
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
    return this._defaultProvider?.credit;
  }
  /**
   * @see {@link TerrainProvider.errorEvent}
   */
  get errorEvent(): any {
    return this._defaultProvider.errorEvent;
  }
  /**
   * @see {@link TerrainProvider.hasWaterMask}
   */
  get hasWaterMask(): boolean {
    return this._defaultProvider.hasWaterMask;
  }
  /**
   * @see {@link TerrainProvider.hasVertexNormals}
   */
  get hasVertexNormals(): boolean {
    return this._defaultProvider.hasVertexNormals;
  }
  /**
   * @see {@link TerrainProvider.loadTileDataAvailability}
   */
  loadTileDataAvailability(x: number, y: number, level: number) {
    return this._defaultProvider.loadTileDataAvailability(x, y, level);
  }
  /**
   * @see {@link TerrainProvider.getLevelMaximumGeometricError}
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
  async requestTileGeometry(
    x: number,
    y: number,
    level: number,
    request?: Request,
  ): Promise<Awaited<TerrainData>> {
    await this._ready;

    let terrainData: TerrainData | undefined;
    for (const area of this._terrainAreas) {
      if (area.contains(x, y, level)) {
        try {
          terrainData = await area.requestTileGeometry(x, y, level, request);
          if (terrainData) return terrainData;
        } catch (error) {
          console.warn('Error requesting terrain from area:', error);
        }
      }
    }

    try {
      if (this._defaultProvider.getTileDataAvailable(x, y, level)) {
        terrainData = await this._defaultProvider.requestTileGeometry(
          x,
          y,
          level,
          request,
        );
        if (terrainData) return terrainData;
      }
    } catch (error) {
      console.warn('Error requesting terrain from default provider:', error);
    }

    try {
      return (
        (await this._fallbackProvider.requestTileGeometry(
          x,
          y,
          level,
          request,
        )) || (undefined as unknown as TerrainData)
      );
    } catch (error) {
      console.error('Error requesting terrain from fallback provider:', error);
      throw error;
    }
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

    return this._defaultProvider.getTileDataAvailable(x, y, level) || true;
  }

  /**
   * Adds a new terrain area to the hybrid provider.
   * @param area The terrain area to add.
   */
  async addTerrainArea(
    area: TerrainArea | TerrainArea.ConstructorOptions,
  ): Promise<void> {
    const terrainArea =
      area instanceof TerrainArea ? area : new TerrainArea(area);

    await terrainArea.ready;
    this._terrainAreas.push(terrainArea);
  }

  /**
   * Removes a terrain area from the hybrid provider.
   * @param area The terrain area to remove
   * @returns `true` if the area was removed, `false` if not found.
   */
  removeTerrainArea(area: TerrainArea): boolean {
    const index = this._terrainAreas.indexOf(area);
    if (index >= 0) {
      this._terrainAreas.splice(index, 1);
      return true;
    }

    return false;
  }
  /** Clears all terrain areas. */
  clearTerrainArea(): void {
    this._terrainAreas = [];
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
    defaultProvider: TerrainProvider | string;
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
      defaultProvider: baseTerrainUrl,
      fallbackProvider: new EllipsoidTerrainProvider(),
    });
  }
}
