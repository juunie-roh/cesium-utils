import {
  Camera as CCamera,
  Clock as CClock,
  EntityCollection as CEntityCollection,
  ImageryLayerCollection as CImageryLayerCollection,
  Scene as CScene,
  TerrainProvider as CTerrainProvider,
  Viewer as CViewer,
} from "cesium";
import { type Mock, vi } from "vitest";

// Deep merge utility
function merge(to: any, from?: any) {
  if (!from) return to;
  Object.keys(from).forEach((key) => {
    if (key === "__proto__" || key === "constructor") {
      return; // Skip prototype-polluting keys
    }

    // Skip read-only properties (Vitest 4.x mock functions have getters)
    const descriptor = Object.getOwnPropertyDescriptor(to, key);
    if (descriptor && descriptor.get && !descriptor.set) {
      return; // Skip getter-only properties
    }

    if (from[key] instanceof Object && key in to) {
      merge(to[key], from[key]);
    } else {
      to[key] = from[key];
    }
  });

  return to;
}

// Helper to create a cloneable object with a clone method
function createCloneable<T>(value: T): { clone: Mock } {
  return {
    clone: vi.fn().mockReturnValue(value),
  };
}

// Helper for type assertion
function createMock<T>(base: any, overrides?: Partial<T>): Partial<T> {
  return merge(base, overrides);
}

// Create a mock camera
const createMockCamera = (overrides?: Partial<CCamera>) =>
  createMock(
    {
      positionWC: createCloneable("position-clone"),
      directionWC: createCloneable("direction-clone"),
      upWC: createCloneable("up-clone"),
      position: {},
      direction: {},
      up: {},
      computeViewRectangle: vi.fn(),
      flyTo: vi.fn(),
    },
    overrides,
  );

// Create a mock clock
const createMockClock = (overrides?: Partial<CClock>) =>
  createMock(
    {
      startTime: createCloneable("startTime"),
      stopTime: createCloneable("stopTime"),
      currentTime: createCloneable("currentTime"),
      multiplier: 1,
      clockStep: "SYSTEM_CLOCK_MULTIPLIER",
      clockRange: "LOOP_STOP",
      shouldAnimate: true,
    },
    overrides,
  );

// Create a mock imageryLayers collection
const createMockImageryLayers = (
  overrides?: Partial<CImageryLayerCollection>,
) =>
  createMock(
    {
      length: 1,
      get: vi.fn().mockReturnValue({
        imageryProvider: { id: "mockImageryProvider" },
      }),
      removeAll: vi.fn(),
      addImageryProvider: vi.fn(),
    },
    overrides,
  );

// Updated EntityCollection mock
const createMockEntities = (overrides?: Partial<CEntityCollection>) =>
  createMock(
    {
      add: vi.fn().mockImplementation((entity) => entity), // Return the entity being added
      remove: vi.fn().mockReturnValue(true),
      removeAll: vi.fn(),
      contains: vi.fn().mockReturnValue(true),
      getById: vi.fn(),
      values: [],
    },
    overrides,
  );

// Create a mock scene
const createMockScene = (overrides?: Partial<CScene>) =>
  createMock(
    {
      primitives: vi.fn().mockImplementation(() => ({})),
      groundPrimitives: vi.fn().mockImplementation(() => ({})),
      requestRenderMode: true,
      globe: {
        enableLighting: false,
        depthTestAgainstTerrain: true,
      },
      screenSpaceCameraController: {
        enableCollisionDetection: true,
        tiltEventTypes: ["type1", "type2"],
        zoomEventTypes: ["zoom1", "zoom2"],
      },
    },
    overrides,
  );

// Create a complete mock Viewer
const createMockViewer = (overrides?: Partial<CViewer>) =>
  createMock(
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

      container: document.createElement("div"),
      camera: createMockCamera(overrides?.camera),
      clock: createMockClock(overrides?.clock),
      entities: createMockEntities(overrides?.entities),
      imageryLayers: createMockImageryLayers(overrides?.imageryLayers),
      terrainProvider: { id: "mockTerrainProvider" },
      scene: createMockScene(overrides?.scene),
    },
    overrides,
  );

// Mock terrain providers
const createMockTerrainProvider = (overrides?: CTerrainProvider) =>
  createMock(
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

const defined: Mock = vi.fn();

const EllipsoidTerrainProvider = vi.fn(function (this: any) {
  Object.assign(this, createMockTerrainProvider());
});
const CesiumTerrainProvider: { fromUrl: Mock } = {
  fromUrl: vi.fn().mockResolvedValue(createMockTerrainProvider()),
};

// Vitest 4.x requires constructors to be defined using function or class keywords
// For constructors, we need to assign to `this` rather than return
const Camera = vi.fn(function (this: any) {
  Object.assign(this, createMockCamera());
});
const Clock = vi.fn(function (this: any) {
  Object.assign(this, createMockClock());
});
const Color = vi.fn(function (this: any) {
  Object.assign(this, { withAlpha: vi.fn().mockReturnValue({}) });
});
const Entity = vi.fn(function (this: any) {
  // Empty constructor
});
const EntityCollection = vi.fn(function (this: any) {
  Object.assign(this, { add: vi.fn(), remove: vi.fn() });
});
const HeightReference = vi.fn(function (this: any) {
  // Empty constructor
});
const Rectangle = vi.fn(function (this: any) {
  // Empty constructor
});
const TileCoordinatesImageryProvider = vi.fn(function (this: any) {
  // Empty constructor
});
// Viewer constructor - in Vitest 4.x, constructors must use function keyword
const Viewer: any = vi.fn(function (
  this: any,
  _container?: any,
  _options?: any,
) {
  Object.assign(this, createMockViewer());
});

export {
  Camera,
  CesiumTerrainProvider,
  Clock,
  Color,
  createCloneable,
  createMockCamera,
  createMockClock,
  createMockEntities,
  createMockImageryLayers,
  createMockScene,
  createMockTerrainProvider,
  createMockViewer,
  defined,
  EllipsoidTerrainProvider,
  Entity,
  EntityCollection,
  HeightReference,
  Rectangle,
  TileCoordinatesImageryProvider,
  Viewer,
};
