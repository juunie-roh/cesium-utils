/**
 * Runtime type validator to identify the non-function property.
 */
export type NonFunction<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * Helper type to track recursion depth using tuple length.
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];

/**
 * Recursively creates a union of property paths for nested objects.
 * Limited to 3 levels of depth to prevent infinite type recursion.
 * Excludes function properties from the path generation.
 *
 * @template ObjectType - The object type to extract property paths from
 * @template Depth - Internal counter to limit recursion depth (default: 3)
 *
 * @example
 * type Paths = NestedKeyOf<{ a: { b: { c: number } } }>
 * // Result: "a" | "a.b" | "a.b.c"
 */
export type NestedKeyOf<ObjectType, Depth extends number = 3> = Depth extends 0
  ? never
  : ObjectType extends object
    ? {
        [Property in keyof ObjectType]: ObjectType[Property] extends
          | Function
          | ((...args: any[]) => any)
          ? never
          : Property extends string
            ?
                | Property
                | (ObjectType[Property] extends object
                    ? `${Property}.${NestedKeyOf<ObjectType[Property], Prev[Depth]>}`
                    : never)
            : never;
      }[keyof ObjectType]
    : never;

/**
 * Extracts the type of a nested property from a property path string.
 *
 * @template ObjectType - The object type to extract the value type from
 * @template Path - The property path string (e.g., "a.b.c")
 *
 * @example
 * type Value = NestedValueOf<{ a: { b: number } }, "a.b">
 * // Result: number
 */
export type NestedValueOf<
  ObjectType,
  Path extends string,
> = Path extends `${infer Cur}.${infer Rest}`
  ? Cur extends keyof ObjectType
    ? NestedValueOf<ObjectType[Cur], Rest>
    : never
  : Path extends keyof ObjectType
    ? ObjectType[Path]
    : never;

/**
 * Examine the property descriptors at runtime
 * to detect properties that only have getters.
 * (read-only accessor properties)
 * @param o The object to examine.
 * @param k The key value of the property.
 */
export function isGetterOnly(o: object, k: string | number | symbol): boolean {
  let isGetterOnly = false;

  // First check the instance itself
  let descriptor = Object.getOwnPropertyDescriptor(o, k);

  // If not found on instance, check prototype chain
  if (!descriptor) {
    let proto = Object.getPrototypeOf(o);
    while (proto && !descriptor) {
      descriptor = Object.getOwnPropertyDescriptor(proto, k);
      proto = Object.getPrototypeOf(proto);
    }
  }

  // If it has a getter but no setter, it's getter-only
  if (descriptor && descriptor.get && !descriptor.set) {
    isGetterOnly = true;
  }

  return isGetterOnly;
}
