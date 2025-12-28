import { isGetterOnly } from "./type-check.js";

/**
 * Result of attempting to set a property safely.
 */
export interface SetPropertyResult {
  /**
   * Whether the property was successfully set.
   */
  success: boolean;
  /**
   * Reason for failure, if any.
   */
  reason?:
    | "dangerous-property"
    | "invalid-path"
    | "read-only"
    | "function-property";
  /**
   * Error message with details.
   */
  message?: string;
}

/**
 * Safely sets a nested property on an object with comprehensive security checks.
 *
 * This function prevents prototype pollution attacks and validates the property
 * path before setting values.
 *
 * **Security Features**:
 * - Blocks dangerous property names (`__proto__`, `constructor`, `prototype`)
 * - Only traverses own (non-inherited) properties
 * - Prevents modification of Object.prototype
 * - Blocks setting function properties
 * - Prevents modification of read-only (getter-only) properties
 *
 * @param obj - The object to set the property on
 * @param path - The property path (supports dot notation, e.g., "config.setting.value")
 * @param value - The value to set
 * @returns Result object indicating success or failure with reason
 *
 * @example
 * ```typescript
 * const result = safeSetProperty(entity, "metadata.priority", 5);
 * if (!result.success) {
 *   console.error(`Failed: ${result.message}`);
 * }
 * ```
 */
export function safeSetProperty<T extends object>(
  obj: T,
  path: string,
  value: any,
): SetPropertyResult {
  const pathParts = path.split(".");

  // Check all parts of the path for dangerous keys upfront
  for (const part of pathParts) {
    if (isDangerousProperty(part)) {
      return {
        success: false,
        reason: "dangerous-property",
        message: `Property path contains dangerous property name: "${part}"`,
      };
    }
  }

  // Traverse to the parent of the target property
  let current: any = obj;
  let i = 0;

  // Navigate to the nested object
  for (; i < pathParts.length - 1; i++) {
    const part = pathParts[i];

    // Only traverse own, non-inherited properties
    if (
      !current ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, part)
    ) {
      return {
        success: false,
        reason: "invalid-path",
        message: `Property path "${path}" does not exist or contains inherited properties`,
      };
    }

    current = current[part];

    // Stop if we reached a non-object or Object.prototype itself
    if (
      !current ||
      typeof current !== "object" ||
      current === Object.prototype
    ) {
      return {
        success: false,
        reason: "invalid-path",
        message: `Cannot traverse path "${path}" - reached non-object or prototype`,
      };
    }
  }

  // Validate we successfully traversed the path
  if (i !== pathParts.length - 1) {
    return {
      success: false,
      reason: "invalid-path",
      message: `Failed to traverse property path "${path}"`,
    };
  }

  const finalKey = pathParts[pathParts.length - 1];

  // Check if the final key is a dangerous property name
  if (isDangerousProperty(finalKey)) {
    return {
      success: false,
      reason: "dangerous-property",
      message: `Cannot set dangerous property "${finalKey}"`,
    };
  }

  // Final validation before setting
  if (!current || typeof current !== "object" || current === Object.prototype) {
    return {
      success: false,
      reason: "invalid-path",
      message: `Cannot set property on invalid target`,
    };
  }

  // Check if property exists and is not a function
  if (finalKey in current) {
    if (typeof current[finalKey] === "function") {
      return {
        success: false,
        reason: "function-property",
        message: `Cannot set function property "${finalKey}"`,
      };
    }

    // Check if it's a getter-only property
    if (isGetterOnly(current, finalKey)) {
      return {
        success: false,
        reason: "read-only",
        message: `Cannot set read-only property "${path}"`,
      };
    }
  }

  // All checks passed - set the property
  // lgtm[js/prototype-polluting-assignment]
  // CodeQL false positive: finalKey is validated by isDangerousProperty() above
  current[finalKey] = value;

  return {
    success: true,
  };
}

/**
 * Dangerous property names that can lead to prototype pollution attacks.
 */
const DANGEROUS_PROPERTY_NAMES = ["__proto__", "constructor", "prototype"];

/**
 * Checks if a property name is dangerous (could lead to prototype pollution).
 *
 * @param propertyName - The property name to check
 * @returns true if the property name is dangerous, false otherwise
 */
function isDangerousProperty(propertyName: string): boolean {
  return DANGEROUS_PROPERTY_NAMES.includes(propertyName);
}
