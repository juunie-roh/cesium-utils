const { Viewer } = require('cesium');
const { describe, expect, test } = require('vitest/dist/index.js');
const utils = require('../../../dist/index.cjs');

describe('Common JS require test with Cesium', () => {
  test('require from Cesium', () => {
    expect(Viewer).toBeDefined();
  });

  test('require from dist', () => {
    expect(utils.Collection).toBeDefined();
    expect(utils.HybridTerrainProvider).toBeDefined();
    expect(utils.TerrainArea).toBeDefined();
    expect(utils.TerrainVisualizer).toBeDefined();

    expect(utils.cloneViewer).toBeDefined();
    expect(utils.isGetterOnly).toBeDefined();
    expect(utils.syncCamera).toBeDefined();
  })
})