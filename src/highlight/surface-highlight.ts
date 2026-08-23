import type { EntityCollection, Viewer } from "cesium";
import {
  Cartesian3,
  ClassificationType,
  Color,
  ConstantPositionProperty,
  defined,
  Entity,
  GroundPrimitive,
  HeightReference,
  PointGraphics,
  PolygonGraphics,
  PolygonHierarchy,
  PolylineGraphics,
  RectangleGraphics,
} from "cesium";

/** Pixel size of the ring marker used to highlight billboard and label entities. */
const MARKER_PIXEL_SIZE = 20;

import Highlight from "./highlight.js";

/**
 * @class
 * A flyweight implementation for highlighting 2D surface objects in Cesium.
 *
 * This class provides highlighting for ground-clamped geometries (polygons, polylines, rectangles)
 * and position marker highlighting for point-like entities (point, billboard, label).
 *
 * **Supported Geometry Types:**
 * - `Entity` with polygon, polyline, or rectangle graphics
 * - `Entity` with point, billboard, or label graphics (drawn as a ring marker at the entity's position)
 * - `GroundPrimitive` instances
 *
 * **Highlighting Modes:**
 * - **Fill mode** (default): Creates a filled geometry using the original shape
 * - **Outline mode**: Creates a polyline outline of the original geometry
 *
 * Point, billboard, and label entities are always highlighted with a ring marker
 * (transparent fill, colored outline) regardless of the `outline` option, since a
 * filled marker would obscure the icon or text being highlighted.
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
export default class SurfaceHighlight implements Highlight.Base {
  private _color: Color = Color.RED;
  private _entity: Entity;
  private _entities: EntityCollection;
  private _currentObject: Entity | GroundPrimitive | undefined;
  private _currentOptions: Highlight.Options | undefined;

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

  /** Gets the currently highlighted object */
  get currentObject(): Entity | GroundPrimitive | undefined {
    return this._currentObject;
  }

  /**
   * Highlights a picked object by updating the reusable entity
   * @param object The object to be highlighted.
   * @param options Optional style for the highlight.
   * @see {@link Highlight.Options}
   */
  show(
    object: Entity | GroundPrimitive,
    options?: Highlight.Options,
  ): Entity | undefined {
    if (!defined(object) || !this._entity) return undefined;

    // Check if we're highlighting the same object with the same options
    if (
      this._currentObject === object &&
      this._optionsEqual(this._currentOptions, options)
    ) {
      // Same object and options - no need to update
      return this._entity;
    }

    // Clear any previous highlight geometries
    this._clearGeometries();

    try {
      if (
        object instanceof Entity &&
        (object.polygon ||
          object.polyline ||
          object.rectangle ||
          object.point ||
          object.billboard ||
          object.label)
      ) {
        this._update(object, options);
      } else if (object instanceof GroundPrimitive) {
        this._update(object, options);
      } else {
        // No supported geometry found
        this._currentObject = undefined;
        this._currentOptions = undefined;
        return undefined;
      }

      // Store current object and options for next comparison
      this._currentObject = object;
      this._currentOptions = options ? { ...options } : undefined;

      // Show the highlight entity
      this._entity.show = true;
      return this._entity;
    } catch (error) {
      console.error("Failed to highlight object:", error);
      this._currentObject = undefined;
      this._currentOptions = undefined;
      return undefined;
    }
  }

  /**
   * Clears the current highlight
   */
  hide(): void {
    if (this._entity) {
      this._entity.show = false;
    }
    // Clear tracking of current object
    this._currentObject = undefined;
    this._currentOptions = undefined;
  }

  /** Clean up the instances */
  destroy(): void {
    if (this._entities.contains(this._entity)) {
      this._entities.remove(this._entity);
    }
    this._currentObject = undefined;
    this._currentOptions = undefined;
  }

  /**
   * Compares two Highlight.Options objects for equality
   * @private
   */
  private _optionsEqual(
    options1: Highlight.Options | undefined,
    options2: Highlight.Options | undefined,
  ): boolean {
    // Both undefined
    if (!options1 && !options2) return true;

    // One undefined, one defined
    if (!options1 || !options2) return false;

    // Compare properties
    return (
      options1.outline === options2.outline &&
      options1.width === options2.width &&
      Color.equals(options1.color || this._color, options2.color || this._color)
    );
  }

  /**
   * Removes all geometry properties from the highlight entity
   * @private
   */
  private _clearGeometries(): void {
    this._entity.polygon = undefined;
    this._entity.polyline = undefined;
    this._entity.rectangle = undefined;
    this._entity.point = undefined;
    this._entity.position = undefined;
  }

  /**
   * Updates the highlight entity from an Entity object
   * @private
   */
  private _update(from: Entity, options?: Highlight.Options): void;
  /**
   * Updates the highlight entity from a GroundPrimitive
   * @private
   */
  private _update(from: GroundPrimitive, options?: Highlight.Options): void;
  private _update(
    from: Entity | GroundPrimitive,
    options: Highlight.Options = {
      color: this._color,
      outline: false,
      width: 2,
    },
  ): void {
    if (from instanceof GroundPrimitive) {
      this._updateFromGroundPrimitive(from, options);
      return;
    }
    if (from.polygon) {
      this._updateFromPolygon(from.polygon, options);
      return;
    }
    if (from.polyline) {
      this._updateFromPolyline(from.polyline, options);
      return;
    }
    if (from.rectangle) {
      this._updateFromRectangle(from.rectangle, options);
      return;
    }
    if (from.point || from.billboard || from.label) {
      this._updateFromMarker(from, options);
    }
  }

  /**
   * Updates the highlight entity from polygon graphics
   * @private
   */
  private _updateFromPolygon(
    polygon: NonNullable<Entity["polygon"]>,
    options: Highlight.Options,
  ): void {
    if (options.outline) {
      this._updatePolygonOutline(polygon, options);
      return;
    }

    const hierarchy = polygon.hierarchy?.getValue();
    if (!hierarchy) return;

    this._entity.polygon = new PolygonGraphics({
      hierarchy,
      material: options.color,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      classificationType:
        polygon.classificationType?.getValue() || ClassificationType.BOTH,
    });
  }

  /** @private */
  private _updatePolygonOutline(
    polygon: NonNullable<Entity["polygon"]>,
    options: Highlight.Options,
  ): void {
    const hierarchy = polygon.hierarchy?.getValue();
    if (!hierarchy || !hierarchy.positions) return;

    const isClosed =
      hierarchy.positions.length === 0 ||
      Cartesian3.equals(
        hierarchy.positions[0],
        hierarchy.positions[hierarchy.positions.length - 1],
      );
    // Close the loop when the source polygon isn't already closed
    const positions = isClosed
      ? hierarchy.positions
      : [...hierarchy.positions, hierarchy.positions[0]];

    this._entity.polyline = new PolylineGraphics({
      positions,
      material: options.color,
      width: options.width || 2,
      clampToGround: true,
    });
  }

  /**
   * Updates the highlight entity from polyline graphics, preserving the
   * original's ground clamping and arc type instead of forcing it onto the ground.
   * @private
   */
  private _updateFromPolyline(
    polyline: NonNullable<Entity["polyline"]>,
    options: Highlight.Options,
  ): void {
    const positions = polyline.positions?.getValue();
    if (!positions) return;

    const originalWidth = polyline.width?.getValue() ?? 2;
    this._entity.polyline = new PolylineGraphics({
      positions,
      material: options.color,
      width: originalWidth + (options.width || 2),
      clampToGround: polyline.clampToGround?.getValue() ?? false,
      arcType: polyline.arcType?.getValue(),
    });
  }

  /**
   * Updates the highlight entity from rectangle graphics
   * @private
   */
  private _updateFromRectangle(
    rectangle: NonNullable<Entity["rectangle"]>,
    options: Highlight.Options,
  ): void {
    if (options.outline) {
      this._updateRectangleOutline(rectangle, options);
      return;
    }

    const coordinates = rectangle.coordinates?.getValue();
    if (!coordinates) return;

    this._entity.rectangle = new RectangleGraphics({
      coordinates,
      material: options.color,
      heightReference: HeightReference.CLAMP_TO_GROUND,
    });
  }

  /** @private */
  private _updateRectangleOutline(
    rectangle: NonNullable<Entity["rectangle"]>,
    options: Highlight.Options,
  ): void {
    const coordinates = rectangle.coordinates?.getValue();
    if (!coordinates) return;

    // Convert rectangle to corner positions, closing the loop
    const cornerPositions = [
      Cartesian3.fromRadians(coordinates.west, coordinates.north),
      Cartesian3.fromRadians(coordinates.east, coordinates.north),
      Cartesian3.fromRadians(coordinates.east, coordinates.south),
      Cartesian3.fromRadians(coordinates.west, coordinates.south),
      Cartesian3.fromRadians(coordinates.west, coordinates.north),
    ];

    this._entity.polyline = new PolylineGraphics({
      positions: cornerPositions,
      material: options.color,
      width: options.width || 2,
      clampToGround: true,
    });
  }

  /**
   * Updates the highlight entity from a GroundPrimitive
   * @private
   */
  private _updateFromGroundPrimitive(
    from: GroundPrimitive,
    options: Highlight.Options,
  ): void {
    const instances = from.geometryInstances;
    const instance = Array.isArray(instances) ? instances[0] : instances;
    if (!instance.geometry.attributes.position) return;

    // Position values are stored as a flat array of x,y,z components
    const positionValues = instance.geometry.attributes.position.values;
    const positions: Cartesian3[] = [];
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
      this._entity.polyline = new PolylineGraphics({
        positions,
        material: options.color,
        width: options.width || 2,
        clampToGround: true,
      });
      return;
    }

    this._entity.polygon = new PolygonGraphics({
      hierarchy: new PolygonHierarchy(positions),
      material: options.color,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      classificationType: ClassificationType.BOTH,
    });
  }

  /**
   * Updates the highlight entity with a ring marker at the entity's position.
   * Used for point, billboard, and label entities, which have no comparable
   * outline geometry of their own.
   * @private
   */
  private _updateFromMarker(from: Entity, options: Highlight.Options): void {
    const position = from.position?.getValue();
    if (!position) return;

    const width = options.width || 2;
    const pixelSize = from.point
      ? (from.point.pixelSize?.getValue() ?? 10) + width * 2
      : MARKER_PIXEL_SIZE;

    this._entity.position = new ConstantPositionProperty(position);
    this._entity.point = new PointGraphics({
      pixelSize,
      color: Color.TRANSPARENT,
      outlineColor: options.color,
      outlineWidth: width,
    });
  }
}
