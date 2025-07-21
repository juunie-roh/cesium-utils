import {
  Color,
  Entity,
  EntityCollection,
  HeightReference,
  ImageryLayer,
  Rectangle,
  TileCoordinatesImageryProvider,
  TilingScheme,
  Viewer,
} from "cesium";

import Collection from "@/collection/collection.js";
import HybridTerrainProvider from "@/terrain/hybrid-terrain-provider.js";
import TerrainArea from "@/terrain/terrain-area.js";

/**
 * @class
 * Utility class for visualizing terrain provider boundaries and debugging terrain loading.
 */
export class TerrainVisualizer {
  private _viewer: Viewer;
  private _collection: Collection<EntityCollection, Entity>;
  private _terrainProvider?: HybridTerrainProvider;
  private _visible: boolean = false;
  private _level: number = 15;
  private _tileCoordinatesLayer: ImageryLayer | undefined;
  private _colors: Map<string, Color> = new Map([
    ["custom", Color.RED],
    ["default", Color.BLUE],
    ["fallback", Color.GRAY],
    ["grid", Color.YELLOW],
  ]);

  /**
   * Creates a new `TerrainVisualizer`.
   * @param viewer The Cesium viewer instance
   * @param options {@link TerrainVisualizer.ConstructorOptions}
   */
  constructor(viewer: Viewer, options?: TerrainVisualizer.ConstructorOptions) {
    this._viewer = viewer;
    this._collection = new Collection<EntityCollection, Entity>({
      collection: viewer.entities,
      tag: TerrainVisualizer.tag.default,
    });

    if (options) {
      if (options.colors) {
        Object.entries(options.colors).forEach(([key, color]) => {
          this._colors.set(key, color);
        });
      }

      if (options.tile !== undefined) {
        this._visible = options.tile;
      }

      if (options.activeLevel !== undefined) {
        this._level = options.activeLevel;
      }

      if (options.terrainProvider) {
        this.setTerrainProvider(options.terrainProvider);
      }
    }
  }

  /**
   * Sets the terrain provider to visualize.
   * @param terrainProvider The terrain provider to visualize.
   */
  setTerrainProvider(terrainProvider: HybridTerrainProvider): void {
    this._terrainProvider = terrainProvider;
    this.update();
  }

  /**
   * Updates all active visualizations.
   */
  update(): void {
    this.clear();

    if (this._visible) {
      this.show(this._level);
    }
  }

  /**
   * Clears all visualizations.
   */
  clear(): void {
    this._collection.remove(this._collection.tags);
  }

  /**
   * Shows a grid of tiles at the specified level.
   * @param level The zoom level to visualize
   */
  // Suggested refactor for TerrainVisualizer.show() method
  show(level: number = 15): void {
    if (!this._terrainProvider) return;

    this._collection.remove(TerrainVisualizer.tag.grid);
    this._level = level;

    // Add tile coordinates layer if needed
    this._ensureTileCoordinatesLayer();

    const visibleRectangle = this._getVisibleRectangle();
    if (!visibleRectangle || !this._isValidRectangle(visibleRectangle)) {
      console.warn("Invalid visible rectangle detected, skipping grid display");
      return;
    }

    this._displayTileGrid(visibleRectangle, level);
    this._visible = true;
  }

  private _ensureTileCoordinatesLayer(): void {
    if (!this._tileCoordinatesLayer) {
      this._tileCoordinatesLayer =
        this._viewer.imageryLayers.addImageryProvider(
          new TileCoordinatesImageryProvider({
            tilingScheme: this._terrainProvider!.tilingScheme,
            color: Color.YELLOW,
          }),
        );
    }
  }

  private _isValidRectangle(rectangle: Rectangle): boolean {
    return (
      rectangle &&
      Number.isFinite(rectangle.west) &&
      Number.isFinite(rectangle.south) &&
      Number.isFinite(rectangle.east) &&
      Number.isFinite(rectangle.north) &&
      rectangle.west <= rectangle.east &&
      rectangle.south <= rectangle.north
    );
  }

