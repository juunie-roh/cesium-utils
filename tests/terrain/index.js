import { Color, EllipsoidTerrainProvider, Terrain } from 'cesium';
import { HybridTerrainProvider, TerrainBounds, TerrainVisualizer } from 'dist';

/**
 * @param {import('cesium').Viewer} viewer 
 */
export function testTerrain(viewer) {
  const tileRanges = new Map();
  
  tileRanges.set(15, {
    start: { x: 55852, y: 9556 },
    end: { x: 55871, y: 9575 },
  });
  
  tileRanges.set(14, { 
    start: { x: 27926, y: 4778 },
    end: { x: 27935, y: 4787 },
  });
  
  tileRanges.set(13, {
    start: { x: 13963, y: 2389 },
    end: { x: 13967, y: 2393 },
  });
  
  const bounds = new TerrainBounds({
    type: 'tileRange',
    tileRanges,
  });
  
  const entityCollection = TerrainVisualizer.visualize(
    bounds,
    viewer,
    {
      color: Color.RED.withAlpha(0.7),
      show: true,
      levels: [13],
      tag: 'my_terrain_visualization',
      alpha: 0.7,
      tileAlpha: 0.3,
    },
  );
  
  console.log(`Created ${entityCollection.length} entities.`, entityCollection);

  const terrain = Terrain.fromWorldTerrain({
    requestVertexNormals: true,
  });

  terrain.readyEvent.addEventListener(async (provider) => {
    const hybrid = await HybridTerrainProvider.create({
      terrainAreas: [{
        provider,
        bounds,
        levels: [13, 14, 15],
        isCustom: true,
      }],
      defaultProvider: new EllipsoidTerrainProvider(),
    });
    console.log('🚀 ~ terrain.readyEvent.addEventListener ~ hybrid:', hybrid);
    viewer.terrainProvider = hybrid;
  })
}