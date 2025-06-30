import { defined, EntityCollection } from "cesium";

import { isGetterOnly } from "@/utils/index.js";

import type {
  CesiumCollection,
  CesiumCollectionItem,
  CollectionEventType,
  EventHandler,
  NonFunction,
  Tag,
  WithTag,
} from "./collection.types.js";

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
class Collection<C extends CesiumCollection, I extends CesiumCollectionItem> {
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
  protected tag: Tag;

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
  private _tagMap = new Map<Tag, Set<I>>();

  /**
   * Event listeners
   * @private
   */
  private _eventListeners = new Map<
    CollectionEventType,
    Set<EventHandler<I>>
  >();

  /**
   * Creates a new Collection instance.
   *
   * @param options - Configuration options
   * @param options.collection - The Cesium collection to wrap
   * @param options.tag - The default tag to use for items (defaults to 'default')
   */
  constructor({ collection, tag }: { collection: C; tag?: Tag }) {
    this.tag = tag || "default";
    this.collection = collection;
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
   * Emits an event to all registered listeners.
   *
   * @private
   * @param type - The event type
   * @param data - Additional event data
   */
  private _emit(
    type: CollectionEventType,
    data?: { items?: I[]; tag?: Tag },
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
  private _addToTagMap(item: I, tag: Tag): void {
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
  private _removeFromTagMap(item: I & WithTag): void {
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
  private _invalidateCache(): void {
    this._valuesCache = null;
  }

  /**
   * Registers an event listener for collection events.
   *
   * @param type - The event type to listen for
   * @param handler - The callback function
   * @returns The collection instance for method chaining
   */
  addEventListener(type: CollectionEventType, handler: EventHandler<I>): this {
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
    type: CollectionEventType,
    handler: EventHandler<I>,
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
   * @returns The added item for chaining
   *
   * @example
   * const entity = collection.add(new Entity({ ... }), 'landmarks');
   */
  add(item: I, tag?: Tag, index?: number): I;
  /**
   * Adds multiple items with the same tag to the collection.
   *
   * @param items - The array of items to add to the collection
   * @param tag - Tag to associate with this item (defaults to the collection's default tag)
   * @returns The array of added items
   *
   * @example
   * // Add multiple entities with the same tag
   * const entities = [new Entity({ ... }), new Entity({ ... })];
   * const addedEntities = collection.add(entities, 'buildings');
   */
  add(items: I[], tag?: Tag): I[];

  add(i: I | I[], t: Tag = this.tag, idx?: number): I | I[] {
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

    return i;
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
  contains(tag: Tag): boolean;
  contains(target: I | Tag): boolean {
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
   * @returns True if the item was removed, false if it wasn't found
   */
  remove(item: I): boolean;
  /**
   * Removes all items with the specified tag from the collection.
   *
   * @param by - The tag identifying which items to remove
   * @returns True if the item was removed, false if it wasn't found
   */
  remove(by: Tag): boolean;
  /**
   * Removes all items with the array of tags from the collection.
   *
   * @param by - The tags identifying which items to remove
   * @returns True if the item was removed, false if it wasn't found
   */
  remove(by: Tag[]): boolean;
  remove(target: I | Tag | Tag[]): boolean {
    // Case 1: Object but not array (an item)
    if (typeof target === "object" && !Array.isArray(target)) {
      const result = this.collection.remove(target);
      if (result) {
        this._removeFromTagMap(target as I & WithTag);
        this._invalidateCache();
        this._emit("remove", { items: [target] });
      }
      return result;
    }

    // Case 2: Array of tags
    if (Array.isArray(target)) {
      if (target.length === 0) return false;

      let anyRemoved = false;
      for (const tag of target) {
        // Track if any tag removal succeeded
        if (this.remove(tag)) {
          anyRemoved = true;
        }
      }
      return anyRemoved;
    }

    // Case 3: Single tag
    const items = this.get(target as Tag);
    if (items.length === 0) return false;

    let anyRemoved = false;
    for (const item of items) {
      // Track if any item removal succeeded
      if (this.remove(item)) {
        anyRemoved = true;
      }
    }
    return anyRemoved;
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
   * Gets all item instances in the collection.
   * This array should not be modified directly.
   *
   * @returns An array of all items in the collection
   */
  get values(): I[] {
    if (this.collection instanceof EntityCollection) {
      return this.collection.values as I[];
    } else {
      const arr: I[] = [];
      for (let i = 0; i < this.collection.length; i++) {
        arr.push(this.collection.get(i) as I);
      }
      return arr;
    }
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
  get(by: Tag): I[] {
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
  first(by: Tag): I | undefined {
    const items = this._tagMap.get(by);
    if (items && items.size > 0) {
      return items.values().next().value;
    }
    return undefined;
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
  get tags(): Tag[] {
    return Array.from(this._tagMap.keys());
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
  update(from: Tag, to: Tag): number {
    const items = this.get(from);

    for (const item of items) {
      // Remove from old tag map
      this._removeFromTagMap(item as I & WithTag);

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
  show(by: Tag): this {
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
  hide(by: Tag): this {
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
  toggle(by: Tag): this {
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
   *
   * @param by - The tag identifying which items to update
   * @param property - The property name to set
   * @param value - The value to set
   * @returns The number of items updated
   *
   * @example
   * // Change color of all buildings to red
   * collection.setProperty('buildings', 'color', Color.RED);
   */
  setProperty<K extends NonFunction<I>>(
    property: K,
    value: I[K],
    by: Tag = this.tag,
  ): this {
    const items = this.get(by);

    for (const item of items) {
      if (property in item && typeof item[property] !== "function") {
        if (isGetterOnly(item, property)) {
          throw Error(
            `Cannot set read-only property '${String(property)}' on ${item.constructor.name}`,
          );
        }

        item[property] = value;
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
  filter(predicate: (item: I) => boolean, by?: Tag): I[] {
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
  forEach(callback: (value: I, index: number) => void, by?: Tag): void {
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
  map<R>(callbackfn: (value: I, index: number) => R, by?: Tag): R[] {
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
  find(predicate: (value: I) => boolean, by?: Tag): I | undefined {
    const items = by ? this.get(by) : this.values;
    return items.find(predicate);
  }
}

export default Collection;
