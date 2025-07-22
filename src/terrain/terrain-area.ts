import {
  CesiumTerrainProvider,
  Credit,
  Rectangle,
  Request,
  TerrainData,
  TerrainProvider,
} from "cesium";

import Deprecate from "@/utils/deprecation.js";

import HybridTerrainProvider from "./hybrid-terrain-provider.js";

/**
 * @class
 * @deprecated Use HybridTerrainProvider.TerrainRegion instead.
 * This class is maintained for backward compatibility but will be removed in a future version.
 *
 * For migration:
 * - Replace TerrainArea with HybridTerrainProvider.TerrainRegion
 * - Use Rectangle.fromDegrees() for bounds instead of tile ranges
 * - Simplify HybridTerrainProvider constructor to use regions directly
 *
 * Represents a geographic area with a specific terrain provider.
 * `TerrainArea` pairs a provider with geographic bounds and level constraints.
 */
class TerrainArea {
  private _terrainProvider: TerrainProvider;
  private _rectangle: Rectangle;
  private _tileRanges: Map<number, TerrainArea.TileRange>;
  private _ready: boolean = false;
  private _credit: string | Credit;
  private _isCustom: boolean;

  /**
   * Creates a new instance of `TerrainArea`.
   * @param options Object describing initialization options
   */
  constructor(options: TerrainArea.ConstructorOptions) {
    Deprecate.warn(
      "TerrainArea is deprecated. Use HybridTerrainProvider.TerrainRegion instead.",
      { removeInVersion: "v0.3.0" },
    );
    this._terrainProvider = options.terrainProvider;
    this._tileRanges = options.tileRanges;
    this._credit = options.credit || "custom";
    this._isCustom = options.isCustom !== undefined ? options.isCustom : true;
    this._rectangle = HybridTerrainProvider.computeRectangle(
      options.terrainProvider.tilingScheme,
      options.tileRanges,
    );
    options.tileRanges.forEach((range, level) => {
      this._terrainProvider.availability?.addAvailableTileRange(
        level,
        range.start.x,
        range.start.y,
        range.end.x,
        range.end.y,
      );
    });
    this._ready = true;
  }

  /**
   * Checks if the specified tile coordinates are within the bounds.
   * @param x The tile X coordinate.
   * @param y The tile Y coordinate.
   * @param level The tile level.
   * @returns `true` if the tile is within bounds, `false` otherwise.
   */
  contains(x: number, y: number, level: number): boolean {
    if (this._tileRanges.size === 0) return false;
    if (!this._tileRanges.has(level)) {
      return false;
    }

    const range = this._tileRanges.get(level)!;
    return (
      x >= range.start.x &&
      x <= range.end.x &&
      y >= range.start.y &&
      y <= range.end.y
    );

    // If no tile ranges were specified, compare with rectangle
    // const tileRectangle = this._terrainProvider.tilingScheme.tileXYToRectangle(
    //   x,
    //   y,
    //   level,
    // );
    // return Rectangle.intersection(tileRectangle, this._rectangle) !== undefined;
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
      !this.contains(x, y, level)
      // ||
      // (!(this._terrainProvider instanceof EllipsoidTerrainProvider) &&
      //   !this._terrainProvider.getTileDataAvailable(x, y, level))
    ) {
      return undefined;
    }

