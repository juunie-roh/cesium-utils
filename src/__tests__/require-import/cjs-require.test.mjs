import { createRequire } from "module";
import { describe, expect, test } from "vitest";

// Vitest 4.x: Convert to ESM with createRequire to test CommonJS compatibility
const require = createRequire(import.meta.url);

const Cesium = require("cesium");
const main = require("../../../dist/index.cjs");
const utils = require("../../../dist/index.cjs");
const dev = require("../../../dist/dev/index.cjs");
const exp = require("../../../dist/experimental/index.cjs");

describe("Common JS require test with Cesium", () => {
  test("require from Cesium", () => {
    expect(Cesium).toBeDefined();
  });

  test("require from dist", () => {
    expect(main).toBeDefined();
    expect(utils).toBeDefined();
    expect(dev).toBeDefined();
    expect(exp).toBeDefined();
  });
});
