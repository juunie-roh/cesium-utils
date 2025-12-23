import type {
  Billboard,
  Cesium3DTileset,
  DataSource,
  Entity,
  GroundPrimitive,
  ImageryLayer,
  Label,
  PointPrimitive,
  Polyline,
  Primitive,
} from "cesium";
import {
  DataSourceCollection,
  defined,
  EntityCollection,
  ImageryLayerCollection,
  PrimitiveCollection,
} from "cesium";

import {
  isGetterOnly,
  type NestedKeyOf,
  type NestedValueOf,
} from "@/dev/index.js";

/**
 * @class
 * A wrapper class that enhances Cesium collection objects with tagging functionality.
 * This class provides a consistent API for working with different types of Cesium collections
 * and allows grouping and manipulating collection items by custom tags.
 *
 * @template C - The type of Cesium collection (e.g., EntityCollection, PrimitiveCollection)
 * @template I - The type of items in the collection (e.g., Entity, Primitive)
 *
 * @example
 * // Example 1: Managing Complex Scene with Multiple Object Types
 * class SceneOrganizer {
 *   private entities: Collection<EntityCollection, Entity>;
 *   private billboards: Collection<BillboardCollection, Billboard>;
 *   private primitives: Collection<PrimitiveCollection, Primitive>;
 *
 *   constructor(viewer: Viewer) {
 *     this.entities = new Collection({ collection: viewer.entities });
 *     this.billboards = new Collection({
 *       collection: viewer.scene.primitives.add(new BillboardCollection())
 *     });
 *     this.primitives = new Collection({
 *       collection: viewer.scene.primitives
 *     });
 *   }
 *
 *   // Unified API across different collection types!
 *   showLayer(layerName: string) {
 *     this.entities.show(layerName);
 *     this.billboards.show(layerName);
 *     this.primitives.show(layerName);
 *   }
 *
 *   hideLayer(layerName: string) {
 *     this.entities.hide(layerName);
 *     this.billboards.hide(layerName);
 *     this.primitives.hide(layerName);
 *   }
 *
 *   removeLayer(layerName: string) {
 *     this.entities.remove(layerName);
 *     this.billboards.remove(layerName);
 *     this.primitives.remove(layerName);
 *   }
 * }
 *
 * // Example 2: Extend the class for Domain-Specific Needs
 * class BuildingCollection extends Collection<EntityCollection, Entity> {
 *   constructor(viewer: Viewer) {
 *     super({ collection: viewer.entities, tag: 'buildings' });
 *   }
 *
 *   addBuilding(options: {
 *     position: Cartesian3;
 *     height: number;
 *     floors: number;
 *     type: 'residential' | 'commercial' | 'industrial';
 *   }): Entity {
 *     const building = new Entity({
 *       position: options.position,
 *       box: {
 *         dimensions: new Cartesian3(50, 50, options.height),
 *         material: this.getMaterialForType(options.type)
 *       }
 *     });
 *
 *     // Tag by type AND by floor count
 *     this.add(building, options.type);
 *     this.add(building, `floors-${options.floors}`);
 *
 *     return building;
 *   }
 *
 *   getByFloorRange(min: number, max: number): Entity[] {
 *     const results: Entity[] = [];
 *     for (let i = min; i <= max; i++) {
 *       results.push(...this.get(`floors-${i}`));
 *     }
 *     return results;
 *   }
 *
 *   private getMaterialForType(type: string): Material {
 *     const colors = {
 *       residential: Color.GREEN,
 *       commercial: Color.BLUE,
 *       industrial: Color.YELLOW
 *     };
 *     return new ColorMaterialProperty(colors[type] || Color.WHITE);
 *   }
 * }
 */
class Collection<C extends Collection.Base, I extends Collection.ItemFor<C>> {
  /**
   * Symbol used as a property key to store tags on collection items.
   * Using a Symbol ensures no property naming conflicts with the item's own properties.
   * @readonly
   */
  static readonly symbol: unique symbol = Symbol("cesium-item-tag");

  /**
   * Default tag used when adding items without specifying a tag.
   * @protected
   */
  protected tag: Collection.Tag;

  /**
   * The underlying Cesium collection being wrapped.
   * @protected
   */
  protected collection: C;

