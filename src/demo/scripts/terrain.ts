import * as Cesium from "cesium";

import { TerrainVisualizer } from "@/dev/index.js";
import type { TerrainRegion } from "@/terrain/index.js";
import { HybridTerrainProvider } from "@/terrain/index.js";

const { viewer } = window;
viewer.camera.flyTo({
  destination: new Cesium.Cartesian3(
    -3046596.558550092,
    4065701.630895504,
    3854536.407434127,
  ),
  orientation: {
    heading: Cesium.Math.toRadians(0),
    pitch: Cesium.Math.toRadians(-45),
    roll: 0.0,
  },
});

// Demo: HybridTerrainProvider with multiple regions and zoom levels
function setupHybridTerrainDemo() {
  const terrain = Cesium.Terrain.fromWorldTerrain({
    requestVertexNormals: true,
  });

  terrain.readyEvent.addEventListener((provider) => {
    // Region 1: Level 13 world terrain covering area A
    const region: TerrainRegion = {
      provider,
      tiles: new Map().set(13, {
        x: [13963, 13967],
        y: [2389, 2393],
      }),
    };

    // Region 2: Level 13 world terrain covering area B
    const region2: TerrainRegion = {
      provider,
      tiles: new Map().set(13, {
        x: [13956, 13959],
        y: 2392,
      }),
    };

    // Region 3: Level 14 ellipsoid terrain (higher zoom override)
    const region3: TerrainRegion = {
      provider: new Cesium.EllipsoidTerrainProvider(),
      tiles: new Map().set(14, {
        x: [27930, 27931],
        y: [4784, 4785],
      }),
    };

    // Create hybrid terrain provider with multiple regions
    const hybrid = new HybridTerrainProvider({
      regions: [region, region2, region3],
      defaultProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    // Apply to viewer
    viewer.terrainProvider = hybrid;

    // Add terrain visualizer to show terrain tiles
    const visualizer = new TerrainVisualizer(viewer, {
      terrainProvider: hybrid,
    });

    // Show terrain tiles for visualization
    visualizer.show(13);

    console.log("HybridTerrainProvider demo loaded!");
    console.log(
      "- Region 1: World terrain at level 13 (x: 13963-13967, y: 2389-2393)",
    );
    console.log(
      "- Region 2: World terrain at level 13 (x: 13956-13959, y: 2392)",
    );
    console.log(
      "- Region 3: Ellipsoid terrain at level 14 (x: 27930-27931, y: 4784-4785)",
    );
    console.log("- Default: Ellipsoid terrain everywhere else");
  });
}

// Initialize demo when script loads
setupHybridTerrainDemo();