  private _displayTileGrid(visibleRectangle: Rectangle, level: number): void {
    const tilingScheme = this._terrainProvider!.tilingScheme;

    try {
      const tileBounds = this._calculateTileBounds(
        visibleRectangle,
        level,
        tilingScheme,
      );
      const tiles = this._generateVisibleTiles(tileBounds, level, tilingScheme);

      tiles.forEach((tile) => {
        this._collection.add(tile.entity, TerrainVisualizer.tag.grid);
      });
    } catch (error) {
      console.error("Error displaying tile grid:", error);
    }
  }

  private _calculateTileBounds(
    rectangle: Rectangle,
    level: number,
    tilingScheme: TilingScheme,
  ): { start: any; end: any } {
    const start = tilingScheme.positionToTileXY(
      Rectangle.northwest(rectangle),
      level,
    );
    const end = tilingScheme.positionToTileXY(
      Rectangle.southeast(rectangle),
      level,
    );

    if (!start || !end) {
      throw new Error("Failed to calculate tile bounds");
    }

    return { start, end };
  }

  private _generateVisibleTiles(
    bounds: { start: any; end: any },
    level: number,
    tilingScheme: TilingScheme,
  ): Array<{ entity: Entity }> {
    const tiles = [];
    const maxTilesToShow = 100;

    const xCount = Math.min(bounds.end.x - bounds.start.x + 1, maxTilesToShow);
    const yCount = Math.min(bounds.end.y - bounds.start.y + 1, maxTilesToShow);

    for (let x = bounds.start.x; x < bounds.start.x + xCount; x++) {
      for (let y = bounds.start.y; y < bounds.start.y + yCount; y++) {
        try {
          const tile = this._createTileEntity(x, y, level, tilingScheme);
          if (tile) tiles.push({ entity: tile });
        } catch (error) {
          console.warn(`Error creating tile (${x}, ${y}, ${level}):`, error);
        }
      }
    }

    return tiles;
  }

  private _createTileEntity(
    x: number,
    y: number,
    level: number,
    tilingScheme: TilingScheme,
  ): Entity | null {
    const rect = tilingScheme.tileXYToRectangle(x, y, level);

    if (!this._isValidRectangle(rect)) {
      return null;
    }

    const color = this._getTileColor(x, y, level);
    const entity = TerrainVisualizer.createRectangle(
      rect,
      color.withAlpha(0.3),
    );

    entity.properties?.addProperty("tileX", x);
    entity.properties?.addProperty("tileY", y);
    entity.properties?.addProperty("tileLevel", level);

    return entity;
  }

  private _getTileColor(x: number, y: number, level: number): Color {
    if (!this._terrainProvider) {
      return this._colors.get("fallback") || Color.TRANSPARENT;
    }

    // Check terrain regions first
    for (const region of this._terrainProvider.regions) {
      // Use private method to check if region contains the tile
      if ((this._terrainProvider as any)._regionContains(region, x, y, level)) {
        // For backward compatibility, assume all regions are custom
        return this._colors.get("custom") || Color.RED;
      }
    }

    // Check default provider availability
    if (this._terrainProvider.getTileDataAvailable(x, y, level)) {
      return this._colors.get("default") || Color.BLUE;
    }

    return this._colors.get("fallback") || Color.GRAY;
  }

  /**
   * Hides the tile grid.
   */
  hide(): void {
    this._collection.remove(TerrainVisualizer.tag.grid);

    if (this._tileCoordinatesLayer) {
      this._viewer.imageryLayers.remove(this._tileCoordinatesLayer);
      this._tileCoordinatesLayer = undefined;
    }

    this._visible = false;
  }

  /**
   * Sets the colors used for visualization.
   * @param colors Map of role names to colors
   */
  setColors(colors: Record<string, Color>): void {
    Object.entries(colors).forEach(([key, color]) => {
      this._colors.set(key, color);
    });

    this.update();
  }

  /**
   * Flies the camera to focus on a terrain area.
   * @param area The terrain area to focus on.
   * @param options {@link Viewer.flyTo}
   */
  flyTo(area: TerrainArea, options?: { duration?: number }): void {
    const { rectangle } = area;
    this._viewer.camera.flyTo({
      destination: rectangle,
      ...options,
      complete: () => {
        if (this._visible) this.update();
      },
    });
  }

