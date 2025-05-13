import {
  Cartesian3,
  ClassificationType,
  Color,
  defined,
  Entity,
  EntityCollection,
  GeometryInstance,
  GroundPrimitive,
  HeightReference,
  PolygonHierarchy,
  Viewer,
} from 'cesium';

import Collection from '@/collection/collection.js';

/**
 * @class
 * Multiton class for managing highlighted features in a Cesium scene using Entity Collection.
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
 * highlighter1.add(someEntity, Color.RED);
 *
 * // This highlight only affects viewer2
 * highlighter2.add(someEntity, Color.BLUE);
 *
 * // When done with viewers
 * Highlight.releaseInstance(viewer1);
 * Highlight.releaseInstance(viewer2);
 * viewer1.destroy();
 * viewer2.destroy();
 * ```
 */
class Highlight {
  /**
   * A map for viewer identification.
   * @private @static
   */
  private static instances = new Map<Element, Highlight>();
  /**
   * A set of highlighted entities.
   * @private
   */
  private _activeHighlights: Set<Entity> = new Set();
  /**
   * The default highlight color.
   * @private
   */
  private _defaultColor: Color = Color.YELLOW.withAlpha(0.5);
  /**
   * A collection for handling highlight entities internally.
   * @private
   */
  private _entities: Collection<EntityCollection, Entity>;
  private _cache = new Map<string, Entity>();

