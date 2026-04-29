import Logger from "../logger.js";

const logger = Logger.get();

/**
 * Decorator that emits a deprecation warning when the decorated member is accessed.
 *
 * Supports both legacy TypeScript decorators (`experimentalDecorators`) and
 * the TC39 standard decorator API (used when calling the function directly in tests).
 */
function Deprecated({
  once = true,
  includeStack = false,
  message,
}: Deprecated.Options): any {
  return (
    target: any,
    keyOrContext?: any,
    descriptor?: PropertyDescriptor,
  ): any => {
    const { label } = message;

    function warn(): void {
      if (!once || !Deprecated.has(label)) {
        logger.warn(deprecationMessage(message));
        if (includeStack) {
          console.trace("Deprecation stack trace:");
        }
        Deprecated.add(label);
      }
    }

    // Legacy decorator API — called by TypeScript when experimentalDecorators is true
    const key = keyOrContext as string | symbol | undefined;

    // Class decorator
    if (key === undefined) {
      return class extends target {
        constructor(...args: any[]) {
          warn();
          super(...args);
        }
      };
    }

    // Property/field decorator — warn at class-definition time
    if (descriptor === undefined) {
      warn();
      return;
    }

    // Getter (and optionally setter) decorator
    if (descriptor.get) {
      const originalGet = descriptor.get;
      descriptor.get = function (this: any) {
        warn();
        return originalGet.call(this);
      };
      if (descriptor.set) {
        const originalSet = descriptor.set;
        descriptor.set = function (this: any, value: any) {
          warn();
          originalSet.call(this, value);
        };
      }
      return descriptor;
    }

    // Setter-only decorator
    if (descriptor.set) {
      const original = descriptor.set;
      descriptor.set = function (this: any, value: any) {
        warn();
        original.call(this, value);
      };
      return descriptor;
    }

    // Method decorator
    if (typeof descriptor.value === "function") {
      const original = descriptor.value;
      descriptor.value = function (this: any, ...args: any[]) {
        warn();
        return original.apply(this, args);
      };
      return descriptor;
    }

    return descriptor;
  };
}

/**
 * Utility for managing deprecation warnings.
 *
 * Provides runtime warnings to help developers identify deprecated API usage.
 */
namespace Deprecated {
  type Version = `${number}.${number}.${number}`;

  /**
   * Configuration options for deprecation warnings.
   */
  export interface Options {
    message: {
      label: string;
      since: Version;
      removedIn: Version;
      replacement?: string;
      additional?: string;
    };
    once?: boolean;
    includeStack?: boolean;
  }

  /**
   * Set of labels that have already been shown (for once-only warnings).
   */
  const shown = new Set<string>();

  /**
   * Adds a label to show deprecation warning.
   */
  export function add(label: string): void {
    shown.add(label);
  }

  /**
   * Clears all shown warning labels.
   */
  export function clear(): void {
    shown.clear();
  }

  /**
   * Gets the count of unique deprecation warnings that have been shown.
   */
  export function size(): number {
    return shown.size;
  }

  /**
   * Checks if a specific deprecation warning has been shown.
   *
   * @param label - The deprecated target to check
   * @returns True if the warning has been shown, false otherwise
   */
  export function has(label: string): boolean {
    return shown.has(label);
  }
}

function deprecationMessage({
  label,
  since,
  removedIn,
  replacement,
  additional: message,
}: Deprecated.Options["message"]): string {
  return [
    `${label} is deprecated since ${since}.`,
    replacement ? `Use ${replacement} instead.` : undefined,
    `This will be removed in ${removedIn}.`,
    message,
  ]
    .filter(Boolean)
    .join(" ");
}

export default Deprecated;