  /**
   * Gets the rectangle representing the current view.
   * @returns The current view rectangle or undefined.
   * @private
   */
  private _getVisibleRectangle(): Rectangle | undefined {
    const camera = this._viewer.camera;
    const visibleArea = camera.computeViewRectangle();
    return visibleArea;
  }

  /** The current zoom level set on the visualizer. */
  get level(): number {
    return this._level;
  }
  /** Set zoom level on the visualizer. */
  set level(level: number) {
    this._level = level;
    if (this._visible) {
      this.update();
    }
  }
  /** Whether the grid is currently visible. */
  get visible(): boolean {
    return this._visible;
  }
  /** The collection used in the visualizer. */
  get collection(): Collection<EntityCollection, Entity> {
    return this._collection;
  }
  /** The viewer used in the visualizer */
  get viewer(): Viewer {
    return this._viewer;
  }
  /** The colors used in the visualizer */
  get colors() {
    return this._colors;
  }
  /** The hybrid terrain instance used in the visualizer */
  get terrainProvider() {
    return this._terrainProvider;
  }
}

/**
 * @namespace
 * Contains types, utility functions, and constants for terrain visualization.
 */
export namespace TerrainVisualizer {
  /** Initialization options for `TerrainVisualizer` constructor. */
  export interface ConstructorOptions {
    /** Colors to use for different visualization elements */
    colors?: Record<string, Color>;
    /** Whether to show tile grid initially. */
    tile?: boolean;
    /** Initial zoom level to use for visualizations. */
    activeLevel?: number;
    /** Terrain provider to visualize. */
    terrainProvider?: HybridTerrainProvider;
  }

  /** Tag constants for entity collection management. */
  export const tag = {
    default: "Terrain Visualizer",
    boundary: "Terrain Visualizer Boundary",
    grid: "Terrain Visualizer Tile Grid",
  };

  /**
   * Creates a ground-clamped rectangle entity for visualization.
   * @param rectangle The rectangle to visualize
   * @param color The color to use
   * @returns A new entity
   */
  export function createRectangle(rectangle: Rectangle, color: Color) {
    return new Entity({
      rectangle: {
        coordinates: rectangle,
        material: color,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    });
  }

  /** Options for {@link TerrainVisualizer.visualize} */
  export interface Options {
    color?: Color;
    show?: boolean;
    maxTilesToShow?: number;
    levels?: number[];
    tag?: string;
    alpha?: number;
    tileAlpha?: number;
  }

  /**
   * Visualizes a specific terrain area in a viewer.
   * @param terrain The terrain area to visualize.
   * @param viewer The Cesium viewer.
   * @param options Visualization options.
   * @returns Collection of created entities.
   */
  export function visualize(
    area: TerrainArea,
    viewer: Viewer,
    options?: Options,
  ): Collection<EntityCollection, Entity> {
    const tag = options?.tag || "terrain_area_visualization";
    const color = options?.color || Color.RED;
    const maxTilesToShow = options?.maxTilesToShow || 100;
    const show = options?.show ?? true;
    const alpha = options?.alpha || 0.7;
    const tileAlpha = options?.tileAlpha || 0.2;

    const collection = new Collection<EntityCollection, Entity>({
      collection: viewer.entities,
      tag,
    });

    const { rectangle } = area;
    collection.add(
      TerrainVisualizer.createRectangle(rectangle, color.withAlpha(alpha)),
      tag,
    );

    if (show && area.tileRanges.size > 0) {
      const { tilingScheme } = area.terrainProvider;

      let count = 0;
      area.tileRanges.forEach((range, level) => {
        for (
          let x = range.start.x;
          x <= range.end.x && count < maxTilesToShow;
          x++
        ) {
          for (
            let y = range.start.y;
            y <= range.end.y && count < maxTilesToShow;
            y++
          ) {
            const rect = tilingScheme.tileXYToRectangle(x, y, level);
            collection.add(
              createRectangle(rect, color.withAlpha(tileAlpha)),
              `${tag}_tile`,
            );

            count++;
          }
        }
      });
    }

    return collection;
  }
}