  /**
   * Creates a new `Highlight` instance.
   * @private Use {@link getInstance `Highlight.getInstance()`}
   * @param viewer A viewer for the highlight collections to be derived from.
   */
  private constructor(viewer: Viewer) {
    this._entities = new Collection({
      collection: viewer.entities,
      tag: 'Highlights',
    });
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
      instance.removeAll();
      Highlight.instances.delete(container);
    }
  }

  /**
   * Highlights a picked object from the scene.
   * @param picked The object returned from `scene.pick()` or `drillPick()`
   * @param color Optional color for the highlight. Defaults to yellow with 0.5 alpha.
   * @param outline Optional style for the highlight. Defaults to `false`.
   * @returns The newly created highlight object
   */
  add(
    picked: any,
    color: Color = this._defaultColor,
    outline: boolean = false,
  ): Entity | undefined {
    if (!defined(picked)) return undefined;

    let highlight: Entity | undefined;

    if (picked instanceof Entity) {
      if (this._activeHighlights.has(picked)) return picked;
      highlight = this._createEntity(picked, color, outline);
    } else if (picked.id instanceof Entity) {
      if (this._activeHighlights.has(picked.id)) return picked.id;
      highlight = this._createEntity(picked.id, color, outline);
    } else if (picked.primitive instanceof GroundPrimitive) {
      if (this._activeHighlights.has(picked.primitive)) return picked.primitive;
      highlight = this._createEntity(picked.primitive, color, outline);
    }

    if (highlight) {
      this._entities.add(highlight);
      this._activeHighlights.add(highlight);
      if (!highlight.isShowing) highlight.show = true;
    }

    return highlight;
  }

  /**
   * Clears a specific highlight.
   * @param highlight The highlight object to clear
   */
  remove(highlight: Entity): void {
    this._entities.remove(highlight);
    this._activeHighlights.delete(highlight);
  }

  /**
   * Clears all highlights.
   */
  removeAll(): void {
    this._entities.remove('Highlights');
    this._activeHighlights.clear();
  }

  /**
   * Gets a unique identifier for a geometry instance.
   * @private
   * @param instance The geometry instance
   * @returns A unique string identifier
   */
  private _getGeometryId(instance: GeometryInstance): string | undefined {
    if (instance.id) {
      return `geometry-${instance.id}`;
    }

    // Create a hash from position attributes
    if (instance.geometry?.attributes?.position) {
      const positions = instance.geometry.attributes.position.values;

      let hash = '';

      // Use the first 3 points (9 values) and last 3 points
      const sampleSize = Math.min(9, positions.length / 4);

      // Sample beginning
      for (let i = 0; i < sampleSize; i++) {
        hash += Math.round(positions[i]) + '-';
      }

      // Sample end
      if (positions.length > sampleSize * 2) {
        for (let i = positions.length - sampleSize; i < positions.length; i++) {
          hash += Math.round(positions[i]);
        }
      }

      return `geometry-hash-${hash}`;
    }

    return undefined;
  }

  /**
   * Highlights a Ground Primitive by creating a ground-clamped Entity.
   * @private
   * @param from The GroundPrimitive object to create from
   * @param color The color to use for the highlight
   * @param outline Whether to create an outline (polyline) instead of a filled polygon
   * @returns The created Entity
   */
  private _createEntity(
    from: GroundPrimitive,
    color: Color,
    outline: boolean,
  ): Entity | undefined;
  /**
   * Highlights an Entity.
   * @private
   * @param from The Entity to highlight
   * @param color The color to use for the highlight
   * @returns The created Entity
   */
  private _createEntity(
    from: Entity,
    color: Color,
    outline: boolean,
  ): Entity | undefined;
  private _createEntity(
    from: GroundPrimitive | Entity,
    color: Color,
    outline: boolean = false,
  ): Entity | undefined {
    try {
      if (from instanceof GroundPrimitive) {
        const instances = from.geometryInstances;
        const instance: GeometryInstance = Array.isArray(instances)
          ? instances[0]
          : instances;

        if (!instance || !instance.geometry.attributes.position)
          return undefined;

        const geometryId = this._getGeometryId(instance);

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

        // Create entity options
        const options: Entity.ConstructorOptions = {
          id: geometryId ? `highlight-${geometryId}` : undefined,
        };

        if (outline) {
          // Create an outline (polyline) highlight
          options.polyline = {
            positions: positions,
            width: 2,
            material: color,
            clampToGround: true,
          };
        } else {
          // Create a filled polygon highlight
          options.polygon = {
            hierarchy: new PolygonHierarchy(positions),
            material: color,
            classificationType: ClassificationType.BOTH,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          };
        }

        return new Entity(options);
      } else {
        // Create properties for the highlight entity
        const options: Entity.ConstructorOptions = {
          id: `highlight-${from.id}`,
        };

        // Copy appropriate geometry from the original entity
        if (from.polygon) {
          if (outline) {
            options.polyline = {
              positions: from.polygon.hierarchy?.getValue().positions,
              material: color,
              width: 2,
              clampToGround:
                from.polygon.heightReference?.getValue() ===
                HeightReference.CLAMP_TO_GROUND,
            };
          } else {
            options.polygon = {
              hierarchy: from.polygon.hierarchy?.getValue(),
              material: color,
              classificationType: ClassificationType.BOTH,
            };
          }
        } else if (from.polyline) {
          // polyline doesn't support the outline option.
          options.polyline = {
            positions: from.polyline.positions,
            width: (from.polyline.width?.getValue() || 2) + 2,
            material: color,
            clampToGround: from.polyline.clampToGround,
          };
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

              options.polyline = {
                positions: cornerPositions,
                material: color,
                width: 2,
                clampToGround:
                  from.rectangle.heightReference?.getValue() ===
                  HeightReference.CLAMP_TO_GROUND,
              };
            }
          } else {
            options.rectangle = from.rectangle.clone();
            options.rectangle.material = color;
          }
        } else {
          return undefined;
        }

        return new Entity(options);
      }
    } catch (error) {
      console.error('Failed to create highlight Entity:', error);
      return undefined;
    }
  }

  /** Gets all active highlights */
  get activeHighlights(): readonly Entity[] {
    return Array.from(this._activeHighlights);
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
  /** Gets a collection for `Entity` used to highlight. */
  get entities(): Collection<EntityCollection, Entity> {
    return this._entities;
  }
}

export { Highlight };
