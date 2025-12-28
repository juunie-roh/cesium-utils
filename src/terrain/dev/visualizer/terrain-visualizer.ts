import {
  Color,
  ImageryLayer,
  Rectangle,
  TileCoordinatesImageryProvider,
  Viewer,
} from "cesium";

import HybridTerrainProvider from "@/terrain//hybrid-terrain-provider.js";

import HybridImageryProvider from "./hybrid-imagery-provider.js";

/**
 * @class
 * Utility class for visualizing terrain provider boundaries and debugging terrain loading.
 */
export class TerrainVisualizer {
  private _viewer: Viewer;
  private _terrainProvider: HybridTerrainProvider;
  private _visible: boolean = false;
  private _tileCoordinatesLayer: ImageryLayer | undefined;
  private _hybridImageryLayer: ImageryLayer | undefined;
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
  constructor(viewer: Viewer, options: TerrainVisualizer.ConstructorOptions) {
    this._viewer = viewer;
    this._terrainProvider = options.terrainProvider;

    if (options.colors) {
      Object.entries(options.colors).forEach(([key, color]) => {
        this._colors.set(key, color);
      });
    }

    if (options.tile !== undefined && options.tile) {
      this.show();
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
    const wasVisible = this._visible;
    const hadTileCoords = !!this._tileCoordinatesLayer;
    const alpha = this._hybridImageryLayer?.alpha ?? 0.5;

    this.clear();

    if (wasVisible) {
      this.show({
        showTileCoordinates: hadTileCoords,
        alpha: alpha,
      });
    }
  }

  /**
   * Clears all visualizations.
   */
  clear(): void {
    this.hide();
  }

  /**
   * Shows terrain visualization using HybridImageryProvider.
   * Optionally adds tile coordinate grid overlay.
   * @param options Visualization options
   */
  show(options?: {
    /** Show tile coordinate labels. Default: true */
    showTileCoordinates?: boolean;
    /** Transparency level (0-1). Default: 0.5 */
    alpha?: number;
  }): void {
    if (!this._terrainProvider) return;

    const showTileCoordinates = options?.showTileCoordinates ?? true;
    const alpha = options?.alpha ?? 0.5;

    // Add tile coordinates layer if requested
    if (showTileCoordinates) {
      this._ensureTileCoordinatesLayer();
    }

    // Show imagery overlay
    this.showImageryOverlay(alpha);

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

  /**
   * Hides the terrain visualization.
   */
  hide(): void {
    if (this._tileCoordinatesLayer) {
      this._viewer.imageryLayers.remove(this._tileCoordinatesLayer);
      this._tileCoordinatesLayer = undefined;
    }

    this.hideImageryOverlay();

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
   * Shows terrain regions using HybridImageryProvider (performant, global coverage).
   * This replaces the entity-based approach with an imagery layer.
   * @param alpha Transparency level (0-1), default 0.5
   */
  showImageryOverlay(alpha: number = 0.5): void {
    // Remove existing layer if present
    if (this._hybridImageryLayer) {
      this._viewer.imageryLayers.remove(this._hybridImageryLayer);
    }

    // Create HybridImageryProvider
    const imageryProvider = new HybridImageryProvider({
      terrainProvider: this._terrainProvider,
      colors: this._colors,
      tilingScheme: this._terrainProvider.tilingScheme,
    });

    // Add to imagery layers
    this._hybridImageryLayer =
      this._viewer.imageryLayers.addImageryProvider(imageryProvider);
    this._hybridImageryLayer.alpha = alpha;

    console.log("HybridImageryProvider overlay enabled");
  }

  /**
   * Hides the imagery overlay.
   */
  hideImageryOverlay(): void {
    if (this._hybridImageryLayer) {
      this._viewer.imageryLayers.remove(this._hybridImageryLayer);
      this._hybridImageryLayer = undefined;
      console.log("HybridImageryProvider overlay disabled");
    }
  }

  /**
   * Shows tile coordinate grid overlay.
   */
  showTileCoordinates(): void {
    this._ensureTileCoordinatesLayer();
  }

  /**
   * Hides tile coordinate grid overlay.
   */
  hideTileCoordinates(): void {
    if (this._tileCoordinatesLayer) {
      this._viewer.imageryLayers.remove(this._tileCoordinatesLayer);
      this._tileCoordinatesLayer = undefined;
    }
  }

  /**
   * Sets the transparency of the imagery overlay.
   * @param alpha Transparency level (0-1), where 0 is fully transparent and 1 is fully opaque
   */
  setAlpha(alpha: number): void {
    if (this._hybridImageryLayer) {
      this._hybridImageryLayer.alpha = alpha;
    }
  }

  /**
   * Flies the camera to focus on a rectangle.
   * @param rectangle The rectangle to focus on.
   * @param options {@link Viewer.flyTo}
   */
  flyTo(rectangle: Rectangle, options?: { duration?: number }): void {
    this._viewer.camera.flyTo({
      destination: rectangle,
      ...options,
      complete: () => {
        if (this._visible) this.update();
      },
    });
  }

  /** Whether tile coordinates are currently visible. */
  get tileCoordinatesVisible(): boolean {
    return !!this._tileCoordinatesLayer;
  }
  /** Whether the grid is currently visible. */
  get visible(): boolean {
    return this._visible;
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
    terrainProvider: HybridTerrainProvider;
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

  // /**
  //  * Visualizes a terrain region in a viewer.
  //  * @param region The terrain region to visualize.
  //  * @param viewer The Cesium viewer.
  //  * @param options Visualization options.
  //  * @returns Collection of created entities.
  //  */
  // export function visualize(
  //   region: HybridTerrainProvider.TerrainRegion,
  //   viewer: Viewer,
  //   options?: Options,
  // ): Collection<EntityCollection, Entity> {
  //   const tag = options?.tag || "terrain_region_visualization";
  //   const color = options?.color || Color.RED;
  //   const maxTilesToShow = options?.maxTilesToShow || 100;
  //   const show = options?.show ?? true;
  //   const tileAlpha = options?.tileAlpha || 0.2;

  //   const collection = new Collection<EntityCollection, Entity>({
  //     collection: viewer.entities,
  //     tag,
  //   });

  //   if (show && region.tiles && region.tiles.size > 0) {
  //     const tilingScheme = region.provider.tilingScheme;

  //     let count = 0;
  //     region.tiles.forEach((range, level) => {
  //       const xRange = Array.isArray(range.x) ? range.x : [range.x, range.x];
  //       const yRange = Array.isArray(range.y) ? range.y : [range.y, range.y];

  //       for (let x = xRange[0]; x <= xRange[1] && count < maxTilesToShow; x++) {
  //         for (
  //           let y = yRange[0];
  //           y <= yRange[1] && count < maxTilesToShow;
  //           y++
  //         ) {
  //           const rect = tilingScheme.tileXYToRectangle(x, y, level);
  //           collection.add(
  //             createRectangle(rect, color.withAlpha(tileAlpha)),
  //             `${tag}_tile`,
  //           );

  //           count++;
  //         }
  //       }
  //     });
  //   }

  //   return collection;
  // }
}
