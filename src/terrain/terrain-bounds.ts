import { GeographicTilingScheme, Rectangle, TilingScheme } from 'cesium';

import { TileRange } from './terrain.types.js';
import { computeRectangle } from './terrain.utils.js';

/**
 * @class
 * Defines the geographic boundaries for a terrain area and handles tile availability checks.
 */
export class TerrainBounds {
  private _rectangle: Rectangle;
  private _tilingScheme: TilingScheme;
  private _tileRanges: Map<number, TileRange>;
  private _levels: Set<number>;

  /**
   * Creates a new instance of TerrainBounds.
   * @param options {@link TerrainBounds.ConstructorOptions}
   * @param tilingScheme (optional) The tiling scheme to use for coordinate calculations.
   */
  constructor(
    options: TerrainBounds.ConstructorOptions,
    tilingScheme?: TilingScheme,
  ) {
    this._tilingScheme = tilingScheme || new GeographicTilingScheme();
    this._rectangle = new Rectangle();
    this._tileRanges = new Map();
    this._levels = new Set();

    if (options.type === 'rectangle' && options.rectangle) {
      this._rectangle = Rectangle.clone(options.rectangle);
    } else if (options.type === 'tileRange' && options.tileRanges) {
      this._tileRanges = options.tileRanges;

      this._rectangle = computeRectangle(
        this._tilingScheme,
        options.tileRanges,
      );
    } else {
      throw new Error('Either rectangle or tileRanges must be provided.');
    }

    this._levels = new Set(Array.from(this._tileRanges.keys()));
  }

  /**
   * Checks if the specified tile coordinates are within the bounds.
   * @param x The tile X coordinate.
   * @param y The tile Y coordinate.
   * @param level The tile level.
   * @returns `true` if the tile is within bounds, `false` otherwise.
   */
  contains(x: number, y: number, level: number): boolean {
    if (this._tileRanges.has(level)) {
      const range = this._tileRanges.get(level)!;
      return (
        x >= range.start.x &&
        x <= range.end.x &&
        y >= range.start.y &&
        y <= range.end.y
      );
    }

    const tileRectangle = this._tilingScheme.tileXYToRectangle(x, y, level);
    return Rectangle.intersection(tileRectangle, this._rectangle) !== undefined;
  }

  /**
   * Gets the rectangle representing these bounds.
   */
  get rectangle(): Rectangle {
    return this._rectangle;
  }

  /** Gets the tiling scheme used by these bounds. */
  get tilingScheme(): TilingScheme {
    return this._tilingScheme;
  }

  /** Gets the tile ranges defined for these bounds. */
  get tileRanges(): Map<number, TileRange> {
    return this._tileRanges;
  }

  /** Gets the levels for which tile ranges are defined. */
  get levels(): Set<number> {
    return this._levels;
  }
}

/**
 * @namespace
 * Contains types and factory methods for creating `TerrainBounds` instances.
 */
export namespace TerrainBounds {
  /** Initialization options for Terrain Bounds constructor */
  export interface ConstructorOptions {
    /** Type of bounds definition. */
    type: 'tileRange' | 'rectangle';
    /**
     * Tile ranges by level when using tileRange type.
     * Keys are zoom levels, values define the range of tiles at that level.
     */
    tileRanges?: Map<number, TileRange>;
    /** Rectangle bounds when using rectangle type. */
    rectangle?: Rectangle;
  }

  /**
   * Creates `TerrainBounds` from tile coordinates at a specific level.
   * @param x The tile X coordinate.
   * @param y The tile Y coordinate.
   * @param level The tile level.
   * @param tilingScheme The tiling scheme to use.
   * @returns A new `TerrainBounds` instance for the specified tile.
   */
  export function fromTileRange(
    level: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    tilingScheme: TilingScheme = new GeographicTilingScheme(),
  ): TerrainBounds {
    const tileRanges = new Map<number, TileRange>();
    tileRanges.set(level, {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    });

    return new TerrainBounds(
      {
        type: 'tileRange',
        tileRanges,
      },
      tilingScheme,
    );
  }

  /**
   * Creates `TerrainBounds` from a rectangle.
   * @param rectangle The rectangle defining the bounds.
   * @param tilingScheme The tiling scheme to use.
   * @returns A new `TerrainBounds` instance for the specified rectangle.
   */
  export function fromRectangle(
    rectangle: Rectangle,
    tilingScheme: TilingScheme = new GeographicTilingScheme(),
  ): TerrainBounds {
    return new TerrainBounds(
      {
        type: 'rectangle',
        rectangle: Rectangle.clone(rectangle),
      },
      tilingScheme,
    );
  }
}
