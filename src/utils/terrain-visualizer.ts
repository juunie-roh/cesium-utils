import {
  Color,
  Entity,
  EntityCollection,
  HeightReference,
  Rectangle,
  Viewer,
} from 'cesium';
import { TerrainArea } from 'src/terrain/terrain-area.js';
import { TerrainBounds } from 'src/terrain/terrain-bounds.js';

import Collection from '../collection.js';
import { HybridTerrainProvider } from '../terrain/hybrid-terrain-provider.js';

class TerrainEntities extends Collection<EntityCollection, Entity> {}

/**
 * @class
 * Utility class for visualizing terrain provider boundaries and debugging terrain loading.
 */
export class TerrainVisualizer {
  private _viewer: Viewer;
  private _collection: TerrainEntities;
  private _hybridTerrain?: HybridTerrainProvider;
  private _boundaries: boolean = false;
  private _grid: boolean = false;
  private _activeLevel: number = 15;
  private _colors: Map<string, Color> = new Map([
    ['custom', Color.RED],
    ['default', Color.BLUE],
    ['fallback', Color.GRAY],
    ['grid', Color.YELLOW],
  ]);

  /**
   * Creates a new `TerrainVisualizer`.
   * @param viewer The Cesium viewer instance
   * @param options {@link TerrainVisualizer.ConstructorOptions}
   */
  constructor(viewer: Viewer, options?: TerrainVisualizer.ConstructorOptions) {
    this._viewer = viewer;
    this._collection = new TerrainEntities({
      collection: viewer.entities,
      tag: TerrainVisualizer.tag.default,
    });

    if (options) {
      if (options.colors) {
        Object.entries(options.colors).forEach(([key, color]) => {
          this._colors.set(key, color);
        });
      }

      if (options.boundaries !== undefined) {
        this._boundaries = options.boundaries;
      }

      if (options.tile !== undefined) {
        this._grid = options.tile;
      }

      if (options.activeLevel !== undefined) {
        this._activeLevel = options.activeLevel;
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
    this._hybridTerrain = terrainProvider;
    this.update();
  }

  /**
   * Updates all active visualizations.
   */
  update(): void {
    this.clear();

    if (this._boundaries) {
      this.showBoundaries();
    }

    if (this._grid) {
      this.showGrid(this._activeLevel);
    }
  }

  /**
   * Clears all visualizations.
   */
  clear(): void {
    this._collection.removeByTag(this._collection.getTags());
  }

  /**
   * Visualizes the boundaries of all terrain areas.
   */
  showBoundaries(): void {
    if (!this._hybridTerrain) return;

    this._collection.removeByTag(TerrainVisualizer.tag.boundary);

    this._hybridTerrain.terrainAreas.forEach((area) => {
      const rectangle = area.bounds.rectangle;
      const color = area.isCustom
        ? this._colors.get('custom') || Color.RED
        : this._colors.get('default') || Color.BLUE;

      this._collection.add(
        TerrainVisualizer.createRectangle(rectangle, color),
        TerrainVisualizer.tag.boundary,
      );
    });

    this._boundaries = true;
  }

  /**
   * Hides the terrain area boundaries.
   */
  hideBoundaries(): void {
    this._collection.removeByTag(TerrainVisualizer.tag.boundary);
    this._boundaries = false;
  }

  /**
   * Shows a grid of tiles at the specified level.
   * @param level The zoom level to visualize
   */
  showGrid(level: number): void {
    if (!this._hybridTerrain) return;

    this._collection.removeByTag(TerrainVisualizer.tag.grid);

    this._activeLevel = level;
    const tilingScheme = this._hybridTerrain.tilingScheme;

    const getTileColor = (x: number, y: number, level: number): Color => {
      this._hybridTerrain?.terrainAreas.forEach((area) => {
        if (area.contains(x, y, level)) {
          return area.isCustom
            ? this._colors.get('custom') || Color.RED
            : this._colors.get('default') || Color.BLUE;
        }
      });

      if (
        this._hybridTerrain?.defaultProvider.getTileDataAvailable(x, y, level)
      ) {
        return this._colors.get('default') || Color.BLUE;
      }

      return this._colors.get('fallback') || Color.GREY;
    };

    const visibleRectangle = this._getVisibleRectangle();
    if (!visibleRectangle) return;

    const start = tilingScheme.positionToTileXY(
      Rectangle.northwest(visibleRectangle),
      level,
    );
    const end = tilingScheme.positionToTileXY(
      Rectangle.southeast(visibleRectangle),
      level,
    );
    if (!start || !end) return;

    const maxTilesToShow = 100;
    const xCount = Math.min(end.x - start.x + 1, maxTilesToShow);
    const yCount = Math.min(end.y - start.y + 1, maxTilesToShow);

    for (let x = start.x; x <= start.x + xCount - 1; x++) {
      for (let y = start.y; y <= start.y + yCount + 1; y++) {
        const rect = tilingScheme.tileXYToRectangle(x, y, level);
        const color = getTileColor(x, y, level);
        const entity = TerrainVisualizer.createRectangle(
          rect,
          color.withAlpha(0.3),
        );
        entity.properties?.addProperty('tileX', x);
        entity.properties?.addProperty('tileY', y);
        entity.properties?.addProperty('tileLevel', level);

        this._collection.add(entity, TerrainVisualizer.tag.grid);
      }
    }

    this._grid = true;
  }

  /**
   * Hides the tile grid.
   */
  hideGrid(): void {
    this._collection.removeByTag(TerrainVisualizer.tag.grid);
    this._grid = false;
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
  flyToTerrainArea(area: TerrainArea, options?: { duration?: number }): void {
    const { rectangle } = area.bounds;
    this._viewer.camera.flyTo({
      destination: rectangle,
      ...options,
      complete: () => {
        if (this._boundaries) this.update();
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
  get activeLevel(): number {
    return this._activeLevel;
  }
  /** Set zoom level on the visualizer. */
  set activeLevel(level: number) {
    this._activeLevel = level;
    if (this._grid) {
      this.hideGrid();
      this.showGrid(level);
    }
  }
  /** Whether the boundaries are currently visible. */
  get boundaries(): boolean {
    return this._boundaries;
  }
  /** Whether the grid is currently visible. */
  get grid(): boolean {
    return this._grid;
  }
  /** The collection used in the visualizer. */
  get collection(): TerrainEntities {
    return this._collection;
  }
  /** The viewer used in the visualizer */
  get viewer(): Viewer {
    return this._viewer;
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
    /** Whether to show boundaries initially. */
    boundaries?: boolean;
    /** Whether to show tile grid initially. */
    tile?: boolean;
    /** Initial zoom level to use for visualizations. */
    activeLevel?: number;
    /** Terrain provider to visualize. */
    terrainProvider?: HybridTerrainProvider;
  }

  /** Tag constants for entity collection management. */
  export const tag = {
    default: 'Terrain Visualizer',
    boundary: 'Terrain Visualizer Boundary',
    grid: 'Terrain Visualizer Tile Grid',
  };

  /**
   * Creates a rectangle entity fo r visualization.
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
        outline: true,
        outlineColor: Color.WHITE,
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
    terrain: TerrainArea | TerrainBounds,
    viewer: Viewer,
    options?: Options,
  ): Collection<EntityCollection, Entity> {
    const tag = options?.tag || 'terrain_area_visualization';
    const color = options?.color || Color.RED;
    const maxTilesToShow = options?.maxTilesToShow || 100;
    const show = options?.show !== undefined ? options.show : true;
    const alpha = options?.alpha || 0.7;
    const tileAlpha = options?.tileAlpha || 0.2;

    const bounds = 'provider' in terrain ? terrain.bounds : terrain;

    const collection = new TerrainEntities({
      collection: viewer.entities,
      tag,
    });

    const { rectangle } = bounds;
    collection.add(
      TerrainVisualizer.createRectangle(rectangle, color.withAlpha(alpha)),
      tag,
    );

    if (show && bounds.levels.size > 0) {
      const { tilingScheme } = bounds;
      bounds.levels.forEach((level) => {
        let count = 0;

        const { tileRanges } = bounds;
        for (const [rangeLevel, range] of tileRanges.entries()) {
          if (rangeLevel !== level) continue;

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
        }
      });
    }

    return collection;
  }
}
