import { Color, GridImageryProvider } from "cesium";

import HybridTerrainProvider from "@/terrain/hybrid-terrain-provider.js";

export default class HybridImageryProvider extends GridImageryProvider {
  private _terrainProvider: HybridTerrainProvider;
  private _colors: Map<string, Color>;

  constructor(
    options: GridImageryProvider.ConstructorOptions & {
      terrainProvider: HybridTerrainProvider;
      colors: Map<string, Color>;
    },
  ) {
    const { terrainProvider, colors, ...rest } = options;
    super(rest);

    this._terrainProvider = terrainProvider;
    this._colors = colors;
  }

  requestImage(
    x: number,
    y: number,
    level: number,
  ): Promise<HTMLCanvasElement> {
    // Check regions for a match at current level or parent levels
    for (const region of this._terrainProvider.regions) {
      if (this._isInRegion(region, x, y, level)) {
        return this._createCanvasElement(
          this._colors.get("custom") || Color.RED,
        );
      }
    }

    // Fall back to default provider
    // Check if default provider has data at this level or any parent level
    if (this._defaultProviderCoversArea(x, y, level)) {
      return this._createCanvasElement(
        this._colors.get("default") || Color.BLUE,
      );
    }

    // Final fallback
    return this._createCanvasElement(
      this._colors.get("fallback") || Color.GRAY,
    );
  }

  /**
   * Checks if a tile is within a region by checking the tile and its parents up the hierarchy.
   * This mimics terrain upsampling behavior.
   */
  private _isInRegion(
    region: HybridTerrainProvider.TerrainRegion,
    x: number,
    y: number,
    level: number,
  ): boolean {
    // Check current level first
    if (HybridTerrainProvider.TerrainRegion.contains(region, x, y, level)) {
      return true;
    }

    // If region has tiles defined, check parent tiles
    if (region.tiles) {
      let currentX = x;
      let currentY = y;
      let currentLevel = level;

      // Walk up the tile hierarchy to find a parent that matches
      while (currentLevel > 0) {
        currentLevel--;
        currentX = Math.floor(currentX / 2);
        currentY = Math.floor(currentY / 2);

        if (
          HybridTerrainProvider.TerrainRegion.contains(
            region,
            currentX,
            currentY,
            currentLevel,
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks if the default provider covers this area at any available level.
   * Checks current level and parent tiles.
   */
  private _defaultProviderCoversArea(
    x: number,
    y: number,
    level: number,
  ): boolean {
    let currentX = x;
    let currentY = y;
    let currentLevel = level;

    // Check current level and walk up to find available data
    while (currentLevel >= 0) {
      const available =
        this._terrainProvider.defaultProvider.getTileDataAvailable(
          currentX,
          currentY,
          currentLevel,
        );

      if (available) {
        return true;
      }

      if (currentLevel === 0) break;

      currentLevel--;
      currentX = Math.floor(currentX / 2);
      currentY = Math.floor(currentY / 2);
    }

    return false;
  }

  private _createCanvasElement(color: Color): Promise<HTMLCanvasElement> {
    const canvas = document.createElement("canvas");

    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    const cssColor = color.withAlpha(0.3).toCssColorString();

    if (!context) throw new Error("canvas context undefined");
    context.fillStyle = cssColor;
    context.fillRect(0, 0, 256, 256);

    return Promise.resolve(canvas);
  }
}
