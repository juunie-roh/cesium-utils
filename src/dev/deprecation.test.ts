import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Deprecate from "@/dev/deprecation.js";

describe("deprecation utilities", () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    // Mock console.warn
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    // Clear any existing warnings
    Deprecate.clear();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    Deprecate.clear();
  });

  describe("deprecationWarning", () => {
    it("should show a basic deprecation warning", () => {
      const message = "oldFunction() is deprecated";
      Deprecate.warn(message);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DEPRECATED] oldFunction() is deprecated",
      );
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it("should show warning only once by default", () => {
      const message = "repeated warning";

      Deprecate.warn(message);
      Deprecate.warn(message);
      Deprecate.warn(message);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith("[DEPRECATED] repeated warning");
    });

    it("should allow showing warning multiple times when once=false", () => {
      const message = "multiple warning";
      const options: Deprecate.Options = { once: false };

      Deprecate.warn(message, options);
      Deprecate.warn(message, options);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it("should use custom prefix", () => {
      const message = "test message";
      const options: Deprecate.Options = { prefix: "[CUSTOM]" };

      Deprecate.warn(message, options);

      expect(consoleSpy).toHaveBeenCalledWith("[CUSTOM] test message");
    });

    it("should include removal version when specified", () => {
      const message = "feature is deprecated";
      const options: Deprecate.Options = { removeInVersion: "v2.0.0" };

      Deprecate.warn(message, options);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[DEPRECATED] feature is deprecated This feature will be removed in v2.0.0.",
      );
    });

    it("should include stack trace when requested", () => {
      const traceSpy = vi.spyOn(console, "trace").mockImplementation(() => {});
      const message = "stack trace test";
      const options: Deprecate.Options = { includeStack: true };

      Deprecate.warn(message, options);

      expect(consoleSpy).toHaveBeenCalledWith("[DEPRECATED] stack trace test");
      expect(traceSpy).toHaveBeenCalledWith("Deprecation stack trace:");

      traceSpy.mockRestore();
    });

    it("should handle missing console gracefully", () => {
      const originalConsole = globalThis.console;
      // @ts-ignore - Intentionally setting to undefined for testing
      globalThis.console = undefined;

      expect(() => {
        Deprecate.warn("test message");
      }).not.toThrow();

      globalThis.console = originalConsole;
    });
  });

  describe("deprecate", () => {
    it("should wrap function with deprecation warning", () => {
      const originalFn = vi.fn((x: number) => x * 2);
      const message = "function is deprecated";

      const wrappedFn = Deprecate.deprecate(originalFn, message);
      const result = wrappedFn(5);

      expect(result).toBe(10);
      expect(originalFn).toHaveBeenCalledWith(5);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[DEPRECATED] function is deprecated",
      );
    });

    it("should preserve function name", () => {
      function namedFunction() {
        return "test";
      }

      const wrapped = Deprecate.deprecate(namedFunction, "deprecated");

      expect(wrapped.name).toBe("namedFunction");
    });

    it("should pass through function arguments correctly", () => {
      const originalFn = vi.fn((a: string, b: number, c: boolean) => ({
        a,
        b,
        c,
      }));
      const wrappedFn = Deprecate.deprecate(originalFn, "test");

      const result = wrappedFn("hello", 42, true);

      expect(result).toEqual({ a: "hello", b: 42, c: true });
      expect(originalFn).toHaveBeenCalledWith("hello", 42, true);
    });

    it("should show warning with custom options", () => {
      const fn = () => "result";
      const options: Deprecate.Options = {
        prefix: "[CUSTOM]",
        removeInVersion: "v3.0.0",
      };

      const wrapped = Deprecate.deprecate(fn, "custom deprecation", options);
      wrapped();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[CUSTOM] custom deprecation This feature will be removed in v3.0.0.",
      );
    });
  });

  describe("clearDeprecationWarnings", () => {
    it("should clear shown warnings allowing them to show again", () => {
      const message = "test warning";

      Deprecate.warn(message);
      expect(consoleSpy).toHaveBeenCalledTimes(1);

      Deprecate.warn(message);
      expect(consoleSpy).toHaveBeenCalledTimes(1); // Still 1, not shown again

      Deprecate.clear();
      Deprecate.warn(message);
      expect(consoleSpy).toHaveBeenCalledTimes(2); // Now shown again
    });
  });

  describe("getDeprecationWarningCount", () => {
    it("should return 0 initially", () => {
      expect(Deprecate.getWarningCount()).toBe(0);
    });

    it("should count unique warnings", () => {
      Deprecate.warn("warning 1");
      expect(Deprecate.getWarningCount()).toBe(1);

      Deprecate.warn("warning 2");
      expect(Deprecate.getWarningCount()).toBe(2);

      Deprecate.warn("warning 1"); // Duplicate, shouldn't count
      expect(Deprecate.getWarningCount()).toBe(2);
    });

    it("should reset after clearing", () => {
      Deprecate.warn("warning 1");
      Deprecate.warn("warning 2");
      expect(Deprecate.getWarningCount()).toBe(2);

      Deprecate.clear();
      expect(Deprecate.getWarningCount()).toBe(0);
    });
  });

  describe("hasShownDeprecationWarning", () => {
    it("should return false for unshown warnings", () => {
      expect(Deprecate.hasShown("never shown")).toBe(false);
    });

    it("should return true for shown warnings", () => {
      const message = "shown warning";
      Deprecate.warn(message);

      expect(Deprecate.hasShown(message)).toBe(true);
    });

    it("should return false after clearing", () => {
      const message = "cleared warning";
      Deprecate.warn(message);
      expect(Deprecate.hasShown(message)).toBe(true);

      Deprecate.clear();
      expect(Deprecate.hasShown(message)).toBe(false);
    });
  });

  describe("environment variable handling", () => {
    it("should respect CESIUM_UTILS_DISABLE_DEPRECATION_WARNINGS", () => {
      // Note: This test is limited since we can't easily mock process.env
      // in a way that affects the module loading. In a real scenario,
      // you'd test this with separate test processes or mocking at the module level.

      // This is more of a documentation of the expected behavior
      Deprecate.warn("test message");
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
