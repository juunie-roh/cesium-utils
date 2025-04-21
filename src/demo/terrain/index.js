import { EllipsoidTerrainProvider, Terrain } from 'cesium';
import { cloneViewer, HybridTerrainProvider, syncCamera, TerrainBounds, TerrainVisualizer } from '../../../dist/index';

/**
 * @param {import('cesium').Viewer} viewer 
 */
export function testTerrain(viewer) {
  const tileRanges = new Map();
  
  tileRanges.set(13, { start: { x: 13963, y: 2389 }, end: { x: 13967, y: 2393 } });
  // tileRanges.set(14, { start: { x: 27926, y: 4778 }, end: { x: 27935, y: 4787 } });
  // tileRanges.set(15, { start: { x: 55852, y: 9556 }, end: { x: 55871, y: 9575 } });

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
    
    const viewer2 = cloneViewer(viewer, 'cloneContainer');
    window.viewer2 = viewer2;
    viewer.camera.percentageChanged = 0.01;
    viewer.camera.changed.addEventListener(() => syncCamera(viewer, viewer2));
  });
}