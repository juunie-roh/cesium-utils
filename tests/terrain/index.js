import { Color, EllipsoidTerrainProvider, Terrain } from 'cesium';
import { HybridTerrainProvider, TerrainBounds, TerrainVisualizer } from '../../dist/index';

/**
 * @param {import('cesium').Viewer} viewer 
 */
export function testTerrain(viewer) {
  const tileRanges = new Map();
  
  tileRanges.set(13, {
    start: { x: 13963, y: 2389 },
    end: { x: 13967, y: 2393 },
  });
  /** @type {import('../../@types/index').TerrainBounds} */
  const bounds = new TerrainBounds({
    type: 'tileRange',
    tileRanges,
  });

  const terrain = Terrain.fromWorldTerrain({
    requestVertexNormals: true,
  });

  terrain.readyEvent.addEventListener(async (provider) => {
    const hybrid = await HybridTerrainProvider.create({
      terrainAreas: [{
        provider,
        bounds,
        isCustom: true,
      }],
      terrainProvider: new EllipsoidTerrainProvider(),
    });
    console.log('🚀 ~ terrain.readyEvent.addEventListener ~ hybrid:', hybrid);
    viewer.terrainProvider = hybrid;
    const visualizer = new TerrainVisualizer(viewer, {
      terrainProvider: hybrid,
    });

    window.visualizer = visualizer;
  });
}