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
    // Check if tile is in a region or would be upsampled from one
    for (const region of this._terrainProvider.regions) {
      if (this._isInRegionOrUpsampled(region, x, y, level)) {
        return this._createCanvasElement(
          this._colors.get("custom") || Color.RED,
        );
      }
    }

    // Check if default provider has data (directly or via upsampling)
    if (
      this._terrainProvider.defaultProvider.getTileDataAvailable(x, y, level)
    ) {
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
   * Checks if terrain data for this tile would come from a region's provider.
   * Returns true if:
   * 1. The tile is directly in the region, OR
   * 2. The tile would be upsampled from a parent tile in the region
   */
  private _isInRegionOrUpsampled(
    region: HybridTerrainProvider.TerrainRegion,
    x: number,
    y: number,
    level: number,
  ): boolean {
    let currentX = x;
    let currentY = y;
    let currentLevel = level;

    // Walk up the tile hierarchy to find if this tile or any parent is in the region
    while (currentLevel >= 0) {
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
