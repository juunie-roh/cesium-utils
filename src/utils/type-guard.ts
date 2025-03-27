/**
 * Utility functions for type checking and handling Cesium objects
 */
export namespace TypeGuard {
  /**
   * Type guard to determine if an item has a specific property that is not undefined.
   * This helps ensure type safety when checking for and accessing properties.
   *
   * @param item - The item to check
   * @param property - The property key to check
   * @returns True if the item has the specified property and it's not undefined
   *
   * @example
   * if (TypeGuard.hasProperty(entity, 'show')) {
   *   entity.show = true;
   * }
   */
  export function hasProperty<T extends object, K extends keyof T>(
    item: T,
    property: K,
  ): item is T & Record<K, unknown> {
    return property in item && typeof item[property as keyof T] !== 'undefined';
  }
}

export default TypeGuard;
