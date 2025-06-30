// src/__tests__/viewer/clone.test.ts
import { TerrainProvider } from "cesium";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockViewer, Viewer } from "@/__mocks__/cesium.js";
import { cloneViewer, syncCamera } from "@/viewer/index.js";

// Mock dependencies
vi.mock("@/viewer/sync-camera.js", () => ({
  syncCamera: vi.fn(),
}));

// Mock Cesium
vi.mock("cesium", () => {
  return import("../../__mocks__/cesium.js");
});

describe("cloneViewer", () => {
  let mockSource: any;
  let mockDestination: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create source with standard mock
    mockSource = createMockViewer();

    // Create destination with needed properties
    mockDestination = {
      camera: {},
      clock: {
        startTime: {},
        stopTime: {},
        currentTime: {},
      },
      scene: {
        globe: {
          enableLighting: false,
        },
        screenSpaceCameraController: {},
      },
      imageryLayers: {
        removeAll: vi.fn(),
        addImageryProvider: vi.fn(),
      },
    };

    Viewer.mockReturnValue(mockDestination);
  });

  it("should create a new viewer with copied configuration", () => {
    const containerElement = "mockContainer";

    const result = cloneViewer(mockSource, containerElement);

    expect(Viewer).toHaveBeenCalledWith(containerElement, {
      baseLayerPicker: true,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      timeline: true,
      navigationHelpButton: true,
      animation: true,
      fullscreenButton: true,
      shouldAnimate: true,
      terrainProvider: mockSource.terrainProvider,
      requestRenderMode: true,
      infoBox: true,
    });

    expect(syncCamera).toHaveBeenCalledWith(mockSource, mockDestination);
    expect(mockDestination.imageryLayers.removeAll).toHaveBeenCalled();
    expect(
      mockDestination.imageryLayers.addImageryProvider,
    ).toHaveBeenCalledWith({ id: "mockImageryProvider" }, 0);
    expect(result).toBe(mockDestination);
  });

  it("should override default options with provided options", () => {
    const customTerrainProvider = { id: "customTerrainProvider" };
    const customOptions = {
      baseLayerPicker: false,
      requestRenderMode: false,
      terrainProvider: customTerrainProvider as unknown as TerrainProvider,
    };

    cloneViewer(mockSource, "container", customOptions);

    expect(Viewer).toHaveBeenCalledWith(
      "container",
      expect.objectContaining({
        baseLayerPicker: false,
        requestRenderMode: false,
        terrainProvider: customTerrainProvider,
      }),
    );
  });

  it("should handle non-array event types", () => {
    // Instead of replacing the entire structure, just modify the specific properties
    mockSource.scene.screenSpaceCameraController.tiltEventTypes =
      "singleTiltType";
    mockSource.scene.screenSpaceCameraController.zoomEventTypes =
      "singleZoomType";

    const result = cloneViewer(mockSource, "container");

    // Verify the function executes successfully
    expect(result).toBeDefined();
  });

  afterAll(() => vi.clearAllMocks());
});
