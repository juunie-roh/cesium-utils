import { Viewer } from 'cesium';
import * as utils from '../../dist/index.js';

console.log(`-- ECMA Script Module import test with Cesium
Viewer(cesium):           ${!!Viewer}
cloneViewer:              ${!!utils.cloneViewer}
Collection:               ${!!utils.Collection}
HybridTerrainProvider:    ${!!utils.HybridTerrainProvider}
TerrainArea:              ${!!utils.TerrainArea}
TerrainAreas:             ${!!utils.TerrainAreas}
TerrainBounds:            ${!!utils.TerrainBounds}
TerrainVisualizer:        ${!!utils.TerrainVisualizer}
syncCamera:               ${!!utils.syncCamera}
`);