  /**
   * Cache for values array to improve performance
   * @private
   */
  private _valuesCache: I[] | null = null;

  /**
   * Tag to items map for faster lookups
   * @private
   */
  private _tagMap = new Map<Collection.Tag, Set<I>>();

  /**
   * Event listeners
   * @private
   */
  private _eventListeners = new Map<
    Collection.Event,
    Set<Collection.EventHandler<I>>
  >();

  /**
   * For cleaning up the instances
   * @private
   */
  private _eventCleanupFunctions: Array<() => void> = [];

  /**
   * Creates a new Collection instance.
   *
   * @param options - Configuration options
   * @param options.collection - The Cesium collection to wrap
   * @param options.tag - The default tag to use for items (defaults to 'default')
   */
  constructor({ collection, tag }: { collection: C; tag?: Collection.Tag }) {
    this.tag = tag || "default";
    this.collection = collection;

    this._setupCacheInvalidator(collection);
  }

  /**
   * Makes the collection directly iterable, allowing it to be used in `for...of` loops
   * and with spread operators.
   *
   * @returns An iterator for the items in the collection
   *
   * @example
   * // Iterate through all items in the collection
   * for (const entity of collection) {
   *   console.log(entity.id);
   * }
   *
   * // Convert collection to array using spread syntax
   * const entitiesArray = [...collection];
   */
  [Symbol.iterator](): Iterator<I> {
    return this.values[Symbol.iterator]();
  }

  /**
   * Gets all item instances in the collection.
   * This array should not be modified directly.
   *
   * @returns An array of all items in the collection
   */
  get values(): I[] {
    // Use cache if available
    if (this._valuesCache !== null) {
      return this._valuesCache;
    }

    // Build values array
    let values: I[];
    if (this.collection instanceof EntityCollection) {
      values = this.collection.values as I[];
    } else {
      values = [];
      for (let i = 0; i < this.collection.length; i++) {
        values.push(this.collection.get(i) as I);
      }
    }

    // Cache and return
    this._valuesCache = values;
    return values;
  }

  /**
   * Gets the number of items in the collection.
   *
   * @returns The item count
   */
  get length(): number {
    return this.values?.length || 0;
  }

  /**
   * Gets all unique tags currently in use in the collection.
   *
   * @returns An array of all unique tags
   *
   * @example
   * // Get all tags
   * const tags = collection.tags;
   * console.log(`Collection has these tags: ${tags.join(', ')}`);
   */
  get tags(): Collection.Tag[] {
    return Array.from(this._tagMap.keys());
  }

  /**
   * Registers an event listener for collection events.
   *
   * @param type - The event type to listen for
   * @param handler - The callback function
   * @returns The collection instance for method chaining
   */
  addEventListener(
    type: Collection.Event,
    handler: Collection.EventHandler<I>,
  ): this {
    if (!this._eventListeners.has(type)) {
      this._eventListeners.set(type, new Set());
    }
    this._eventListeners.get(type)?.add(handler);
    return this;
  }

  /**
   * Removes an event listener.
   *
   * @param type - The event type
   * @param handler - The callback function to remove
   * @returns The collection instance for method chaining
   */
  removeEventListener(
    type: Collection.Event,
    handler: Collection.EventHandler<I>,
  ): this {
    this._eventListeners.get(type)?.delete(handler);
    return this;
  }

  /**
   * Adds a single item with a tag to the collection.
   *
   * @param item - The item to add to the collection
   * @param tag - Tag to associate with this item (defaults to the collection's default tag)
   * @param index - The index to add the item at (if supported by the collection)
   * @returns The collection instance for method chaining
   *
   * @example
   * const entity = collection.add(new Entity({ ... }), 'landmarks');
   */
  add(item: I, tag?: Collection.Tag, index?: number): this;
  /**
   * Adds multiple items with the same tag to the collection.
   *
   * @param items - The array of items to add to the collection
   * @param tag - Tag to associate with this item (defaults to the collection's default tag)
   * @returns The collection instance for method chaining
   *
   * @example
   * // Add multiple entities with the same tag
   * const entities = [new Entity({ ... }), new Entity({ ... })];
   * const addedEntities = collection.add(entities, 'buildings');
   */
  add(items: I[], tag?: Collection.Tag): this;

