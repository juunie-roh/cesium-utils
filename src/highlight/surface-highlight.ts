import {
  Cartesian3,
  ClassificationType,
  Color,
  defined,
  Entity,
  EntityCollection,
  GroundPrimitive,
  HeightReference,
  PolygonGraphics,
  PolygonHierarchy,
  PolylineGraphics,
  RectangleGraphics,
  Viewer,
} from 'cesium';

import type { HighlightOptions, IHighlight } from './highlight.types.js';

/**
 * @class
 * A flyweight implementation for highlighting 2D surface objects in Cesium.
 *
 * This class provides efficient highlighting for ground-clamped geometries (polygons, polylines, rectangles)
 *
 * **Supported Geometry Types:**
 * - `Entity` with polygon, polyline, or rectangle graphics
 * - `GroundPrimitive` instances
 *
 * **Highlighting Modes:**
 * - **Fill mode** (default): Creates a filled geometry using the original shape
 * - **Outline mode**: Creates a polyline outline of the original geometry
 *
 * @example
 * ```typescript
 * // Basic usage
 * const viewer = new Viewer('cesiumContainer');
 * const surfaceHighlight = new SurfaceHighlight(viewer);
 *
 * // Highlight an entity with default red fill
 * const entity = viewer.entities.add(new Entity({
 *   polygon: {
 *     hierarchy: Cartesian3.fromDegreesArray([-75, 35, -74, 35, -74, 36, -75, 36]),
 *     material: Color.BLUE
 *   }
 * }));
 * surfaceHighlight.show(entity);
 * ```
 */
export default class SurfaceHighlight implements IHighlight {
  private _color: Color = Color.RED;
  private _entity: Entity;
  private _entities: EntityCollection;

  /**
   * Creates a new `SurfaceHighlight` instance.
   * @param viewer A viewer to create highlight entity in
   */
  constructor(viewer: Viewer) {
    this._entities = viewer.entities;

    // Create a single highlight entity that will be reused for all highlights
    this._entity = this._entities.add(
      new Entity({
        id: `highlight-entity-${Math.random().toString(36).substring(2)}`,
        show: false,
      }),
    );
  }

  /**
   * Highlights a picked object by updating the reusable entity
   * @param object The object to be highlighted.
   * @param options Optional style for the highlight.
   * @see {@link HighlightOptions}
   */
  show(
    object: Entity | GroundPrimitive,
    options?: HighlightOptions,
  ): Entity | undefined {
    if (!defined(object) || !this._entity) return undefined;

    // Clear any previous highlight geometries
    this._clearGeometries();

    try {
      if (
        object instanceof Entity &&
        (object.polygon || object.polyline || object.rectangle)
      ) {
        this._update(object, options);
      } else if (object instanceof GroundPrimitive) {
        this._update(object, options);
      } else {
        // No supported geometry found
        return undefined;
      }

      // Show the highlight entity
      this._entity.show = true;
      return this._entity;
    } catch (error) {
      console.error('Failed to highlight object:', error);
      return undefined;
    }
  }

  /**
   * Removes all geometry properties from the highlight entity
   * @private
   */
  private _clearGeometries(): void {
    this._entity.polygon = undefined;
    this._entity.polyline = undefined;
    this._entity.rectangle = undefined;
  }

