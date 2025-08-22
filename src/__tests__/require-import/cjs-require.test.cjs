const Cesium = require('cesium');
const { describe, expect, test } = require('vitest/dist/index.js');
const utils = require('../../../dist/index.cjs');
const dev = require('../../../dist/dev/index.cjs');
const exp = require('../../../dist/experimental/index.cjs');

describe('Common JS require test with Cesium', () => {
  test('require from Cesium', () => {
    expect(Cesium).toBeDefined();
  });

  test('require from dist', () => {
    expect(utils).toBeDefined();
    expect(dev).toBeDefined();
    expect(exp).toBeDefined();
  })
})