    return this._terrainProvider.requestTileGeometry(x, y, level, request);
  }

  /**
   * Determines whether data for a tile is available to be loaded.
   * @param x - The X coordinate of the tile for which to request geometry.
   * @param y - The Y coordinate of the tile for which to request geometry.
   * @param level - The level of the tile for which to request geometry.
   * @returns Undefined if not supported by the terrain provider, otherwise true or false.
   * @see {@link TerrainProvider.getTileDataAvailable} */
  getTileDataAvailable(x: number, y: number, level: number): boolean {
    if (this._tileRanges.size === 0) return false;
    if (!this._tileRanges.has(level)) {
      return false;
    }

    const range = this._tileRanges.get(level)!;
    return (
      x >= range.start.x &&
      x <= range.end.x &&
      y >= range.start.y &&
      y <= range.end.y
    );

    // If no tile ranges are specified, defer to provider
    // if (!this._ready) return false;
    // return this._terrainProvider.getTileDataAvailable(x, y, level) ?? false;
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
  get terrainProvider(): TerrainProvider {
    return this._terrainProvider;
  }

  /** Gets available tile ranges with zoom levels set with this terrain area. */
  get tileRanges(): Map<number, TerrainArea.TileRange> {
    return this._tileRanges;
  }

  /** Gets the rectangle representing this terrain area. */
  get rectangle(): Rectangle {
    return this._rectangle;
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
namespace TerrainArea {
  /** Initialization options for `TerrainArea` constructor. */
  export interface ConstructorOptions {
    /** The terrain provider for this area or a URL to create one from. */
    terrainProvider: TerrainProvider;
    /**
     * Tile ranges by level when using tileRange type.
     * Keys are zoom levels, values define the range of tiles at that level.
     */
    tileRanges: Map<number, TileRange>;
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

  /** A range of tiles from `start` to `end` */
  export type TileRange = {
    /** Top Left tile coordinates */
    start: { x: number; y: number };
    /** Bottom Right tile coordinates */
    end: { x: number; y: number };
  };

  /**
   * Creates a `TerrainArea` from a URL and tile ranges.
   * @param url The URL to create the terrain provider from.
   * @param tileRanges Tile ranges by level.
   * @param options: Constructor options for CesiumTerrainProvider.
   * @returns A promise resolving to a new `TerrainArea`
   */
  export async function fromUrl(
    url: string,
    tileRanges: Map<number, TileRange>,
    options?: CesiumTerrainProvider.ConstructorOptions,
  ): Promise<Awaited<TerrainArea>>;
  /* c8 ignore next */
  export async function fromUrl(
    url: string,
    tileRanges: Map<number, TileRange>,
    options?: CesiumTerrainProvider.ConstructorOptions,
  ): Promise<Awaited<TerrainArea>> {
    const credit = options?.credit || "custom";
    const provider = await CesiumTerrainProvider.fromUrl(url, {
      ...options,
      credit,
    });

    const terrainArea = new TerrainArea({
      terrainProvider: provider,
      tileRanges,
      credit,
    });

    return terrainArea;
  }

  /**
   * @extends Array
   * @class
   * Collection-like Extended Array Class of `TerrainArea`.
   */
  export class Collection extends Array<TerrainArea> {
    /**
     * Adds a new terrain area to the collection.
     * @param area A TerrainArea instance or constructor options
     * @returns The index of the added item
     */
    add(area: TerrainArea | TerrainArea.ConstructorOptions): this;
    /**
     * Adds terrain areas to the collection.
     * @param areas An array of TerrainArea instance or constructor options
     * @returns The index of the added item
     */
    add(areas: (TerrainArea | TerrainArea.ConstructorOptions)[]): this;
    add(
      target:
        | (TerrainArea | TerrainArea.ConstructorOptions)
        | (TerrainArea | TerrainArea.ConstructorOptions)[],
    ): this {
      if (Array.isArray(target)) {
        for (const t of target) {
          this.add(t);
        }
        return this;
      }

      let terrainArea: TerrainArea;

      if (target instanceof TerrainArea) {
        terrainArea = target;
      } else {
        terrainArea = new TerrainArea(target);
      }

      // Add to collection after terrain area is ready
      this.push(terrainArea);
      return this;
    }

    /**
     * Removes a terrain area from the collection.
     * @param area The terrain area to remove.
     */
    remove(area: TerrainArea): this;
    /**
     * Removes multiple terrain areas from the collection.
     * @param areas The terrain areas to remove.
     */
    remove(areas: TerrainArea[]): this;
    remove(target: TerrainArea | TerrainArea[]): this {
      if (Array.isArray(target)) {
        target.forEach((t) => this.remove(t));
        return this;
      }

      const index = this.indexOf(target);
      if (index >= 0) {
        this.splice(index, 1);
      }

      return this;
    }

    /**
     * Clears all terrain areas.
     */
    removeAll(): void {
      this.length = 0;
    }
  }
}

export default TerrainArea;