  add(i: I | I[], t: Collection.Tag = this.tag, idx?: number): this {
    if (Array.isArray(i)) {
      i.forEach((i) => {
        this.add(i, t);
      });
    } else {
      Object.defineProperty(i, Collection.symbol, {
        value: t,
        enumerable: false,
        writable: true,
        configurable: true,
      });
      this.collection.add(i, idx);
      this._addToTagMap(i, t);
      this._invalidateCache();
      this._emit("add", { items: [i], tag: t });
    }

    return this;
  }

  /**
   * Returns true if the provided item is in this collection, false otherwise.
   *
   * @param item - The item instance to check for
   * @returns True if the item is in the collection, false otherwise
   */
  contains(item: I): boolean;
  /**
   * Checks if the collection has any items with the specified tag.
   *
   * @param tag - The tag to check for
   * @returns True if items with the tag exist, false otherwise
   *
   * @example
   * if (collection.contains('temporary')) {
   *   console.log('Temporary items exist');
   * }
   */
  contains(tag: Collection.Tag): boolean;
  contains(target: I | Collection.Tag): boolean {
    if (typeof target === "object") {
      return this.collection.contains(target);
    }

    const items = this._tagMap.get(target);
    return !!items && items.size > 0;
  }

  /**
   * Removes an item from the collection.
   *
   * @param item - The item to remove
   * @returns The collection instance for method chaining
   */
  remove(item: I): this;
  /**
   * Removes all items with the specified tag from the collection.
   *
   * @param by - The tag identifying which items to remove
   * @returns The collection instance for method chaining
   */
  remove(by: Collection.Tag): this;
  /**
   * Removes all items with the array of tags from the collection.
   *
   * @param by - The tags identifying which items to remove
   * @returns The collection instance for method chaining
   */
  remove(by: Collection.Tag[]): this;
  remove(target: I | Collection.Tag | Collection.Tag[]): this {
    // Case 1: Object but not array (an item)
    if (typeof target === "object" && !Array.isArray(target)) {
      const result = this.collection.remove(target);
      if (result) {
        this._removeFromTagMap(target as I & Collection.WithTag);
        this._invalidateCache();
        this._emit("remove", { items: [target] });
      }
    }

    // Case 2: Array of tags
    if (Array.isArray(target)) {
      if (target.length === 0) return this;

      for (const tag of target) {
        this.remove(tag);
      }
    }

    // Case 3: Single tag
    const items = this.get(target as Collection.Tag);
    if (items.length === 0) return this;

    for (const item of items) {
      this.remove(item);
    }

    return this;
  }

  /**
   * Removes all items from the collection.
   */
  removeAll(): void {
    this._tagMap.clear();
    this.collection.removeAll();
    this._invalidateCache();
    this._emit("clear");
  }

  /**
   * Permanently destroys this Collection instance.
   * Removes all event listeners and clears internal state.
   * The Collection instance should not be used after calling this method.
   */
  destroy(): void {
    // Remove all event listeners
    this._eventCleanupFunctions.forEach((cleanup) => cleanup());
    this._eventCleanupFunctions = [];

    // Clear internal state
    this._tagMap.clear();
    this._eventListeners.clear();
    this._valuesCache = null;
  }

  /**
   * Gets all items with the specified tag from the collection.
   * Uses an optimized internal map for faster lookups.
   *
   * @param by - The tag to filter by
   * @returns An array of items with the specified tag, or an empty array if none found
   *
   * @example
   * // Get all buildings
   * const buildings = collection.get('buildings');
   */
  get(by: Collection.Tag): I[] {
    const items = this._tagMap.get(by);
    return items ? Array.from(items) : [];
  }

  /**
   * Gets the first item matching the tag. More efficient than `get` when
   * you only need one item, especially for large collections.
   *
   * @param by - The tag to search for
   * @returns The first matching item or undefined if none found
   *
   * @example
   * // Get the first building
   * const firstBuilding = collection.first('buildings');
   */
  first(by: Collection.Tag): I | undefined {
    const items = this._tagMap.get(by);
    if (items && items.size > 0) {
      return items.values().next().value;
    }
    return undefined;
  }

