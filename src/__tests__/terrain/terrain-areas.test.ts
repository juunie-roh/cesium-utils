import { EllipsoidTerrainProvider } from 'cesium';
import { beforeEach, describe, expect, it } from 'vitest';

import { TerrainArea, TerrainAreas } from '@/terrain/index.js';
import type { TileRange } from '@/terrain/terrain.types.js';

describe('TerrainAreas', () => {
  const option = (i: number): TerrainArea.ConstructorOptions => {
    const tileRanges = new Map<number, TileRange>();
    tileRanges.set(i, { start: { x: i, y: i }, end: { x: i, y: i } });
    return {
      provider: new EllipsoidTerrainProvider(),
      tileRanges,
    };
  };
  const create = (option: TerrainArea.ConstructorOptions) => {
    return new TerrainArea(option);
  };

  const areas: TerrainAreas = new TerrainAreas();

  beforeEach(() => {
    areas.removeAll();
  });

  describe('.add()', () => {
    it('should add an existing terrain area', () => {
      const area = create(option(0));
      expect(areas.add(area)).toEqual(areas.length);
    });

    it('should add a new terrain area', () => {
      expect(areas.add(option(0))).toEqual(areas.length);
      expect(areas.add(option(1))).toEqual(areas.length);
      expect(areas.add(option(2))).toEqual(areas.length);
    });

    it('should add multiple areas', () => {
      const arr = [];
      // Mixed array having TerrainArea instance and Constructor Options.
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          arr.push(option(i));
        } else {
          arr.push(create(option(i)));
        }
      }
      expect(areas.add(arr)).toEqual(areas.length);
    });
  });

  describe('.remove()', () => {
    it('should remove a terrain area', () => {
      const area = new TerrainArea(option(0));
      areas.add(area);

      expect(areas.remove(area)).toEqual(areas);
      expect(areas).toHaveLength(0);
    });

    it('should remove multiple terrain areas', () => {
      const arr = [];
      for (let i = 0; i < 10; i++) {
        arr.push(create(option(i)));
      }
      areas.add(arr);
      areas.add(option(11));

      expect(areas.remove(arr)).toEqual(areas);
      expect(areas).toHaveLength(1);
    });
  });
});
