import {
  Cartesian3,
  Clock,
  Color,
  Entity,
  EntityCollection,
  JulianDate,
  PrimitiveCollection,
  Ray,
  Scene,
  Viewer,
} from "cesium";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockScene, createMockViewer } from "@/__mocks__/cesium.js";
import Sunlight from "@/experimental/sunlight.js";

describe("Sunlight", () => {
  let viewer: Viewer;
  let sunlight: Sunlight;
  let mockPickFromRay: any;

  beforeEach(() => {
    // Mock browser APIs for Material creation in jsdom environment
    if (typeof ImageBitmap === "undefined") {
      (global as any).ImageBitmap = class ImageBitmap {};
    }
    if (typeof OffscreenCanvas === "undefined") {
      (global as any).OffscreenCanvas = class OffscreenCanvas {
        constructor(
          public width: number,
          public height: number,
        ) {}
      };
    }

    // Mock picking functionality
    mockPickFromRay = vi.fn().mockReturnValue({
      object: null,
      position: new Cartesian3(100, 100, 100),
    });

    viewer = createMockViewer({
      container: document.createElement("div"),
      scene: createMockScene({
        // @ts-expect-error
        context: {
          uniformState: {
            _sunPositionWC: new Cartesian3(1000, 1000, 1000),
            _sunDirectionWC: new Cartesian3(0.5, 0.5, 0.7),
          },
        },
        pickFromRayMostDetailed: mockPickFromRay,
        render: vi.fn(),
        primitives: {
          add: vi.fn().mockImplementation((item) => item),
        } as unknown as PrimitiveCollection,
      }) as unknown as Scene,
      clock: {
        currentTime: JulianDate.now(),
      } as unknown as Clock,
      entities: {
        add: vi.fn().mockImplementation((entity) => {
          if (!entity.id) {
            entity.id = `mock-entity-${Math.random()}`;
          }
          return entity;
        }),
        removeById: vi.fn(),
        getById: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
        remove: vi.fn(),
      } as unknown as EntityCollection,
    }) as unknown as Viewer;

    sunlight = new Sunlight(viewer);
  });

  afterEach(() => {
    sunlight.clear();
  });

  describe("constructor", () => {
    it("should initialize with viewer and extract sun data from uniformState", () => {
      expect(sunlight.sunPositionWC).toEqual(new Cartesian3(1000, 1000, 1000));
      expect(sunlight.sunDirectionWC).toEqual(new Cartesian3(0.5, 0.5, 0.7));
      expect(sunlight.isAnalyzing).toBe(false);
    });
  });

  describe("getVirtualSunPosition", () => {
    it("should calculate virtual sun position at specified distance", () => {
      const from = new Cartesian3(0, 0, 0);
      const virtualSun = sunlight.virtualSun(from, 500);

      // Should be 500 units away in the direction of the sun
      const distance = Cartesian3.distance(from, virtualSun.position);
      expect(distance).toBeCloseTo(500, 1);
    });

    it("should use default radius of 10000 when not specified", () => {
      const from = new Cartesian3(0, 0, 0);
      const virtualSun = sunlight.virtualSun(from);

      const distance = Cartesian3.distance(from, virtualSun.position);
      expect(distance).toBeCloseTo(10000, 1);
    });
  });

  describe("setTargetPoint", () => {
    it("should set detection ellipsoid", () => {
      const at = new Cartesian3(100, 100, 0);
      const entity = sunlight.setTargetPoint(at);
      const ellipsoid = sunlight["_pointEntityId"];
      expect(entity.id).toEqual(ellipsoid);
    });

    it("should remove the previously set ellipsoid", () => {
      const at = new Cartesian3(100, 100, 0);
      sunlight.setTargetPoint(at, undefined, 5);
      sunlight.setTargetPoint(at, undefined, 10);
      expect(viewer.entities.removeById).toHaveBeenCalled();
    });

    it("should set color property according to the show status", () => {
      const at = new Cartesian3(100, 100, 0);
      const showFalse = sunlight.setTargetPoint(at);
      expect(showFalse.ellipsoid?.material).toBeUndefined();

      const showTrue = sunlight.setTargetPoint(at, true);
      expect(showTrue.ellipsoid?.material).toBeDefined();

      const color = Color.WHITE;
      const withColor = sunlight.setTargetPoint(at, true, 5, color);
      expect(
        color.equals(withColor.ellipsoid?.material.getValue().color),
      ).toBeTruthy();
    });
  });

  describe("analyze - single time", () => {
    it("should throw error if the detection ellipsoid has not been set", async () => {
      const from = new Cartesian3(100, 100, 0);
      const at = JulianDate.now();

      await expect(sunlight.analyze(from, at)).rejects.toThrowError();
    });

    it("should perform single time sunlight analysis", async () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      // Set target point first
      sunlight.setTargetPoint(from, false, 3);
      const targetEntityId = sunlight["_pointEntityId"];

      // Mock picking to return an entity with the same ID as the target point
      mockPickFromRay.mockImplementation(() => {
        const mockEntity = new Entity();
        Object.defineProperty(mockEntity, "id", {
          value: targetEntityId,
          writable: false,
          configurable: false,
        });
        return {
          object: { id: mockEntity },
          position: from,
        };
      });

      const result = await sunlight.analyze(from, time);

      expect(result).toEqual({
        timestamp: time.toString(),
        result: true, // Ray hit the target point
      });
      expect(viewer.scene.render).toHaveBeenCalled();
      expect(mockPickFromRay).toHaveBeenCalled();
    });

    it("should return false when ray hits obstruction", async () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      // Set target point first
      sunlight.setTargetPoint(from, false, 3);

      // Mock ray hitting a different object (obstruction)
      const obstructionEntity = new Entity();
      Object.defineProperty(obstructionEntity, "id", {
        value: "building-obstruction",
        writable: false,
        configurable: false,
      });

      mockPickFromRay.mockReturnValue({
        object: { id: obstructionEntity },
        position: new Cartesian3(50, 50, 50),
      });

      const result = await sunlight.analyze(from, time);

      expect(result).toEqual({
        timestamp: time.toString(),
        result: false, // Ray hit obstruction, not target
      });
    });

    it("should track debug rays when debugShowRays enabled", async () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      sunlight.setTargetPoint(from, false, 3);

      await sunlight.analyze(from, time, { debugShowRays: true });

      // Debug ray should be added to _objectsToExclude
      expect(sunlight["_objectsToExclude"].length).toBeGreaterThan(0);
    });

    it("should return false for undefined picked result", async () => {
      mockPickFromRay.mockImplementation(() => {
        return;
      });

      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      sunlight.setTargetPoint(from, false, 3);

      const result = await sunlight.analyze(from, time);
      expect(result.result).toBe(false);
    });
  });

  describe("analyze - time range", () => {
    it("should perform time range analysis", async () => {
      const from = new Cartesian3(100, 100, 0);
      const start = JulianDate.now();
      const end = JulianDate.addSeconds(start, 3600, new JulianDate()); // 1 hour later
      const timeRange: Sunlight.TimeRange = {
        start,
        end,
        step: 1800, // 30 minutes
      };

      sunlight.setTargetPoint(from, false, 3);

      const results = (await sunlight.analyze(
        from,
        timeRange,
      )) as Sunlight.AnalysisResult[];

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3); // 0, 30min, 60min
      expect(results[0].timestamp).toBe(start.toString());
    });
  });

  describe("state management", () => {
    it("should manage analyzing state correctly", async () => {
      expect(sunlight.isAnalyzing).toBe(false);

      const from = new Cartesian3(0, 0, 0);
      sunlight.setTargetPoint(from, false, 3);

      // During analysis, isAnalyzing should be true
      let analyzingDuringCall = false;
      mockPickFromRay.mockImplementation(() => {
        analyzingDuringCall = sunlight.isAnalyzing;
        return { object: new Entity(), position: new Cartesian3() };
      });

      await sunlight.analyze(from, JulianDate.now());

      expect(analyzingDuringCall).toBe(true);
      expect(sunlight.isAnalyzing).toBe(false); // Should be reset after
    });

    it("should restore original time after analysis", async () => {
      const originalTime = JulianDate.now();
      const analysisTime = JulianDate.addHours(
        originalTime,
        6,
        new JulianDate(),
      );

      const from = new Cartesian3(0, 0, 0);
      sunlight.setTargetPoint(from, false, 3);

      viewer.clock.currentTime = originalTime;

      await sunlight.analyze(from, analysisTime);

      // Time should be restored
      expect(viewer.clock.currentTime).toEqual(originalTime);
      expect(viewer.scene.render).toHaveBeenCalledTimes(3); // setTargetPoint, analysis, restore
    });
  });

  describe("object exclusion", () => {
    it("should pass objectsToExclude to picking", async () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();
      const excludeObjects = [new Entity(), new Entity()];

      sunlight.setTargetPoint(from, false, 3);

      await sunlight.analyze(from, time, { objectsToExclude: excludeObjects });

      // Should combine debug entity IDs with objectsToExclude
      expect(mockPickFromRay).toHaveBeenCalledWith(
        expect.any(Ray),
        expect.arrayContaining(excludeObjects),
        0.1,
      );
    });
  });

  describe("cleanup", () => {
    it("should clear debug objects", () => {
      // Add some debug objects
      const obj1 = {};
      const obj2 = {};
      sunlight["_objectsToExclude"] = [obj1, obj2];

      sunlight.clear();

      expect(sunlight["_objectsToExclude"]).toEqual([]);
    });

    it("should clean up polylines and points", () => {
      sunlight.clear();

      // Polylines and points should be empty after clear
      expect(sunlight["_polylines"]?.length).toBe(0);
      expect(sunlight["_points"]?.values.length).toBe(0);
    });
  });

  describe("error boundary", () => {
    it("should use custom error boundary size", () => {
      const from = new Cartesian3(100, 100, 0);
      const customErrorBoundary = 10;

      sunlight.setTargetPoint(from, false, customErrorBoundary);

      // Ellipsoid entity should be created with custom radius
      const addCalls = vi.mocked(viewer.entities.add).mock.calls;
      const targetPointCall = addCalls[addCalls.length - 1];
      const targetEntity = targetPointCall[0] as Entity;
      expect(targetEntity.ellipsoid?.radii?.getValue()).toEqual(
        new Cartesian3(
          customErrorBoundary,
          customErrorBoundary,
          customErrorBoundary,
        ),
      );
    });

    it("should use default error boundary when not specified", () => {
      const from = new Cartesian3(100, 100, 0);

      sunlight.setTargetPoint(from, false);

      // Should use default size of 3
      const addCalls = vi.mocked(viewer.entities.add).mock.calls;
      const targetPointCall = addCalls[addCalls.length - 1];
      const targetEntity = targetPointCall[0] as Entity;
      expect(targetEntity.ellipsoid?.radii?.getValue()).toEqual(
        new Cartesian3(3, 3, 3),
      );
    });
  });
});

describe("Sunlight namespace", () => {
  it("should have expected properties", () => {
    // Test that namespace properties exist
    expect(Sunlight).toBeDefined();
    expect(Sunlight.DETECTION_ELLIPSOID_ID).toBeDefined();
    expect(typeof Sunlight).toBe("function"); // If Sunlight is also a class
  });
});
