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
  private _provider: TerrainProvider | undefined;
  private _bounds: TerrainBounds;
  private _levels: Set<number>;
  private _ready: boolean = false;
  private _credit: string | Credit;
  private _isCustom: boolean;

  /**
   * Creates a new instance of `TerrainArea`.
   * @param options Object describing initialization options
   * @private Use {@link TerrainArea.create} instead.
   */
  private constructor(
    options: TerrainArea.ConstructorOptions,
    provider: TerrainProvider,
  ) {
    this._bounds =
      options.bounds instanceof TerrainBounds
        ? options.bounds
        : new TerrainBounds(options.bounds);

    this._levels = new Set(options.levels || []);
    this._credit = options.credit || 'custom';
    this._isCustom = options.isCustom !== undefined ? options.isCustom : true;
    this._provider = provider;
    this._ready = true;

    this._bounds.configureAvailability(this._provider);
  }

  /**
   * Asynchronously creates a new instance of `TerrainArea`.
   * @param options {@link TerrainArea.ConstructorOptions}
   * @returns A promise that resolves to a new `TerrainArea` instance.
   */
  static async create(
    options: TerrainArea.ConstructorOptions,
  ): Promise<TerrainArea> {
    let provider: TerrainProvider;

    if (typeof options.provider === 'string') {
      provider = await CesiumTerrainProvider.fromUrl(options.provider, {
        requestVertexNormals: true,
        credit: options.credit || 'custom',
      });
    } else {
      provider = options.provider;
    }

    return new TerrainArea(options, provider);
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

  /**
   * Requests the geometry for a given tile. The result must include terrain data and
   * may optionally include a water mask and an indication of which child tiles are available.
   * @param x - The X coordinate of the tile for which to request geometry.
   * @param y - The Y coordinate of the tile for which to request geometry.
   * @param level - The level of the tile for which to request geometry.
   * @param [request] - The request object. Intended for internal use only.
   * @returns A promise for the requested geometry.  If this method
   *          returns undefined instead of a promise, it is an indication that too many requests are already
   *          pending and the request will be retried later.
   */
  requestTileGeometry(
    x: number,
    y: number,
    level: number,
    request?: Request,
  ): Promise<Awaited<TerrainData>> | undefined {
    if (
      !this._ready ||
      !this.contains(x, y, level) ||
      !this._provider?.getTileDataAvailable(x, y, level)
    ) {
      return undefined;
    }

    return this._provider.requestTileGeometry(x, y, level, request);
  }

  /**
   * Determines whether data for a tile is available to be loaded.
   * @param x - The X coordinate of the tile for which to request geometry.
   * @param y - The Y coordinate of the tile for which to request geometry.
   * @param level - The level of the tile for which to request geometry.
   * @returns Undefined if not supported by the terrain provider, otherwise true or false.
   * @see {@link TerrainProvider.getTileDataAvailable} */
  getTileDataAvailable(x: number, y: number, level: number): boolean {
    if (!this.contains(x, y, level) || !this._ready) return false;
    return this._provider?.getTileDataAvailable(x, y, level) ?? false;
  }

  /** Checks if this terrain provider is marked as a custom provider. */
  get isCustom(): boolean {
    return this._isCustom;
  }

  /** Gets the credit associated with this terrain area. */
  get credit(): string | Credit {
    return this._credit;
  }

  /** Gets the terrain provider for this terrain area. */
  get provider(): TerrainProvider | undefined {
    return this._provider;
  }

  /** Gets the terrain bounds for this terrain area. */
  get bounds(): TerrainBounds {
    return this._bounds;
  }

  /** Gets available zoom levels set with this terrain area. */
  get levels(): Set<number> {
    return this._levels;
  }

  /** Gets if this terrain area is ready. */
  get ready(): boolean {
    return this._ready;
  }
}

/**
 * @namespace
 * Contains types and factory methods for creating `TerrainArea` instances.
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
  ): Promise<Awaited<TerrainArea>> {
    const bounds = new TerrainBounds({
      type: 'tileRange',
      tileRanges,
    });

    const terrainArea = await TerrainArea.create({
      provider: url,
      bounds,
      levels: levels || Object.keys(tileRanges).map((k) => parseInt(k)),
      credit,
    });

    return terrainArea;
  }
}