  /**
   * Updates the highlight entity from an Entity object
   * @private
   */
  private _update(from: Entity, options?: HighlightOptions): void;
  /**
   * Updates the highlight entity from a GroundPrimitive
   * @private
   */
  private _update(from: GroundPrimitive, options?: HighlightOptions): void;
  private _update(
    from: Entity | GroundPrimitive,
    options = { color: this._color, outline: false, width: 2 },
  ): void {
    if (from instanceof Entity) {
      if (from.polygon) {
        if (options.outline) {
          const hierarchy = from.polygon.hierarchy?.getValue();
          if (hierarchy && hierarchy.positions) {
            let positions;
            if (
              hierarchy.positions.length > 0 &&
              !Cartesian3.equals(
                hierarchy.positions[0],
                hierarchy.positions[hierarchy.positions.length - 1],
              )
            ) {
              // Need to close the loop - copy and add first point
              positions = [...hierarchy.positions, hierarchy.positions[0]];
            } else {
              // Already closed or empty
              positions = hierarchy.positions;
            }

            // Create a new polyline property
            this._entity.polyline = new PolylineGraphics({
              positions,
              material: options.color,
              width: options.width || 2,
              clampToGround: true,
            });
          }
        } else {
          // Create a new polygon property
          const hierarchy = from.polygon.hierarchy?.getValue();
          if (hierarchy) {
            this._entity.polygon = new PolygonGraphics({
              hierarchy,
              material: options.color,
              heightReference: HeightReference.CLAMP_TO_GROUND,
              classificationType:
                from.polygon.classificationType?.getValue() ||
                ClassificationType.BOTH,
            });
          }
        }
      } else if (from.polyline) {
        // Create a new polyline property
        const positions = from.polyline.positions?.getValue();
        if (positions) {
          const originalWidth = from.polyline.width?.getValue();
          this._entity.polyline = new PolylineGraphics({
            positions,
            material: options.color,
            width: originalWidth + (options.width || 2),
            clampToGround: true,
          });
        }
      } else if (from.rectangle) {
        if (options.outline) {
          const rectangleCoords = from.rectangle.coordinates?.getValue();
          if (rectangleCoords) {
            // Convert rectangle to corner positions
            const cornerPositions = [
              Cartesian3.fromRadians(
                rectangleCoords.west,
                rectangleCoords.north,
              ),
              Cartesian3.fromRadians(
                rectangleCoords.east,
                rectangleCoords.north,
              ),
              Cartesian3.fromRadians(
                rectangleCoords.east,
                rectangleCoords.south,
              ),
              Cartesian3.fromRadians(
                rectangleCoords.west,
                rectangleCoords.south,
              ),
              Cartesian3.fromRadians(
                rectangleCoords.west,
                rectangleCoords.north,
              ), // Close the loop
            ];

            // Create a new polyline property
            this._entity.polyline = new PolylineGraphics({
              positions: cornerPositions,
              material: options.color,
              width: options.width || 2,
              clampToGround: true,
            });
          }
        } else {
          // Create a new rectangle property
          const coordinates = from.rectangle.coordinates?.getValue();
          if (coordinates) {
            this._entity.rectangle = new RectangleGraphics({
              coordinates,
              material: options.color,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            });
          }
        }
      }
    } else if (from instanceof GroundPrimitive) {
      const instances = from.geometryInstances;
      const instance = Array.isArray(instances) ? instances[0] : instances;

      if (!instance.geometry.attributes.position) return;

      // Extract positions from geometry
      const positionValues = instance.geometry.attributes.position.values;
      const positions: Cartesian3[] = [];

      // Position values are stored as a flat array of x,y,z components
      for (let i = 0; i < positionValues.length; i += 3) {
        positions.push(
          new Cartesian3(
            positionValues[i],
            positionValues[i + 1],
            positionValues[i + 2],
          ),
        );
      }

      if (options.outline) {
        // Create a new polyline property
        this._entity.polyline = new PolylineGraphics({
          positions,
          material: options.color,
          width: options.width || 2,
          clampToGround: true,
        });
      } else {
        // Create a new polygon property
        this._entity.polygon = new PolygonGraphics({
          hierarchy: new PolygonHierarchy(positions),
          material: options.color,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          classificationType: ClassificationType.BOTH,
        });
      }
    }
  }

  /**
   * Clears the current highlight
   */
  hide(): void {
    if (this._entity) {
      this._entity.show = false;
    }
  }

  /** Clean up the instances */
  destroy(): void {
    if (this._entities.contains(this._entity)) {
      this._entities.remove(this._entity);
    }
  }

  /** Gets the highlight color. */
  get color(): Color {
    return this._color;
  }

  /** Sets the highlight color. */
  set color(color: Color) {
    this._color = color;
  }

  /** Gets the highlight entity */
  get entity(): Entity {
    return this._entity;
  }
}
