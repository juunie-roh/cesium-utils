import type {
  Billboard,
  BillboardCollection,
  DataSource,
  DataSourceCollection,
  ImageryLayer,
  ImageryLayerCollection,
  Label,
  LabelCollection,
  PointPrimitive,
  PointPrimitiveCollection,
  Polyline,
  PolylineCollection,
  Primitive,
  PrimitiveCollection,
} from 'cesium';
import { EntityCollection } from 'cesium';
import {
  Cesium3DTileset,
  Entity,
} from 'cesium';

type CesiumCollection =
  | BillboardCollection
  | DataSourceCollection
  | EntityCollection
  | ImageryLayerCollection
  | LabelCollection
  | PointPrimitiveCollection
  | PolylineCollection
  | PrimitiveCollection;

type CesiumCollectionItem =
  | Billboard
  | DataSource
  | Entity
  | ImageryLayer
  | Label
  | PointPrimitive
  | Polyline
  | Primitive
  | Cesium3DTileset;

type Tag = string | number;

/**
 * Abstract class that enhances Cesium collection objects with tagging functionality.
 * This class provides a consistent API for working with different types of Cesium collections
 * and allows grouping and manipulating collection items by custom tags.
 *
 * @abstract
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
abstract class Collection<C extends CesiumCollection, I extends CesiumCollectionItem> {
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
   * Type guard to determine if an item has the 'show' property.
   * This helps ensure type safety when toggling visibility.
   *
   * @static
   * @param item - The item to check
   * @returns True if the item has a show property that can be toggled
   *
   * @example
   * if (Collection.hasShow(myItem)) {
   *   myItem.show = true;
   * }
   */
  static hasShow<T extends CesiumCollectionItem>(item: T): item is T & { show: boolean } {
    return 'show' in item && typeof item.show !== 'undefined';
  }

  /**
   * Adds an item with a tag to the collection.
   *
   * @param item - The item to add to the collection
   * @param tag - Tag to associate with this item (defaults to the collection's default tag)
   * @param index - The index to add the item at (if supported by the collection)
   * @returns The added item for method chaining
   *
   * @example
   * const entity = collection.add(new Entity({ ... }), 'landmarks');
   */
  add(item: I, tag: Tag = this.tag, index?: number): I {
    item[Collection.symbol] = tag;
    this.collection.add(item, index);
    return item;
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
    return this.collection.remove(item);
  }

  /**
   * Removes all items from the collection.
   */
  removeAll(): void {
    this.collection.removeAll();
  }

  /**
   * Gets all item instances in the collection.
   * This array should not be modified directly.
   *
   * @returns An array of all items in the collection
   */
  get values(): I[] {
    if (this.collection instanceof EntityCollection) {
      return (this.collection.values as I[]) || [];
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
   *
   * @param tag - The tag to filter by
   * @returns An array of items with the specified tag, or undefined if none found
   *
   * @example
   * // Get all buildings
   * const buildings = collection.getByTag('buildings');
   */
  getByTag(tag: Tag): I[] | undefined {
    return this.values?.filter(item => item[Collection.symbol] === tag);
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
    for (const item of this.values) {
      if (item[Collection.symbol] === tag) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Removes all items with the specified tag from the collection.
   *
   * @param tag - The tag identifying which items to remove
   *
   * @example
   * // Remove all temporary markers
   * collection.removeByTag('temporary');
   */
  removeByTag(tag: Tag): void {
    this.getByTag(tag)?.forEach(item => {
      this.remove(item);
    });
  }

  /**
   * Makes all items with the specified tag visible.
   * Only affects items that have a 'show' property.
   *
   * @param tag - The tag identifying which items to show
   *
   * @example
   * // Show all buildings
   * collection.show('buildings');
   */
  show(tag: Tag): void {
    this.getByTag(tag)?.forEach(item => {
      if (Collection.hasShow(item)) {
        item.show = true;
      }
    });
  }

  /**
   * Hides all items with the specified tag.
   * Only affects items that have a 'show' property.
   *
   * @param tag - The tag identifying which items to hide
   *
   * @example
   * // Hide all buildings
   * collection.hide('buildings');
   */
  hide(tag: Tag): void {
    this.getByTag(tag)?.forEach(item => {
      if (Collection.hasShow(item)) {
        item.show = false;
      }
    });
  }

  /**
   * Toggles visibility of all items with the specified tag.
   * Only affects items that have a 'show' property.
   *
   * @param tag - The tag identifying which items to toggle
   *
   * @example
   * // Toggle visibility of all buildings
   * collection.toggle('buildings');
   */
  toggle(tag: Tag): void {
    this.getByTag(tag)?.forEach(item => {
      if (Collection.hasShow(item)) {
        item.show = !item.show;
      }
    });
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
    items?.forEach((item, index) => callback(item, index));
  }
}

export default Collection;
