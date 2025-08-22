import * as Cesium from 'cesium';
import * as utils from '../../../dist/index.js';
import * as dev from "../../../dist/dev/index.js"
import * as exp from "../../../dist/experimental/index.js"
import { describe, expect, test } from 'vitest';

describe('ECMA Script Module import test with Cesium', () => {
  test('import from Cesium', () => {
    expect(Cesium).toBeDefined();
  });

  test('import from dist', () => {
    expect(utils).toBeDefined();
    expect(dev).toBeDefined();
    expect(exp).toBeDefined();
  });
});
