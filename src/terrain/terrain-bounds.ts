import {
  GeographicTilingScheme,
  Rectangle,
  TerrainProvider,
  TilingScheme,
} from 'cesium';

/** A range of tiles from `start` to `end` */
export type TileRange = {
  /** Top Left tile coordinates */
  start: { x: number; y: number };
  /** Bottom Right tile coordinates */
  end: { x: number; y: number };
};
/** A `TileRange` map with specific levels as their keys. */
export type TileRanges = Map<number, TileRange>;

/**
 * @class
 * Defines the geographic boundaries for a terrain area and handles tile availability checks.
 */
export class TerrainBounds {
  private _rectangle: Rectangle;
  private _tilingScheme: TilingScheme;
  private _tileRanges: TileRanges;
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
      if (options.tileRanges instanceof Map) {
        this._tileRanges = new Map(options.tileRanges);
      } else {
        this._tileRanges = new Map(
          Object.entries(options.tileRanges).map(([level, range]) => [
            parseInt(level),
            range,
          ]),
        );
      }

      this._calculateRectangleFromTileRanges();
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
   *
   * Configures a terrain provider's availability based on these bounds.
   * @see WARNING This method is accessing private property of {@link https://cesium.com/learn/csiumjs/ref-doc/TileAvailability.html `TileAvailability`}.
   * @param provider The terrain provider to configure.
   */
  configureAvailability(provider: TerrainProvider): void {
    // Ensure provider has an availability property.
    if (!provider.availability) return;
    // @ts-expect-error
    if (provider.availability._tilingScheme) {
      // @ts-expect-error
      provider.availability._tilingScheme = this._tilingScheme;
    }

    for (const [level, range] of this._tileRanges.entries()) {
      provider.availability.addAvailableTileRange(
        level,
        range.start.x,
        range.start.y,
        range.end.x,
        range.end.y,
      );
    }
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
  get tileRanges(): TileRanges {
    return this._tileRanges;
  }

  /** Gets the levels for which tile ranges are defined. */
  get levels(): Set<number> {
    return this._levels;
  }

  /**
   * Calculates a bounding rectangle that encompasses all the specified tile ranges.
   * @private
   */
  private _calculateRectangleFromTileRanges(): void {
    let west = Number.POSITIVE_INFINITY;
    let south = Number.POSITIVE_INFINITY;
    let east = Number.NEGATIVE_INFINITY;
    let north = Number.NEGATIVE_INFINITY;

    const levels = Array.from(this._tileRanges.keys());
    if (levels.length === 0) {
      this._rectangle = Rectangle.MAX_VALUE;
      return;
    }

    const highestLevel = Math.min(...levels);
    const tileRange = this._tileRanges.get(highestLevel);

    if (tileRange) {
      const { start, end } = tileRange;

      const startRect = this._tilingScheme.tileXYToRectangle(
        start.x,
        start.y,
        highestLevel,
      );

      const endRect = this._tilingScheme.tileXYToRectangle(
        end.x,
        end.y,
        highestLevel,
      );

      west = Math.min(startRect.west, west);
      south = Math.min(endRect.south, south);
      east = Math.max(endRect.east, east);
      north = Math.max(startRect.north, north);
    }

    this._rectangle = new Rectangle(west, south, east, north);
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
     * Can be provided either as a Map or as a plain object with numeric keys.
     */
    tileRanges?: Map<number, TileRange> | Record<string | number, TileRange>;
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
  export function fromTile(
    x: number,
    y: number,
    level: number,
    tilingScheme: TilingScheme = new GeographicTilingScheme(),
  ): TerrainBounds {
    const tileRanges: TileRanges = new Map();
    tileRanges.set(level, { start: { x, y }, end: { x, y } });

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
