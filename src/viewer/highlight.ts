import {
  Cartesian3,
  ClassificationType,
  Color,
  defined,
  Entity,
  EntityCollection,
  GeometryInstance,
  GroundPrimitive,
  PerInstanceColorAppearance,
  PrimitiveCollection,
  Viewer,
} from 'cesium';

import Collection from '@/collection/collection.js';

/**
 * @class
 * Multiton class for managing highlighted features in a Cesium scene.
 * Maintains separate collections for different types of highlighted objects.
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
  private static instances = new Map<Viewer, Highlight>();
  private _activeHighlights: Set<Entity | GroundPrimitive> = new Set();
  private _defaultColor: Color = Color.YELLOW.withAlpha(0.5);
  private _viewer: Viewer;
  private _entities: Collection<EntityCollection, Entity>;
  private _groundPrimitives: Collection<PrimitiveCollection, GroundPrimitive>;

  /**
   * Creates a new `Highlight` instance.
   * @private Use {@link getInstance `Highlight.getInstance()`}
   * @param viewer A viewer for the highlight collections to be derived from.
   */
  private constructor(viewer: Viewer) {
    this._viewer = viewer;
    this._entities = new Collection({
      collection: viewer.entities,
      tag: 'Highlight',
    });
    this._groundPrimitives = new Collection({
      collection: viewer.scene.groundPrimitives,
      tag: 'Highlight',
    });
  }

  /**
   * Gets or creates highlight instance from a viewer.
   * @param viewer The viewer to get or create a new instance from.
   */
  static getInstance(viewer: Viewer): Highlight {
    if (!Highlight.instances.has(viewer)) {
      Highlight.instances.set(viewer, new Highlight(viewer));
    }
    return Highlight.instances.get(viewer)!;
  }

  /**
   * Releases the highlight instance associated with a viewer.
   * Call this when the viewer is being destroyed.
   * @param viewer The viewer whose highlight instance should be released.
   */
  static releaseInstance(viewer: Viewer): void {
    const instance = Highlight.instances.get(viewer);
    if (instance) {
      instance.clearAll(); // Clean up any remaining highlights
      Highlight.instances.delete(viewer);
    }
  }

  /**
   * Highlights a picked object from the scene.
   * @param picked The object returned from `scene.pick()` or `drillPick()`
   * @param color Optional color for the highlight. Defaults to yellow with 0.5 alpha.
   * @returns The newly created highlight object
   */
  add(
    picked: any,
    color: Color = this._defaultColor,
  ): Entity | GroundPrimitive | undefined {
    if (!defined(picked)) return undefined;

    let highlight: Entity | GroundPrimitive | undefined;

    if (this._activeHighlights.has(picked ?? picked.id ?? picked.primitive))
      return;
    if (picked instanceof Entity) {
      highlight = this._highlightEntity(picked, color);
    } else if (picked.id instanceof Entity) {
      highlight = this._highlightEntity(picked.id, color);
    } else if (picked.primitive instanceof GroundPrimitive) {
      highlight = this._highlightGroundPrimitive(picked.primitive, color);
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
  clear(highlight: Entity | GroundPrimitive): void {
    if (highlight instanceof Entity) {
      this._entities.remove(highlight);
    } else {
      this._groundPrimitives.remove(highlight);
    }
    this._activeHighlights.delete(highlight);
  }

  /**
   * Clears all highlights.
   */
  clearAll(): void {
    this._entities.remove('Highlight');
    this._groundPrimitives.remove('Highlight');
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
   * Highlights a Ground Primitive.
   * @private
   * @param object The object containing a Ground Primitive
   * @param color The color to use for the highlight
   * @returns The created GroundPrimitive
   *
   * @todo Add `outline` option that creates polyline entity based on positions from the geometry.
   */
  private _highlightGroundPrimitive(
    primitive: GroundPrimitive,
    color: Color,
  ): GroundPrimitive | undefined {
    try {
      const instances = primitive.geometryInstances;
      const instance: GeometryInstance = Array.isArray(instances)
        ? instances[0]
        : instances;

      if (!instance) return undefined;

      // Create highlight primitive
      const highlightPrimitive = new GroundPrimitive({
        geometryInstances: new GeometryInstance({
          geometry: instance.geometry,
          attributes: {
            color: Color.fromCssColorString(color.toCssColorString()),
          },
        }),
        appearance: new PerInstanceColorAppearance({
          flat: true,
          translucent: true,
        }),
        classificationType: ClassificationType.BOTH,
      });

      // Add to collection
      this._groundPrimitives.add(highlightPrimitive);
      return highlightPrimitive;
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
      const highlightOptions: Entity.ConstructorOptions = {
        id: `highlight-${entity.id}`,
      };

      // Copy appropriate geometry from the original entity
      if (entity.polygon) {
        highlightOptions.polygon = {
          hierarchy: entity.polygon.hierarchy?.getValue(),
          material: color,
          classificationType: ClassificationType.BOTH,
        };
      } else if (entity.polyline) {
        highlightOptions.polyline = {
          positions: entity.polyline.positions?.getValue(),
          width: (entity.polyline.width?.getValue() || 2) + 2,
          material: color,
          clampToGround: true,
        };
      } else if (entity.rectangle) {
        highlightOptions.rectangle = {
          coordinates: entity.rectangle.coordinates?.getValue(),
          material: color,
        };
      } else {
        // Default highlighting for other entity types
        highlightOptions.ellipsoid = {
          radii: new Cartesian3(20, 20, 20),
          material: color,
        };
        highlightOptions.position = entity.position?.getValue();
      }

      const highlightEntity = new Entity(highlightOptions);
      this._entities.add(highlightEntity);
      return highlightEntity;
    } catch (error) {
      console.error('Failed to highlight Entity:', error);
      return undefined;
    }
  }

  /** Gets a viewer which this class derived from. */
  get viewer(): Viewer {
    return this._viewer;
  }

  /** Gets a collection for `Entity` used to highlight. */
  get entities(): Collection<EntityCollection, Entity> {
    return this._entities;
  }

  /** Gets a collection for `GroundPrimitive` used to highlight. */
  get groundPrimitives(): Collection<PrimitiveCollection, GroundPrimitive> {
    return this._groundPrimitives;
  }

  /** Gets all active highlights */
  get activeHighlights(): Set<Entity | GroundPrimitive> {
    return this._activeHighlights;
  }
}

export { Highlight };
