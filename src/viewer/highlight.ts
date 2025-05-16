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

/**
 * @class
 * Lightweight multiton highlight manager for Cesium using a single reusable entity.
 *
 * @example
 * ```
 * // Setup
 * const viewer1 = new Viewer('cesiumContainer1');
 * const viewer2 = new Viewer('cesiumContainer2');
 *
 * const highlighter1 = Highlight.getInstance(viewer1);
 * const highlighter2 = Highlight.getInstance(viewer2);
 *
 * // This highlight only affects viewer1
 * highlighter1.show(someEntity, Color.RED);
 *
 * // This highlight only affects viewer2
 * highlighter2.show(someEntity, Color.BLUE);
 *
 * // When done with viewers
 * Highlight.releaseInstance(viewer1);
 * Highlight.releaseInstance(viewer2);
 * viewer1.destroy();
 * viewer2.destroy();
 * ```
 */
export class Highlight {
  private static instances = new Map<Element, Highlight>();
  private _defaultColor: Color = Color.YELLOW.withAlpha(0.5);
  private _highlightEntity?: Entity;
  private _viewerEntities: EntityCollection;

  /**
   * Creates a new `Highlight` instance.
   * @private Use {@link getInstance `Highlight.getInstance()`}
   * @param viewer A viewer to create highlight entity in
   */
  private constructor(viewer: Viewer) {
    this._viewerEntities = viewer.entities;

    // Create a single highlight entity that will be reused for all highlights
    this._highlightEntity = this._viewerEntities.add(
      new Entity({
        id: `highlight-entity-${Math.random().toString(36).substring(2)}`,
        show: false,
      }),
    );
  }

  /**
   * Gets or creates highlight instance from a viewer.
   * @param viewer The viewer to get or create a new instance from.
   */
  static getInstance(viewer: Viewer): Highlight {
    const container = viewer.container;
    if (!Highlight.instances.has(container)) {
      Highlight.instances.set(container, new Highlight(viewer));
    }
    return Highlight.instances.get(container)!;
  }

  /**
   * Releases the highlight instance associated with a viewer.
   * @param viewer The viewer whose highlight instance should be released.
   */
  static releaseInstance(viewer: Viewer): void {
    const container = viewer.container;
    const instance = Highlight.instances.get(container);
    if (instance) {
      instance.hide();

      if (instance._highlightEntity) {
        viewer.entities.remove(instance._highlightEntity);
      }

      Highlight.instances.delete(container);
    }
  }

  /**
   * Highlights a picked object by updating the reusable entity
   * @param picked The object returned from `scene.pick()` or `drillPick()`
   * @param color Optional color for the highlight. Defaults to yellow with 0.5 alpha.
   * @param outline Optional style for the highlight. Defaults to `false`.
   * @returns The entity being used for highlighting
   */
  show(
    picked: any,
    color: Color = this._defaultColor,
    outline: boolean = false,
  ): Entity | undefined {
    if (!defined(picked) || !this._highlightEntity) return undefined;

    // Clear any previous highlight geometries
    this._clearGeometries();

    try {
      if (picked instanceof Entity) {
        this._update(picked, color, outline);
      } else if (picked.id instanceof Entity) {
        this._update(picked.id, color, outline);
      } else if (picked.primitive instanceof GroundPrimitive) {
        this._update(picked.primitive, color, outline);
      } else {
        // No supported geometry found
        return undefined;
      }

      // Show the highlight entity
      this._highlightEntity.show = true;
      return this._highlightEntity;
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
    if (!this._highlightEntity) return;

    this._highlightEntity.polygon = undefined;
    this._highlightEntity.polyline = undefined;
    this._highlightEntity.rectangle = undefined;
  }

  /**
   * Updates the highlight entity from an Entity object
   * @private
   */
  private _update(from: Entity, color: Color, outline: boolean): void;
  /**
   * Updates the highlight entity from a GroundPrimitive
   * @private
   */
  private _update(from: GroundPrimitive, color: Color, outline: boolean): void;
  private _update(
    from: Entity | GroundPrimitive,
    color: Color,
    outline: boolean,
  ): void {
    if (!this._highlightEntity) return;
    if (from instanceof Entity) {
      if (from.polygon) {
        if (outline) {
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
            this._highlightEntity.polyline = new PolylineGraphics({
              positions: positions,
              material: color,
              width: 2,
              clampToGround:
                from.polygon.heightReference?.getValue() ===
                HeightReference.CLAMP_TO_GROUND,
            });
          }
        } else {
          // Create a new polygon property
          const hierarchy = from.polygon.hierarchy?.getValue();
          if (hierarchy) {
            this._highlightEntity.polygon = new PolygonGraphics({
              hierarchy: hierarchy,
              material: color,
              heightReference: from.polygon.heightReference?.getValue(),
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
          const originalWidth = from.polyline.width?.getValue() || 2;
          this._highlightEntity.polyline = new PolylineGraphics({
            positions: positions,
            material: color,
            width: originalWidth + 2,
            clampToGround: from.polyline.clampToGround?.getValue(),
          });
        }
      } else if (from.rectangle) {
        if (outline) {
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
            this._highlightEntity.polyline = new PolylineGraphics({
              positions: cornerPositions,
              material: color,
              width: 2,
              clampToGround:
                from.rectangle.heightReference?.getValue() ===
                HeightReference.CLAMP_TO_GROUND,
            });
          }
        } else {
          // Create a new rectangle property
          const coordinates = from.rectangle.coordinates?.getValue();
          if (coordinates) {
            this._highlightEntity.rectangle = new RectangleGraphics({
              coordinates: coordinates,
              material: color,
              heightReference: from.rectangle.heightReference?.getValue(),
            });
          }
        }
      }
    } else if (from instanceof GroundPrimitive) {
      const instances = from.geometryInstances;
      const instance = Array.isArray(instances) ? instances[0] : instances;

      if (!instance || !instance.geometry.attributes.position) return;

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

      if (outline) {
        // Create a new polyline property
        this._highlightEntity.polyline = new PolylineGraphics({
          positions: positions,
          material: color,
          width: 2,
          clampToGround: true,
        });
      } else {
        // Create a new polygon property
        this._highlightEntity.polygon = new PolygonGraphics({
          hierarchy: new PolygonHierarchy(positions),
          material: color,
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
    if (this._highlightEntity) {
      this._highlightEntity.show = false;
    }
  }

  /** Gets the default highlight color. */
  get defaultColor(): Color {
    return this._defaultColor;
  }

  /**
   * Sets the default highlight color.
   * @param color The new default color for highlights
   */
  set defaultColor(color: Color) {
    this._defaultColor = color;
  }

  /** Gets the highlight entity */
  get highlightEntity(): Entity | undefined {
    return this._highlightEntity;
  }
}
