import { defined, EntityCollection } from 'cesium';

import {
  CesiumCollection,
  CesiumCollectionItem,
  CollectionEventType,
  EventHandler,
  Tag,
  WithTag,
} from './collection.types.js';

/**
 * @class
 * Abstract class that enhances Cesium collection objects with tagging functionality.
 * This class provides a consistent API for working with different types of Cesium collections
 * and allows grouping and manipulating collection items by custom tags.
 *
 * @template C - The type of Cesium collection (e.g., EntityCollection, PrimitiveCollection)
 * @template I - The type of items in the collection (e.g., Entity, Primitive)
 *
 * @example
 * // Creating a specialized collection for entities
 * class MyEntities extends Collection<EntityCollection, Entity> {
 *   constructor(viewer) {
 *     super({ collection: viewer.entities, tag: 'myEntities' });
 *   }
 *
 *   get values() {
 *     return this.collection.values;
 *   }
 * }
 *
 * const entities = new MyEntities(viewer);
 * entities.add(new Entity({ ... }), 'buildings');
 * entities.add(new Entity({ ... }), 'roads');
 *
 * // Later, show only buildings
 * entities.show('buildings');
 * entities.hide('roads');
 */
class Collection<C extends CesiumCollection, I extends CesiumCollectionItem> {
  /**
   * Symbol used as a property key to store tags on collection items.
   * Using a Symbol ensures no property naming conflicts with the item's own properties.
   * @readonly
   */
  static readonly symbol: unique symbol = Symbol('cesium-item-tag');

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
    this.tag = tag || 'default';
    this.collection = collection;
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
      this._emit('add', { items: [i], tag: t });
    }

    return i;
  }

  /**
   * Returns true if the provided item is in this collection, false otherwise.
   *
   * @param item - The item to check for
   * @returns True if the item is in the collection, false otherwise
   */
  contains(item: I): boolean {
    return this.collection.contains(item);
  }

  /**
   * Removes an item from the collection.
   *
   * @param item - The item to remove
   * @returns True if the item was removed, false if it wasn't found
   */
  remove(item: I): boolean {
    const result = this.collection.remove(item);
    if (result) {
      this._removeFromTagMap(item as I & WithTag);
      this._invalidateCache();
      this._emit('remove', { items: [item] });
    }
    return result;
  }

  /**
   * Removes all items from the collection.
   */
  removeAll(): void {
    this._tagMap.clear();
    this.collection.removeAll();
    this._invalidateCache();
    this._emit('clear');
  }

  /**
   * Gets all item instances in the collection.
   * This array should not be modified directly.
   *
   * @returns An array of all items in the collection
   */
  get values(): I[] {
    if (this._valuesCache) {
      return this._valuesCache;
    }

    if (this.collection instanceof EntityCollection) {
      this._valuesCache = (this.collection.values as I[]) || [];
    } else {
      const arr: I[] = [];
      for (let i = 0; i < this.collection.length; i++) {
        arr.push(this.collection.get(i) as I);
      }
      this._valuesCache = arr;
    }

    return this._valuesCache;
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
   * @param tag - The tag to filter by
   * @returns An array of items with the specified tag, or an empty array if none found
   *
   * @example
   * // Get all buildings
   * const buildings = collection.getByTag('buildings');
   */
  getByTag(tag: Tag): I[] {
    const items = this._tagMap.get(tag);
    return items ? Array.from(items) : [];
  }

  /**
   * Gets the first item matching the tag. More efficient than getByTag when
   * you only need one item, especially for large collections.
   *
   * @param tag - The tag to search for
   * @returns The first matching item or undefined if none found
   *
   * @example
   * // Get the first building
   * const firstBuilding = collection.getFirstByTag('buildings');
   */
  getFirstByTag(tag: Tag): I | undefined {
    const items = this._tagMap.get(tag);
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
   * const tags = collection.getTags();
   * console.log(`Collection has these tags: ${tags.join(', ')}`);
   */
  getTags(): Tag[] {
    return Array.from(this._tagMap.keys());
  }

  /**
   * Checks if the collection has any items with the specified tag.
   *
   * @param tag - The tag to check for
   * @returns True if items with the tag exist, false otherwise
   *
   * @example
   * if (collection.hasTag('temporary')) {
   *   console.log('Temporary items exist');
   * }
   */
  hasTag(tag: Tag): boolean {
    const items = this._tagMap.get(tag);
    return !!items && items.size > 0;
  }

  /**
   * Updates the tag for all items with the specified tag.
   *
   * @param oldTag - The tag to replace
   * @param newTag - The new tag to assign
   * @returns The number of items updated
   *
   * @example
   * // Rename a tag
   * const count = collection.updateTag('temp', 'temporary');
   * console.log(`Updated ${count} items`);
   */
  updateTag(oldTag: Tag, newTag: Tag): number {
    const items = this.getByTag(oldTag);

    for (const item of items) {
      // Remove from old tag map
      this._removeFromTagMap(item as I & WithTag);

      // Update tag
      Object.defineProperty(item, Collection.symbol, {
        value: newTag,
        enumerable: false,
        writable: true,
        configurable: true,
      });

      // Add to new tag map
      this._addToTagMap(item, newTag);
    }

    if (items.length > 0) {
      this._emit('update', { items, tag: newTag });
    }

    return items.length;
  }

  /**
   * Removes all items with the specified tag from the collection.
   *
   * @param tag - The tag identifying which items to remove
   * @returns The number of items removed
   *
   * @example
   * // Remove all temporary markers
   * const count = collection.removeByTag('temporary');
   * console.log(`Removed ${count} items`);
   */
  removeByTag(tag: Tag): number;
  /**
   * Removes all items with the array of tags from the collection.
   *
   * @param tag - The tags identifying which items to remove
   * @returns The number of items removed
   *
   * @example
   * // Remove all items containing tags
   * const count = collection.removeByTag('temporary', 'default', 'tag');
   * console.log(`Removed ${count} items`);
   */
  removeByTag(tag: Tag[]): number;

  removeByTag(t: Tag | Tag[]): number {
    let count = 0;

    if (Array.isArray(t)) {
      t.forEach((t) => {
        this.removeByTag(t);
      });
    } else {
      this.getByTag(t).forEach((item) => {
        if (this.remove(item as I & WithTag)) {
          count++;
        }
      });
    }

    return count;
  }

  /**
   * Makes all items with the specified tag visible.
   * Only affects items that have a 'show' property.
   *
   * @param tag - The tag identifying which items to show
   * @returns The number of items affected
   *
   * @example
   * // Show all buildings
   * collection.show('buildings');
   */
  show(tag: Tag): number {
    const items = this.getByTag(tag);
    let count = 0;

    for (const item of items) {
      if (defined(item.show)) {
        item.show = true;
        count++;
      }
    }

    return count;
  }

  /**
   * Hides all items with the specified tag.
   * Only affects items that have a 'show' property.
   *
   * @param tag - The tag identifying which items to hide
   * @returns The number of items affected
   *
   * @example
   * // Hide all buildings
   * collection.hide('buildings');
   */
  hide(tag: Tag): number {
    const items = this.getByTag(tag);
    let count = 0;

    for (const item of items) {
      if (defined(item.show)) {
        item.show = false;
        count++;
      }
    }

    return count;
  }

  /**
   * Toggles visibility of all items with the specified tag.
   * Only affects items that have a 'show' property.
   *
   * @param tag - The tag identifying which items to toggle
   * @returns The number of items affected
   *
   * @example
   * // Toggle visibility of all buildings
   * collection.toggle('buildings');
   */
  toggle(tag: Tag): number {
    const items = this.getByTag(tag);
    let count = 0;

    for (const item of items) {
      if (defined(item.show)) {
        item.show = !item.show;
        count++;
      }
    }

    return count;
  }

  /**
   * Sets a property value on all items with the specified tag.
   *
   * @param tag - The tag identifying which items to update
   * @param property - The property name to set
   * @param value - The value to set
   * @returns The number of items updated
   *
   * @example
   * // Change color of all buildings to red
   * collection.setProperty('buildings', 'color', Color.RED);
   */
  setProperty<K extends string, V>(tag: Tag, property: K, value: V): number {
    const items = this.getByTag(tag);
    let count = 0;

    for (const item of items) {
      if (property in item) {
        // Using type assertion since we've verified the property exists
        (item as unknown as Record<K, V>)[property] = value;
        count++;
      } else {
        console.warn(`${property} does not exists in ${item}`);
      }
    }

    return count;
  }

  /**
   * Filters items in the collection based on a predicate function.
   * Optionally only filters items with a specific tag.
   *
   * @param predicate - Function that tests each item
   * @param tag - Optional tag to filter by before applying the predicate
   * @returns Array of items that pass the test
   *
   * @example
   * // Get all buildings taller than 100 meters
   * const tallBuildings = collection.filter(
   *   entity => entity.properties?.height?.getValue() > 100,
   *   'buildings'
   * );
   */
  filter(predicate: (item: I) => boolean, tag?: Tag): I[] {
    const items = tag ? this.getByTag(tag) : this.values;
    return items.filter(predicate);
  }

  /**
   * Executes a callback function for each item in the collection.
   * Optionally filters items by tag before execution.
   *
   * @param callback - Function to execute for each item
   * @param tag - Optional tag to filter items (if not provided, processes all items)
   *
   * @example
   * // Highlight all buildings
   * collection.forEach((entity) => {
   *   if (entity.polygon) {
   *     entity.polygon.material = new ColorMaterialProperty(Color.YELLOW);
   *   }
   * }, 'buildings');
   */
  forEach(callback: (item: I, index: number) => void, tag?: Tag): void {
    const items = tag ? this.getByTag(tag) : this.values;
    items.forEach((item, index) => callback(item, index));
  }
}

export default Collection;
