import {
  CesiumTerrainProvider,
  Credit,
  Request,
  TerrainData,
  TerrainProvider,
} from 'cesium';

import { TerrainBounds, TileRanges } from './terrain-bounds.js';

/**
 * @class
 * Represents a geographic area with a specific terrain provider.
 * `TerrainArea` pairs a provider with geographic bounds and level constraints.
 */
export class TerrainArea {
  private _provider!: TerrainProvider;
  private _bounds: TerrainBounds;
  private _levels: Set<number>;
  private _ready: boolean | Promise<boolean> = false;
  private _credit: string | Credit;
  private _isCustom: boolean;

  /**
   * Creates a new instance of `TerrainArea`.
   * @param options Object describing initialization options
   */
  constructor(options: TerrainArea.ConstructorOptions) {
    if (!options.bounds)
      throw new Error('TerrainArea requires bounds to be specified.');

    this._bounds =
      options.bounds instanceof TerrainBounds
        ? options.bounds
        : new TerrainBounds(options.bounds);

    this._levels = new Set(options.levels || []);
    this._credit = options.credit || 'custom';
    this._isCustom = options.isCustom !== undefined ? options.isCustom : true;

    this._ready = this._initializeProvider(options.provider);
  }

  private async _initializeProvider(
    provider: TerrainProvider | string,
  ): Promise<boolean> {
    try {
      if (typeof provider === 'string') {
        this._provider = await CesiumTerrainProvider.fromUrl(provider, {
          requestVertexNormals: true,
          credit: this._credit,
        });
      } else {
        this._provider = provider;

        if (this._isCustom && typeof this._credit === 'string') {
          // Handle setting credit on existing provider.
          // Note: This may not be directly possible.
        }
      }

      this._bounds.configureAvailability(this._provider);
      this._ready = true;
      return true;
    } catch (error: any) {
      console.error('Failed to initialize terrain provider:', error);
      this._ready = false;
      throw error;
    }
  }

  /**
   * @see {@link TerrainBounds.contains}
   */
  contains(x: number, y: number, level: number): boolean {
    if (this._levels.size > 0 && !this._levels.has(level)) {
      return false;
    }

    return this._bounds.contains(x, y, level);
  }

  async ensureReady(): Promise<boolean> {
    if (this._ready === true) return true;
    return this._ready;
  }

  async requestTileGeometry(
    x: number,
    y: number,
    level: number,
    request?: Request,
  ): Promise<TerrainData | undefined> {
    // Ensure the provider is ready
    await this.ensureReady();
    // Check if this tile is available from this provider.
    if (
      !this.contains(x, y, level) ||
      !this._provider?.getTileDataAvailable(x, y, level)
    )
      return undefined;

    // Request the tile from the provider.
    return this._provider.requestTileGeometry(x, y, level, request);
  }

  getTileDataAvailable(x: number, y: number, level: number): boolean {
    if (!this.contains(x, y, level) || !this._ready) return false;
    return this._provider?.getTileDataAvailable(x, y, level) ?? false;
  }

  /**
   * Checks if this terrain provider is marked as a custom provider.
   */
  get isCustom(): boolean {
    return this._isCustom;
  }

  /**
   * Gets the credit associated with this terrain area.
   */
  get credit(): string | Credit {
    return this._credit;
  }

  get provider(): TerrainProvider | undefined {
    return this._provider;
  }

  get bounds(): TerrainBounds {
    return this._bounds;
  }

  get levels(): Set<number> {
    return this._levels;
  }

  get ready(): boolean | Promise<boolean> {
    return this._ready;
  }
}

/**
 * @namespace `TerrainArea` Contains types and factory methods for creating `TerrainArea` instances.
 */
export namespace TerrainArea {
  /** Initialization options for `TerrainArea` constructor. */
  export interface ConstructorOptions {
    /** The terrain provider for this area or a URL to create one from. */
    provider: TerrainProvider | string;
    /** The geographic bounds of this terrain area. */
    bounds: TerrainBounds | TerrainBounds.ConstructorOptions;
    /**
     * The zoom levels this terrain area applies to.
     * If empty, the area applies to all levels.
     */
    levels?: number[];
    /**
     * Credit to associate with this terrain provider.
     * Used to identify custom terrain providers.
     * @default custom
     */
    credit?: string | Credit;
    /**
     * Whether this is a custom terrain provider.
     * @default true
     */
    isCustom?: boolean;
  }

  /**
   * Creates a `TerrainArea` from a URL and tile ranges.
   * @param url The URL to create the terrain provider from.
   * @param tileRanges Tile ranges by level.
   * @param levels The zoom levels this area applies to.
   * @param credit Credit to associate with this terrain provider.
   * @returns A promise resolving to a new `TerrainArea`
   */
  export async function fromUrl(
    url: string,
    tileRanges: TileRanges,
    levels?: number[],
    credit: string | Credit = 'custom',
  ) {
    const bounds = new TerrainBounds({
      type: 'tileRange',
      tileRanges,
    });

    const terrainArea = new TerrainArea({
      provider: url,
      bounds,
      levels: levels || Object.keys(tileRanges).map((k) => parseInt(k)),
      credit,
    });

    await terrainArea.ready;

    return terrainArea;
  }
}
