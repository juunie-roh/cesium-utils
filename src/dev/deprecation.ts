/**
 * Utility for managing deprecation warnings in the cesium-utils library.
 * Provides runtime warnings to help developers identify deprecated API usage.
 */
namespace Deprecate {
  /**
   * Set of messages that have already been shown (for once-only warnings).
   */
  const shownWarnings = new Set<string>();
  /**
   * Whether deprecation warnings are enabled globally.
   * Can be controlled via environment variable CESIUM_UTILS_DISABLE_DEPRECATION_WARNINGS.
   */
  const warningsEnabled =
    typeof process !== "undefined"
      ? process.env.CESIUM_UTILS_DISABLE_DEPRECATION_WARNINGS !== "true"
      : true;
  /**
   * Configuration options for deprecation warnings.
   */
  export interface Options {
    /**
     * Whether to show the warning only once per deprecation message.
     * @default true
     */
    once?: boolean;

    /**
     * Custom prefix for the warning message.
     * @default "[DEPRECATED]"
     */
    prefix?: string;

    /**
     * Whether to include a stack trace in the warning.
     * @default true
     */
    includeStack?: boolean;

    /**
     * Version when the feature will be removed.
     */
    removeInVersion?: string;
  }

  /**
   * Displays a deprecation warning message.
   *
   * @param message - The deprecation message to display
   * @param options - Configuration options for the warning
   *
   * @example
   * ```typescript
   * // Basic usage
   * deprecationWarning("oldFunction() is deprecated. Use newFunction() instead.");
   *
   * // With removal version
   * deprecationWarning("TerrainArea is deprecated.", {
   *   removeInVersion: "v0.3.0"
   * });
   *
   * // Allow multiple warnings
   * deprecationWarning("Repeated warning", { once: false });
   * ```
   */
  export function warn(message: string, options: Options = {}): void {
    if (!warningsEnabled) {
      return;
    }

    const {
      once = true,
      prefix = "[DEPRECATED]",
      includeStack = true,
      removeInVersion,
    } = options;

    // Check if we've already shown this warning
    if (once && shownWarnings.has(message)) {
      return;
    }

    // Build the full warning message
    let fullMessage = `${prefix} ${message}`;

    if (removeInVersion) {
      fullMessage += ` This feature will be removed in ${removeInVersion}.`;
    }

    // Show the warning
    if (typeof console !== "undefined" && console.warn) {
      if (includeStack) {
        console.warn(fullMessage);
        console.trace("Deprecation stack trace:");
      } else {
        console.warn(fullMessage);
      }
    }

    // Mark as shown if once-only
    if (once) {
      shownWarnings.add(message);
    }
  }

  /**
   * Creates a deprecation wrapper function that shows a warning when called.
   *
   * @param fn - The function to wrap
   * @param message - The deprecation message
   * @param options - Configuration options for the warning
   * @returns A wrapped function that shows a deprecation warning when called
   *
   * @example
   * ```typescript
   * const oldFunction = deprecate(
   *   () => console.log("old implementation"),
   *   "oldFunction() is deprecated. Use newFunction() instead."
   * );
   *
   * oldFunction(); // Shows warning and executes function
   * ```
   */
  export function deprecate<T extends (...args: any[]) => any>(
    fn: T,
    message: string,
    options: Options = {},
  ): T {
    const wrappedFunction = ((...args: Parameters<T>) => {
      warn(message, options);
      return fn(...args);
    }) as T;

    // Copy function properties
    Object.defineProperty(wrappedFunction, "name", {
      value: fn.name,
      configurable: true,
    });

    return wrappedFunction;
  }

  /**
   * Clears all shown warning messages.
   * Useful for testing or when you want to reset the warning state.
   *
   * @example
   * ```typescript
   * clearDeprecationWarnings();
   * deprecationWarning("This will show again");
   * ```
   */
  export function clear(): void {
    shownWarnings.clear();
  }

  /**
   * Gets the count of unique deprecation warnings that have been shown.
   *
   * @returns The number of unique deprecation warnings shown
   */
  export function getWarningCount(): number {
    return shownWarnings.size;
  }

  /**
   * Checks if a specific deprecation warning has been shown.
   *
   * @param message - The deprecation message to check
   * @returns True if the warning has been shown, false otherwise
   */
  export function hasShown(message: string): boolean {
    return shownWarnings.has(message);
  }
}

export default Deprecate;
