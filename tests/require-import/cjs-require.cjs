const { Viewer } = require('cesium');
const utils = require('../../dist/index.cjs');

console.log(`-- CommonJS require test with Cesium
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
