import { EllipsoidTerrainProvider } from 'cesium';
import { beforeEach, describe, expect, it } from 'vitest';

import { TerrainArea } from '@/terrain/terrain-area.js';
import TerrainAreas from '@/terrain/terrain-areas.js';
import { TerrainBounds } from '@/terrain/terrain-bounds.js';

describe('TerrainAreas', () => {
  const option = (i: number): TerrainArea.ConstructorOptions => ({
    provider: new EllipsoidTerrainProvider(),
    bounds: TerrainBounds.fromTileRange(i + 1, i + 1, i + 1, i + 1, i + 1),
  });
  const create = (option: TerrainArea.ConstructorOptions) => {
    return TerrainArea.create(option);
  };

  const areas: TerrainAreas = new TerrainAreas();

  beforeEach(() => {
    areas.removeAll();
  });

  describe('.add()', () => {
    it('should add an existing terrain area', async () => {
      const area = await create(option(0));
      expect(await areas.add(area)).toEqual(areas.length);
    });

    it('should add a new terrain area', async () => {
      expect(await areas.add(option(0))).toEqual(areas.length);
      expect(await areas.add(option(1))).toEqual(areas.length);
      expect(await areas.add(option(2))).toEqual(areas.length);
    });

    it('should add multiple areas', async () => {
      const arr = [];
      // Mixed array having TerrainArea instance and Constructor Options.
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          arr.push(option(i));
        } else {
          arr.push(await create(option(i)));
        }
      }
      expect(await areas.add(arr)).toEqual(areas.length);
    });
  });

  describe('.remove()', () => {
    it('should remove a terrain area', async () => {
      const area = await TerrainArea.create(option(0));
      await areas.add(area);

      expect(areas.remove(area)).toEqual(areas);
      expect(areas).toHaveLength(0);
    });

    it('should remove multiple terrain areas', async () => {
      const arr = [];
      for (let i = 0; i < 10; i++) {
        arr.push(await create(option(i)));
      }
      await areas.add(arr);
      await areas.add(option(11));

      expect(areas.remove(arr)).toEqual(areas);
      expect(areas).toHaveLength(1);
    });
  });
});