  /**
   * Updates the tag for all items with the specified tag.
   *
   * @param from - The tag to replace
   * @param to - The new tag to assign
   * @returns The number of items updated
   *
   * @example
   * // Rename a tag
   * const count = collection.update('temp', 'temporary');
   * console.log(`Updated ${count} items`);
   */
  update(from: Collection.Tag, to: Collection.Tag): number {
    const items = this.get(from);

    for (const item of items) {
      // Remove from old tag map
      this._removeFromTagMap(item as I & Collection.WithTag);

      // Update tag
      Object.defineProperty(item, Collection.symbol, {
        value: to,
        enumerable: false,
        writable: true,
        configurable: true,
      });

      // Add to new tag map
      this._addToTagMap(item, to);
    }

    if (items.length > 0) {
      this._emit("update", { items, tag: to });
    }

    return items.length;
  }

  /**
   * Makes all items with the specified tag visible.
   * Only affects items that have a 'show' property.
   *
   * @param by - The tag identifying which items to show
   * @returns The collection itself.
   *
   * @example
   * // Show all buildings
   * collection.show('buildings');
   */
  show(by: Collection.Tag): this {
    const items = this.get(by);

    for (const item of items) {
      if (defined(item.show)) {
        item.show = true;
      }
    }

    return this;
  }

  /**
   * Hides all items with the specified tag.
   * Only affects items that have a 'show' property.
   *
   * @param by - The tag identifying which items to hide
   * @returns The collection itself.
   *
   * @example
   * // Hide all buildings
   * collection.hide('buildings');
   */
  hide(by: Collection.Tag): this {
    const items = this.get(by);

    for (const item of items) {
      if (defined(item.show)) {
        item.show = false;
      }
    }

    return this;
  }

  /**
   * Toggles visibility of all items with the specified tag.
   * Only affects items that have a 'show' property.
   *
   * @param by - The tag identifying which items to toggle
   * @returns The collection itself.
   *
   * @example
   * // Toggle visibility of all buildings
   * collection.toggle('buildings');
   */
  toggle(by: Collection.Tag): this {
    const items = this.get(by);

    for (const item of items) {
      if (defined(item.show)) {
        item.show = !item.show;
      }
    }

    return this;
  }

  /**
   * Sets a property value on all items with the specified tag.
   * Supports nested property paths using dot notation (e.g., 'billboard.scale').
   *
   * @template Path - A nested property path type
   *
   * @param property - The property name or nested path to set (e.g., 'name' or 'billboard.scale')
   * @param value - The value to set
   * @param by - The tag identifying which items to update
   * @returns The collection itself.
   *
   * @example
   * // Change color of all buildings to red
   * collection.setProperty('color', Color.RED, 'buildings');
   *
   * @example
   * // Change billboard scale using nested path
   * collection.setProperty('billboard.scale', 2.0, 'buildings');
   */
  setProperty<Path extends NestedKeyOf<I>>(
    property: Path,
    value: NestedValueOf<I, Path>,
    by: Collection.Tag = this.tag,
  ): this {
    const items = this.get(by);
    const pathParts = (property as string).split(".");

    // Prevent prototype pollution - block dangerous property names
    const dangerousKeys = ["__proto__", "constructor", "prototype"];

    for (const item of items) {
      // Check all parts of the path for dangerous keys
      let hasDangerousKey = false;
      for (const part of pathParts) {
        if (dangerousKeys.includes(part)) {
          hasDangerousKey = true;
          break;
        }
      }

      // Skip this item if path contains dangerous keys
      if (hasDangerousKey) {
        continue;
      }

      // Traverse to the parent of the target property
      let current: any = item;
      let i = 0;

      // Navigate to the nested object
      for (; i < pathParts.length - 1; i++) {
        const part = pathParts[i];

        if (!(part in current)) {
          break;
        }

        current = current[part];
        if (!current || typeof current !== "object") {
          break;
        }
      }

      // Set the final property if we successfully traversed the path
      if (i === pathParts.length - 1) {
        const finalKey = pathParts[pathParts.length - 1];

        if (finalKey in current && typeof current[finalKey] !== "function") {
          if (isGetterOnly(current, finalKey)) {
            throw Error(
              `Cannot set read-only property '${property}' on ${item.constructor.name}`,
            );
          }

          current[finalKey] = value;
        }
      }
    }

    return this;
  }

