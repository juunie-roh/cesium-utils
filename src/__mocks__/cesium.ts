import { vi } from 'vitest';

// Deep merge utility
function deepMerge(to: any, from: any) {
  Object.keys(from).forEach((key) => {
    if (key === '__proto__' || key === 'constructor') {
      return; // Skip prototype-polluting keys
    }
    if (from[key] instanceof Object && key in to) {
      deepMerge(to[key], from[key]);
    } else {
      to[key] = from[key];
    }
  });

  return to;
}

// Helper to create a cloneable object with a clone method
const createCloneable = (value: any) => ({
  clone: vi.fn().mockReturnValue(value),
});

// Create a mock camera
const createMockCamera = (overrides = {}) =>
  deepMerge(
    {
      positionWC: createCloneable('position-clone'),
      directionWC: createCloneable('direction-clone'),
      upWC: createCloneable('up-clone'),
      position: {},
      direction: {},
      up: {},
    },
    overrides,
  );

// Create a mock clock
const createMockClock = (overrides = {}) =>
  deepMerge(
    {
      startTime: createCloneable('startTime'),
      stopTime: createCloneable('stopTime'),
      currentTime: createCloneable('currentTime'),
      multiplier: 1,
      clockStep: 'SYSTEM_CLOCK_MULTIPLIER',
      clockRange: 'LOOP_STOP',
      shouldAnimate: true,
    },
    overrides,
  );

// Create a mock imageryLayers collection
const createMockImageryLayers = (overrides = {}) =>
  deepMerge(
    {
      length: 1,
      get: vi.fn().mockReturnValue({
        imageryProvider: { id: 'mockImageryProvider' },
      }),
      removeAll: vi.fn(),
      addImageryProvider: vi.fn(),
    },
    overrides,
  );

// Create a mock scene
const createMockScene = (
  overrides: {
    globe?: any;
    screenSpaceCameraController?: any;
  } = {},
) =>
  deepMerge(
    {
      requestRenderMode: true,
      globe: {
        enableLighting: false,
        depthTestAgainstTerrain: true,
      },
      screenSpaceCameraController: {
        enableCollisionDetection: true,
        tiltEventTypes: ['type1', 'type2'],
        zoomEventTypes: ['zoom1', 'zoom2'],
      },
    },
    overrides,
  );

// Create a complete mock Viewer
const createMockViewer = (
  overrides: {
    camera?: any;
    clock?: any;
    scene?: any;
    imageryLayers?: any;
  } = {},
) =>
  deepMerge(
    {
      baseLayerPicker: true,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      timeline: true,
      navigationHelpButton: true,
      animation: true,
      fullscreenButton: true,
      infoBox: true,

      camera: createMockCamera(overrides.camera),
      clock: createMockClock(overrides.clock),
      terrainProvider: { id: 'mockTerrainProvider' },
      scene: createMockScene(overrides.scene),
      imageryLayers: createMockImageryLayers(overrides.imageryLayers),
    },
    overrides,
  );

// Mock terrain providers
const createMockTerrainProvider = (overrides = {}) =>
  deepMerge(
    {
      availability: {
        addAvailableTileRange: vi.fn(),
      },
      tilingScheme: {
        tileXYToRectangle: vi.fn(),
      },
      requestTileGeometry: vi.fn(),
      getTileDataAvailable: vi.fn(),
    },
    overrides,
  );

// Mock Cesium classes
const Viewer = vi.fn();
const EntityCollection = vi.fn();
const EllipsoidTerrainProvider = vi
  .fn()
  .mockImplementation(() => createMockTerrainProvider());
const Rectangle = vi.fn().mockImplementation(() => ({}));
const CesiumTerrainProvider = {
  fromUrl: vi.fn().mockResolvedValue(createMockTerrainProvider()),
};

export {
  CesiumTerrainProvider,
  createCloneable,
  createMockCamera,
  createMockClock,
  createMockImageryLayers,
  createMockScene,
  createMockViewer,
  EllipsoidTerrainProvider,
  EntityCollection,
  Rectangle,
  Viewer,
};
