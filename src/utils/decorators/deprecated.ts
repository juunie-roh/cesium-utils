import Logger from "../logger.js";

const logger = Logger.get();

/**
 * Decorator that emits a deprecation warning when the decorated class or method is defined
 * (i.e., at module load time, not at call time).
 *
 * Warnings respect the `once` option.
 */
function Deprecated({
  once = true,
  includeStack = false,
  message,
}: Deprecated.Options): unknown {
  return (target: unknown, context: DecoratorContext) => {
    const { label } = message;
    const { kind } = context;

    function warn(): void {
      const hasShown = Deprecated.has(label);

      if (!once || !hasShown) {
        logger.warn(deprecationMessage(message));

        if (includeStack) {
          console.trace("Deprecation stack trace:");
        }

        Deprecated.add(label);
      }
    }

    if (kind === "class") {
      return function (this: any, ...args: any[]) {
        warn();
        return new (target as any)(...args);
      } as any;
    }

    if (kind === "field") {
      return function (this: any, initialValue: any) {
        warn();
        return initialValue;
      };
    }

    if (kind === "accessor") {
      return {
        get(this: any) {
          warn();
          return (
            target as ClassAccessorDecoratorTarget<unknown, unknown>
          ).get.call(this);
        },
        set(this: any, value: any) {
          warn();
          (target as ClassAccessorDecoratorTarget<unknown, unknown>).set.call(
            this,
            value,
          );
        },
        init(this: any, initialValue: any) {
          warn();
          return initialValue;
        },
      };
    }

    return function (this: any, ...args: any[]) {
      warn();
      return (target as Function).apply(this, args);
    };
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

  export function add(label: string): void {
    shown.add(label);
  }

  /**
   * Clears all shown warning labels.
   * Useful for testing or when you want to reset the warning state.
   *
   * @example
   * ```typescript
   * Deprecated.clear();
   * ```
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