  /**
   * Filters items in the collection based on a predicate function.
   * Optionally only filters items with a specific tag.
   *
   * @param predicate - Function that tests each item
   * @param by - Optional tag to filter by before applying the predicate
   * @returns Array of items that pass the test
   *
   * @example
   * // Get all buildings taller than 100 meters
   * const tallBuildings = collection.filter(
   *   entity => entity.properties?.height?.getValue() > 100,
   *   'buildings'
   * );
   */
  filter(predicate: (item: I) => boolean, by?: Collection.Tag): I[] {
    const items = by ? this.get(by) : this.values;
    return items.filter(predicate);
  }

  /**
   * Executes a callback function for each item in the collection.
   * Optionally filters items by tag before execution.
   *
   * @param callback - Function to execute for each item
   * @param by - Optional tag to filter items (if not provided, processes all items)
   *
   * @example
   * // Highlight all buildings
   * collection.forEach((entity) => {
   *   if (entity.polygon) {
   *     entity.polygon.material = new ColorMaterialProperty(Color.YELLOW);
   *   }
   * }, 'buildings');
   */
  forEach(
    callback: (value: I, index: number) => void,
    by?: Collection.Tag,
  ): void {
    const items = by ? this.get(by) : this.values;
    items.forEach((item, index) => callback(item, index));
  }

  /**
   * Creates a new array with the results of calling a provided function on every element
   * in the collection. Optionally filters by tag before mapping.
   *
   * @param callbackfn - Function that produces an element of the new array
   * @param by - Optional tag to filter items by before mapping
   * @returns A new array with each element being the result of the callback function
   *
   * @example
   * // Get all entity IDs
   * const entityIds = collection.map(entity => entity.id);
   *
   * // Get positions of all buildings
   * const buildingPositions = collection.map(
   *   entity => entity.position.getValue(Cesium.JulianDate.now()),
   *   'buildings'
   * );
   */
  map<R>(callbackfn: (value: I, index: number) => R, by?: Collection.Tag): R[] {
    const items = by ? this.get(by) : this.values;
    return items.map(callbackfn);
  }

  /**
   * Returns the first element in the collection that satisfies the provided testing function.
   * Optionally filters by tag before searching.
   *
   * @param predicate - Function to test each element
   * @param by - Optional tag to filter items by before searching
   * @returns The first element that passes the test, or undefined if no elements pass
   *
   * @example
   * // Find the first entity with a specific name
   * const namedEntity = collection.find(entity => entity.name === 'Target');
   *
   * // Find the first building taller than 100 meters
   * const tallBuilding = collection.find(
   *   entity => entity.properties?.height?.getValue() > 100,
   *   'buildings'
   * );
   */
  find(predicate: (value: I) => boolean, by?: Collection.Tag): I | undefined {
    const items = by ? this.get(by) : this.values;
    return items.find(predicate);
  }

  /**
   * Emits an event to all registered listeners.
   *
   * @private
   * @param type - The event type
   * @param data - Additional event data
   */
  private _emit(
    type: Collection.Event,
    data?: { items?: I[]; tag?: Collection.Tag },
  ): void {
    const listeners = this._eventListeners.get(type);
    if (listeners) {
      const event = { type, ...data };
      listeners.forEach((handler) => handler(event));
    }
  }

  /**
   * Adds an item to the internal tag map for quick lookups.
   *
   * @private
   * @param item - The item to add
   * @param tag - The tag to associate with the item
   */
  private _addToTagMap(item: I, tag: Collection.Tag): void {
    if (!this._tagMap.has(tag)) {
      this._tagMap.set(tag, new Set());
    }
    this._tagMap.get(tag)?.add(item);
  }

  /**
   * Removes an item from the internal tag map.
   *
   * @private
   * @param item - The item to remove
   */
  private _removeFromTagMap(item: I & Collection.WithTag): void {
    const tag = item[Collection.symbol];
    const itemSet = this._tagMap.get(tag);
    if (itemSet) {
      itemSet.delete(item);
      // Clean up empty sets
      if (itemSet.size === 0) {
        this._tagMap.delete(tag);
      }
    }
  }

