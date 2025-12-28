import * as Cesium from "cesium";
import { describe, expect, test } from "vitest";

import * as dev from "../../../dist/dev/index.js";
import * as exp from "../../../dist/experimental/index.js";
import * as main from "../../../dist/index.js";
import * as utils from "../../../dist/index.js";

describe("ECMA Script Module import test with Cesium", () => {
  test("import from Cesium", () => {
    expect(Cesium).toBeDefined();
  });

  test("import from dist", () => {
    expect(main).toBeDefined();
    expect(utils).toBeDefined();
    expect(dev).toBeDefined();
    expect(exp).toBeDefined();
  });
});
