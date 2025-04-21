const { Viewer } = require('cesium');
const utils = require('../../../dist/index.cjs');
const { test } = require('vitest/dist/index.js');
const { expect } = require('vitest/dist/index.js');
const { describe } = require('vitest/dist/index.js');

describe('Common JS require test with Cesium', () => {
  test('require from Cesium', () => {
    expect(Viewer).toBeDefined();
  });

  test('require from dist', () => {
    expect(utils.cloneViewer).toBeDefined();
    expect(utils.Collection).toBeDefined();
    expect(utils.HybridTerrainProvider).toBeDefined();
    expect(utils.TerrainArea).toBeDefined();
    expect(utils.TerrainAreas).toBeDefined();
    expect(utils.TerrainVisualizer).toBeDefined();
    expect(utils.syncCamera).toBeDefined();
  })
})