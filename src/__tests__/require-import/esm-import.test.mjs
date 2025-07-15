import { Viewer } from 'cesium';
import * as utils from '../../../dist/index.js';
import { describe, expect, test } from 'vitest';

describe('ECMA Script Module import test with Cesium', () => {
  test('import from Cesium', () => {
    expect(Viewer).toBeDefined();
  });

  test('import from dist', () => {
    expect(utils.Collection).toBeDefined();
    expect(utils.HybridTerrainProvider).toBeDefined();
    expect(utils.TerrainArea).toBeDefined();
    expect(utils.TerrainVisualizer).toBeDefined();

    expect(utils.cloneViewer).toBeDefined();
    expect(utils.isGetterOnly).toBeDefined();
    expect(utils.syncCamera).toBeDefined();
  });
});
