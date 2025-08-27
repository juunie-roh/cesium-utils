/**
 * Runtime type validator to identify the non-function property.
 */
export type NonFunction<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

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
