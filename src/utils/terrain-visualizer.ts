import {
  Cartesian3,
  Color,
  Entity,
  EntityCollection,
  HeightReference,
  Rectangle,
  Viewer,
} from 'cesium';

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
  private _showBoundaries: boolean = false;
  private _showTileGrid: boolean = false;
  private _activeLevel: number = 15;
  private _colors: Map<string, Color> = new Map([
    ['custom', Color.RED],
    ['default', Color.BLUE],
    ['fallback', Color.GRAY],
    ['grid', Color.YELLOW],
  ]);

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

      if (options.showBoundaries !== undefined) {
        this._showBoundaries = options.showBoundaries;
      }

      if (options.showTileGrid !== undefined) {
        this._showTileGrid = options.showTileGrid;
      }

      if (options.activeLevel !== undefined) {
        this._activeLevel = options.activeLevel;
      }

      if (options.terrainProvider) {
        this.setTerrainProvider(options.terrainProvider);
      }
    }
  }

  setTerrainProvider(terrainProvider: HybridTerrainProvider): void {
    this._hybridTerrain = terrainProvider;
    this.update();
  }
  update(): void {
    this.clear();

    if (this._showBoundaries) {
      this.showBoundaries();
    }

    if (this._showTileGrid) {
      this.showTileGrid(this._activeLevel);
    }
  }

  clear(): void {
    this._collection.removeByTag([
      TerrainVisualizer.tag.default,
      TerrainVisualizer.tag.boundary,
      TerrainVisualizer.tag.grid,
    ]);
  }

  showBoundaries(): void {
    if (!this._hybridTerrain) return;

    this._collection.removeByTag(TerrainVisualizer.tag.boundary);

    this._hybridTerrain.terrainAreas.forEach((area) => {
      const rectangle = area.bounds.rectangle;
      const color = area.isCustom
        ? this._colors.get('custom') || Color.RED
        : this._colors.get('default') || Color.BLUE;

      this._collection.add(
        this._createRectangleEntity(rectangle, color),
        TerrainVisualizer.tag.boundary,
      );
      this._addRectangleCornerMarkers(rectangle, color);
    });

    this._showBoundaries = true;
  }

  hideBoundaries(): void {
    this._collection.removeByTag(TerrainVisualizer.tag.boundary);
    this._showBoundaries = false;
  }

  showTileGrid(level: number): void {
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
        const entity = this._createRectangleEntity(rect, color.withAlpha(0.3));
        entity.properties?.addProperty('tileX', x);
        entity.properties?.addProperty('tileY', y);
        entity.properties?.addProperty('tileLevel', level);

        this._collection.add(entity, TerrainVisualizer.tag.grid);
      }
    }

    this._showTileGrid = true;
  }

  hideTileGrid(): void {
    this._collection.removeByTag(TerrainVisualizer.tag.grid);
    this._showTileGrid = false;
  }

  private _createRectangleEntity(rectangle: Rectangle, color: Color) {
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

  private _addRectangleCornerMarkers(
    rectangle: Rectangle,
    color: Color,
    tag: string = TerrainVisualizer.tag.boundary,
  ): void {
    const corners = [
      Rectangle.northwest(rectangle),
      Rectangle.northeast(rectangle),
      Rectangle.southwest(rectangle),
      Rectangle.southeast(rectangle),
    ];

    corners.forEach((corner) => {
      const position = Cartesian3.fromRadians(
        corner.longitude,
        corner.latitude,
      );
      this._collection.add(
        new Entity({
          position,
          point: {
            color: color,
            pixelSize: 10,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            outlineColor: Color.WHITE,
            outlineWidth: 2,
          },
        }),
        tag,
      );
    });
  }

  private _getVisibleRectangle(): Rectangle | undefined {
    const camera = this._viewer.camera;
    const visibleArea = camera.computeViewRectangle();
    return visibleArea;
  }
}

export namespace TerrainVisualizer {
  export interface ConstructorOptions {
    colors?: Record<string, Color>;
    showBoundaries?: boolean;
    showTileGrid?: boolean;
    activeLevel?: number;
    terrainProvider?: HybridTerrainProvider;
  }

  export const tag = {
    default: 'Terrain Visualizer',
    boundary: 'Terrain Visualizer Boundary',
    grid: 'Terrain Visualizer Tile Grid',
  };
}
