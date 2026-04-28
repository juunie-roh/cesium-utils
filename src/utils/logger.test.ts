import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Logger from "./logger.js";

// Reset singleton between tests by clearing the private static field
function resetSingleton() {
  (Logger as unknown as { _instance: undefined })._instance = undefined;
}

describe("Logger", () => {
  beforeEach(() => {
    resetSingleton();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it("returns a singleton", () => {
    expect(Logger.get()).toBe(Logger.get());
  });

  it("defaults to info level", () => {
    const log = Logger.get();
    log.debug("hidden");
    log.info("shown");

    expect(console.log).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledOnce();
  });

  it("respects LOG_LEVEL=debug", () => {
    process.env.LOG_LEVEL = "debug";
    const log = Logger.get();
    log.debug("visible");

    expect(console.log).toHaveBeenCalledOnce();
  });

  it("respects LOG_LEVEL=error", () => {
    process.env.LOG_LEVEL = "error";
    const log = Logger.get();
    log.info("hidden");
    log.warn("hidden");
    log.error("shown");

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("formats output with padded level tag", () => {
    process.env.LOG_LEVEL = "warn";
    const log = Logger.get();
    log.warn("oops");

    const [tag, ...rest] = (console.warn as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(tag).toMatch(/^\[WARN\]\s+$/);
    expect(rest).toEqual(["oops"]);
  });

  it("passes variadic args through", () => {
    const log = Logger.get();
    log.info("a", 1, { b: 2 });

    const [, ...rest] = (console.info as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(rest).toEqual(["a", 1, { b: 2 }]);
  });

  it("falls back to info for unknown LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "verbose";
    const log = Logger.get();
    log.debug("hidden");
    log.info("shown");

    expect(console.log).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledOnce();
  });
});
