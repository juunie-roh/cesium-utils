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
      instance.clearAll();
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
      highlight = this._highlightEntity(picked, color);
    } else if (picked.id instanceof Entity) {
      if (this._activeHighlights.has(picked.id)) return picked.id;
      highlight = this._highlightEntity(picked.id, color);
    } else if (picked.primitive instanceof GroundPrimitive) {
      if (this._activeHighlights.has(picked.primitive)) return picked.primitive;
      highlight = this._highlightGroundPrimitive(
        picked.primitive,
        color,
        outline,
      );
    }

    if (highlight) {
      this._activeHighlights.add(highlight);
    }

    return highlight;
  }

  /**
   * Clears a specific highlight.
   * @param highlight The highlight object to clear
   */
  clear(highlight: Entity): void {
    this._entities.remove(highlight);
    this._activeHighlights.delete(highlight);
  }

  /**
   * Clears all highlights.
   */
  clearAll(): void {
    this._entities.remove('Highlights');
    this._activeHighlights.clear();
  }

  /**
   * Sets the default highlight color.
   * @param color The new default color for highlights
   */
  set defaultColor(color: Color) {
    this._defaultColor = color;
  }
  /** Gets the default highlight color. */
  get defaultColor(): Color {
    return this._defaultColor;
  }

  /**
   * Highlights a Ground Primitive by creating a ground-clamped Entity.
   * @private
   * @param primitive The GroundPrimitive object to highlight
   * @param color The color to use for the highlight
   * @param outline Whether to create an outline (polyline) instead of a filled polygon
   * @returns The created Entity
   */
  private _highlightGroundPrimitive(
    primitive: GroundPrimitive,
    color: Color,
    outline: boolean = false,
  ): Entity | undefined {
    try {
      const instances = primitive.geometryInstances;
      const instance: GeometryInstance = Array.isArray(instances)
        ? instances[0]
        : instances;

      if (!instance || !instance.geometry.attributes.position) return undefined;

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
        id: `highlight-${instance.id || 'groundPrimitive'}`,
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

      const highlightEntity = new Entity(options);

      // Add to collection
      this._entities.add(highlightEntity);
      return highlightEntity;
    } catch (error) {
      console.error('Failed to highlight Ground Primitive:', error);
      return undefined;
    }
  }

  /**
   * Highlights an Entity.
   * @private
   * @param entity The Entity to highlight
   * @param color The color to use for the highlight
   * @returns The created Entity
   */
  private _highlightEntity(entity: Entity, color: Color): Entity | undefined {
    try {
      // Create properties for the highlight entity
      const options: Entity.ConstructorOptions = {
        id: `highlight-${entity.id}`,
      };

      // Copy appropriate geometry from the original entity
      if (entity.polygon) {
        options.polygon = {
          hierarchy: entity.polygon.hierarchy?.getValue(),
          material: color,
          classificationType: ClassificationType.BOTH,
        };
      } else if (entity.polyline) {
        options.polyline = {
          positions: entity.polyline.positions?.getValue(),
          width: (entity.polyline.width?.getValue() || 2) + 2,
          material: color,
          clampToGround: true,
        };
      } else if (entity.rectangle) {
        options.rectangle = {
          coordinates: entity.rectangle.coordinates?.getValue(),
          material: color,
        };
      } else {
        return undefined;
      }

      const highlightEntity = new Entity(options);
      this._entities.add(highlightEntity);
      return highlightEntity;
    } catch (error) {
      console.error('Failed to highlight Entity:', error);
      return undefined;
    }
  }

  /** Gets a collection for `Entity` used to highlight. */
  get entities(): Collection<EntityCollection, Entity> {
    return this._entities;
  }

  /** Gets all active highlights */
  get activeHighlights(): Set<Entity> {
    return this._activeHighlights;
  }
}

export { Highlight };
