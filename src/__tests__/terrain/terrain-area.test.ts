import {
  CesiumTerrainProvider,
  EllipsoidTerrainProvider,
  Rectangle,
  TerrainProvider,
} from 'cesium';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TerrainArea } from '@/terrain/index.js';
import type { TileRange } from '@/terrain/terrain.types.js';

describe('TerrainArea', () => {
  // Create a simple terrain provider for testing
  let provider: TerrainProvider;

  // Setup a tile range map for testing
  let tileRanges: Map<number, TileRange>;

  beforeEach(() => {
    // Initialize a new terrain provider before each test
    provider = new EllipsoidTerrainProvider();

    // Initialize tile ranges
    tileRanges = new Map<number, TileRange>();
    tileRanges.set(0, { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });
    tileRanges.set(1, { start: { x: 0, y: 0 }, end: { x: 3, y: 3 } });
  });

  describe('constructor', () => {
    it('should create a terrain area with default values', () => {
      const area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
      });

      expect(area).toBeInstanceOf(TerrainArea);
      expect(area.terrainProvider).toBe(provider);
      expect(area.tileRanges).toBe(tileRanges);
      expect(area.isCustom).toBe(true);
      expect(area.credit).toBe('custom');
      expect(area.ready).toBe(true);
      expect(area.rectangle).toBeInstanceOf(Rectangle);
    });

    it('should create a terrain area with custom values', () => {
      const area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
        isCustom: false,
        credit: 'test-credit',
      });

      expect(area.isCustom).toBe(false);
      expect(area.credit).toBe('test-credit');
    });
  });

  describe('contains', () => {
    let area: TerrainArea;

    beforeEach(() => {
      area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
      });
    });

    it('should return false for areas with no tile range', () => {
      area = new TerrainArea({
        terrainProvider: provider,
        tileRanges: new Map(),
      });

      expect(area.contains(0, 0, 0)).toBe(false);
    });

    it('should return true for tiles within the specified level and range', () => {
      // Level 0 has range (0,0) to (1,1)
      expect(area.contains(0, 0, 0)).toBe(true);
      expect(area.contains(1, 1, 0)).toBe(true);

      // Level 1 has range (0,0) to (3,3)
      expect(area.contains(2, 2, 1)).toBe(true);
    });

    it('should return false for tiles outside the specified level', () => {
      // Level 2 is not defined in tileRanges
      expect(area.contains(0, 0, 2)).toBe(false);
    });

    it('should return false for tiles outside the specified range', () => {
      // Level 0 only allows up to (1,1)
      expect(area.contains(2, 2, 0)).toBe(false);

      // Level 1 only allows up to (3,3)
      expect(area.contains(4, 4, 1)).toBe(false);
    });

    // it('should check rectangle intersection when no tile ranges are specified', () => {
    //   // Create a terrain area without tile ranges
    //   const emptyRanges = new Map<number, TileRange>();
    //   const areaWithoutRanges = new TerrainArea({
    //     terrainProvider: provider,
    //     tileRanges: emptyRanges,
    //   });

    //   // With EllipsoidTerrainProvider, the rectangle should cover the entire globe
    //   // so any valid tile should be contained
    //   expect(areaWithoutRanges.contains(0, 0, 0)).toBe(true);
    // });
  });

  describe('getTileDataAvailable', () => {
    let area: TerrainArea;

    beforeEach(() => {
      area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
      });
    });

    it('should return false for areas with no tile range', () => {
      area = new TerrainArea({
        terrainProvider: provider,
        tileRanges: new Map(),
      });

      expect(area.getTileDataAvailable(0, 0, 0)).toBe(false);
    });

    it('should return true for tiles within the specified level and range', () => {
      // Level 0 has range (0,0) to (1,1)
      expect(area.getTileDataAvailable(0, 0, 0)).toBe(true);
      expect(area.getTileDataAvailable(1, 1, 0)).toBe(true);

      // Level 1 has range (0,0) to (3,3)
      expect(area.getTileDataAvailable(2, 2, 1)).toBe(true);
    });

    it('should return false for tiles outside the specified level', () => {
      // Level 2 is not defined in tileRanges
      expect(area.getTileDataAvailable(0, 0, 2)).toBe(false);
    });

    it('should return false for tiles outside the specified range', () => {
      // Level 0 only allows up to (1,1)
      expect(area.getTileDataAvailable(2, 2, 0)).toBe(false);

      // Level 1 only allows up to (3,3)
      expect(area.getTileDataAvailable(4, 4, 1)).toBe(false);
    });

    // it('should defer to the terrain provider when no tile ranges are specified', () => {
    //   // Create a terrain area without tile ranges
    //   const emptyRanges = new Map<number, TileRange>();
    //   const areaWithoutRanges = new TerrainArea({
    //     terrainProvider: provider,
    //     tileRanges: emptyRanges,
    //   });

    //   // With EllipsoidTerrainProvider, all tiles should be available
    //   expect(areaWithoutRanges.getTileDataAvailable(0, 0, 0)).toBe(true);
    // });
  });

  describe('requestTileGeometry', () => {
    let area: TerrainArea;

    beforeEach(() => {
      area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
      });
    });

    it('should return undefined for tiles outside the specified level', () => {
      // Level 2 is not defined in tileRanges
      expect(area.requestTileGeometry(0, 0, 2)).toBeUndefined();
    });

    it('should return undefined for tiles outside the specified range', () => {
      // Level 0 only allows up to (1,1)
      expect(area.requestTileGeometry(2, 2, 0)).toBeUndefined();
    });

    it('should return a promise for valid tiles', () => {
      // Level 0 has range (0,0) to (1,1)
      const result = area.requestTileGeometry(0, 0, 0);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('rectangle computation', () => {
    it('should compute correct rectangle from tile ranges', () => {
      const area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
      });

      const rectangle = area.rectangle;
      expect(rectangle).toBeInstanceOf(Rectangle);

      // Rectangle should be valid
      expect(rectangle.west).toBeLessThan(rectangle.east);
      expect(rectangle.south).toBeLessThan(rectangle.north);
    });

    it('should handle empty tile ranges', () => {
      const emptyRanges = new Map<number, TileRange>();
      const area = new TerrainArea({
        terrainProvider: provider,
        tileRanges: emptyRanges,
      });

      const rectangle = area.rectangle;
      expect(rectangle).toBeInstanceOf(Rectangle);
    });
  });

  describe('getters', () => {
    it('should return the correct values for all getters', () => {
      const area = new TerrainArea({
        terrainProvider: provider,
        tileRanges,
        isCustom: false,
        credit: 'test-credit',
      });

      expect(area.terrainProvider).toBe(provider);
      expect(area.tileRanges).toBe(tileRanges);
      expect(area.isCustom).toBe(false);
      expect(area.credit).toBe('test-credit');
      expect(area.ready).toBe(true);
      expect(area.rectangle).toBeInstanceOf(Rectangle);
    });
  });

  describe('static methods', () => {
    let originalFromUrl: typeof CesiumTerrainProvider.fromUrl;

    beforeEach(() => {
      // Store the original method before each test
      originalFromUrl = CesiumTerrainProvider.fromUrl;

      // Replace with a mock that returns a simple provider
      CesiumTerrainProvider.fromUrl = vi
        .fn()
        .mockResolvedValue(new EllipsoidTerrainProvider());
    });

    afterEach(() => {
      // Restore the original method after each test
      CesiumTerrainProvider.fromUrl = originalFromUrl;
    });

    it('should have a fromUrl method for creating terrain areas from URLs', () => {
      expect(typeof TerrainArea.fromUrl).toBe('function');
    });

    it('should create terrain area from URL with default options', async () => {
      const tileRanges = new Map<number, TileRange>();
      tileRanges.set(0, { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });

      const terrainArea = await TerrainArea.fromUrl(
        'https://example.com/terrain',
        tileRanges,
      );

      expect(terrainArea).toBeInstanceOf(TerrainArea);
      expect(terrainArea.tileRanges).toEqual(tileRanges);
      expect(terrainArea.credit).toBe('custom');
      expect(terrainArea.isCustom).toBe(true);

      // Verify the mock was called correctly
      expect(CesiumTerrainProvider.fromUrl).toHaveBeenCalledWith(
        'https://example.com/terrain',
        expect.objectContaining({
          credit: 'custom',
        }),
      );
    });

    it('should create terrain area from URL with additional options', async () => {
      const tileRanges = new Map<number, TileRange>();
      tileRanges.set(0, { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });

      const terrainArea = await TerrainArea.fromUrl(
        'https://example.com/terrain',
        tileRanges,
        {
          requestVertexNormals: true,
          requestWaterMask: true,
        },
      );

      expect(terrainArea).toBeInstanceOf(TerrainArea);
      expect(CesiumTerrainProvider.fromUrl).toHaveBeenCalledWith(
        'https://example.com/terrain',
        expect.objectContaining({
          requestVertexNormals: true,
          requestWaterMask: true,
          credit: 'custom',
        }),
      );
    });

    it('should use custom credit when provided', async () => {
      const tileRanges = new Map<number, TileRange>();
      tileRanges.set(0, { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });

      const terrainArea = await TerrainArea.fromUrl(
        'https://example.com/terrain',
        tileRanges,
        { credit: 'My Custom Credit' },
      );

      expect(terrainArea.credit).toBe('My Custom Credit');
      expect(CesiumTerrainProvider.fromUrl).toHaveBeenCalledWith(
        'https://example.com/terrain',
        expect.objectContaining({
          credit: 'My Custom Credit',
        }),
      );
    });
  });
});
