/**
 * Runtime type validator to identify the non-function property.
 */
export type NonFunction<T> = {
  [K in keyof T]: T[K] extends Function | ((...args: any[]) => any) ? never : K;
}[keyof T];

/**
 * Represents a path to any nested property in an object, using dot notation.
 *
 * The `(keyof T & string)` portion provides top-level key hints in autocomplete,
 * while `(string & {})` allows any string input to pass through.
 *
 * Actual path validation is delegated to {@link NestedValueOf}, which returns `never`
 * for invalid paths — causing a type error on the corresponding value parameter.
 *
 * @example
 * ```ts
 * function f<Path extends NestedKeyOf<Obj>>(
 *   key: Path,
 *   value: NestedValueOf<Obj, Path> // ← validation happens here
 * ) {}
 *
 * f("a.b.c", 123);       // ✅ valid path, correct value type
 * f("invalid.path", 1);  // ❌ NestedValueOf returns never
 * ```
 */
export type NestedKeyOf<T extends object> = (keyof T & string) | (string & {});

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
    ? NonNullable<ObjectType[Cur]> extends Function | ((...args: any[]) => any)
      ? never // Stop at functions
      : NestedValueOf<NonNullable<ObjectType[Cur]>, Rest>
    : never
  : Path extends keyof ObjectType
    ? NonNullable<ObjectType[Path]> extends Function | ((...args: any[]) => any)
      ? never // Exclude functions from final value
      : ObjectType[Path]
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