  /**
   * Invalidates the values cache when collection changes.
   *
   * @private
   */
  private _invalidateCache = (): void => {
    this._valuesCache = null;
  };

  /**
   * Sets up automatic cache invalidation by registering event listeners on the underlying Cesium collection.
   *
   * @private
   * @param collection - The Cesium collection to monitor for changes
   *
   * @see {@link destroy} For cleanup of event listeners
   * @see {@link _invalidateCache} For the actual cache invalidation logic
   */
  private _setupCacheInvalidator(collection: C) {
    if (collection instanceof EntityCollection) {
      collection.collectionChanged.addEventListener(this._invalidateCache);
      this._eventCleanupFunctions.push(() =>
        collection.collectionChanged.removeEventListener(this._invalidateCache),
      );
    } else if (collection instanceof PrimitiveCollection) {
      collection.primitiveAdded.addEventListener(this._invalidateCache);
      collection.primitiveRemoved.addEventListener(this._invalidateCache);
      this._eventCleanupFunctions.push(
        () =>
          collection.primitiveAdded.removeEventListener(this._invalidateCache),
        () =>
          collection.primitiveRemoved.removeEventListener(
            this._invalidateCache,
          ),
      );
    } else if (collection instanceof DataSourceCollection) {
      collection.dataSourceAdded.addEventListener(this._invalidateCache);
      collection.dataSourceMoved.addEventListener(this._invalidateCache);
      collection.dataSourceRemoved.addEventListener(this._invalidateCache);
      this._eventCleanupFunctions.push(
        () =>
          collection.dataSourceAdded.removeEventListener(this._invalidateCache),
        () =>
          collection.dataSourceMoved.removeEventListener(this._invalidateCache),
        () =>
          collection.dataSourceRemoved.removeEventListener(
            this._invalidateCache,
          ),
      );
    } else if (collection instanceof ImageryLayerCollection) {
      collection.layerAdded.addEventListener(this._invalidateCache);
      collection.layerMoved.addEventListener(this._invalidateCache);
      collection.layerRemoved.addEventListener(this._invalidateCache);
      collection.layerShownOrHidden.addEventListener(this._invalidateCache);
      this._eventCleanupFunctions.push(
        () => collection.layerAdded.removeEventListener(this._invalidateCache),
        () => collection.layerMoved.removeEventListener(this._invalidateCache),
        () =>
          collection.layerRemoved.removeEventListener(this._invalidateCache),
        () =>
          collection.layerShownOrHidden.removeEventListener(
            this._invalidateCache,
          ),
      );
    }
  }
}

/**
 * @namespace
 */
namespace Collection {
  /**
   * The underlying Cesium collection type being wrapped.
   */
  export type Base =
    | DataSourceCollection
    | EntityCollection
    | ImageryLayerCollection
    | PrimitiveCollection;

  /**
   * The item types that can be added to the `PrimitiveCollection` instance.
   */
  type Primitives =
    | Billboard
    | Cesium3DTileset
    | GroundPrimitive
    | Label
    | PointPrimitive
    | Polyline
    | Primitive;

  /**
   * Cesium item type that can be added to the {@link Collection.Base} instance.
   */
  export type Item = DataSource | Entity | ImageryLayer | Primitives;

  /**
   * Gets the item type for a given collection type
   */
  export type ItemFor<C extends Base> = C extends DataSourceCollection
    ? DataSource
    : C extends EntityCollection
      ? Entity
      : C extends ImageryLayerCollection
        ? ImageryLayer
        : C extends PrimitiveCollection
          ? Primitives
          : never;
  /**
   * Collection tag type.
   */
  export type Tag = string | number;

  export interface WithTag {
    [key: symbol]: Tag;
  }

  /**
   * Collection event types
   */
  export type Event = "add" | "remove" | "update" | "clear";
  /**
   * Event handler function type
   */
  export type EventHandler<I> = (event: {
    type: Event;
    items?: I[];
    tag?: Collection.Tag;
  }) => void;
}

export default Collection;
