import {
  Cartesian3,
  Clock,
  Entity,
  EntityCollection,
  JulianDate,
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
  let mockPicking: any;

  beforeEach(() => {
    // Mock picking functionality
    mockPicking = {
      pickFromRay: vi.fn().mockReturnValue({
        object: null,
        position: new Cartesian3(100, 100, 100),
      }),
    };

    viewer = createMockViewer({
      container: document.createElement("div"),
      scene: createMockScene({
        // @ts-expect-error
        context: {
          uniformState: {
            sunPositionWC: new Cartesian3(1000, 1000, 1000),
            sunDirectionWC: new Cartesian3(0.5, 0.5, 0.7),
          },
        },
        picking: mockPicking,
        render: vi.fn(),
      }) as unknown as Scene,
      clock: {
        currentTime: JulianDate.now(),
      } as unknown as Clock,
      entities: {
        add: vi.fn().mockImplementation((entity) => {
          entity.id = `mock-entity-${Math.random()}`;
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
      const virtualSun = sunlight.getVirtualSunPosition(from, 500);

      // Should be 500 units away in the direction of the sun
      const distance = Cartesian3.distance(from, virtualSun);
      expect(distance).toBeCloseTo(500, 1);
    });

    it("should use default radius of 1000 when not specified", () => {
      const from = new Cartesian3(0, 0, 0);
      const virtualSun = sunlight.getVirtualSunPosition(from);

      const distance = Cartesian3.distance(from, virtualSun);
      expect(distance).toBeCloseTo(1000, 1);
    });
  });

  describe("analyze - single time", () => {
    it("should perform single time sunlight analysis", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();
      let targetEntityId: string;

      // Mock the point entity creation to capture its ID
      vi.spyOn(viewer.entities, "add").mockImplementation((entity: any) => {
        targetEntityId = entity.id;
        return entity;
      });

      // Mock picking to return an entity with the same ID as the target point
      mockPicking.pickFromRay.mockImplementation(() => {
        const mockEntity = new Entity();
        Object.defineProperty(mockEntity, "id", {
          value: targetEntityId,
          writable: false,
          configurable: false,
        });
        return {
          object: mockEntity,
          position: from,
        };
      });

      const result = sunlight.analyze(from, time);

      expect(result).toEqual({
        timestamp: time.toString(),
        result: true, // Ray hit the target point
      });
      expect(viewer.scene.render).toHaveBeenCalled();
      expect(mockPicking.pickFromRay).toHaveBeenCalled();
    });

    it("should return false when ray hits obstruction", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      // Mock ray hitting a different object (obstruction)
      const obstructionEntity = new Entity();
      Object.defineProperty(obstructionEntity, "id", {
        value: "building-obstruction",
        writable: false,
        configurable: false,
      });

      mockPicking.pickFromRay.mockReturnValue({
        object: obstructionEntity,
        position: new Cartesian3(50, 50, 50),
      });

      const result = sunlight.analyze(from, time);

      expect(result).toEqual({
        timestamp: time.toString(),
        result: false, // Ray hit obstruction, not target
      });
    });

    it("should create debug collision point when debugShowPoints enabled", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();
      const collisionPos = new Cartesian3(75, 75, 25);

      mockPicking.pickFromRay.mockReturnValue({
        object: new Entity(),
        position: collisionPos,
      });

      sunlight.analyze(from, time, { debugShowPoints: true });

      // Should add debug entity to viewer (second call after target point)
      const addCalls = vi.mocked(viewer.entities.add).mock.calls;
      expect(addCalls.length).toBe(2); // Target point + debug entity

      const debugEntity = addCalls[1][0] as Entity;
      expect(debugEntity.point?.show?.getValue()).toBe(true);
      expect(debugEntity.point?.pixelSize?.getValue()).toBe(5);
    });

    it("should create debug ray polyline when debugShowRays enabled", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      sunlight.analyze(from, time, { debugShowRays: true });

      // Should add debug polyline entity (second call after target point)
      const addCalls = vi.mocked(viewer.entities.add).mock.calls;
      expect(addCalls.length).toBe(2); // Target point + debug polyline

      const debugEntity = addCalls[1][0] as Entity;
      expect(debugEntity.polyline).toBeDefined();
      expect(debugEntity.polyline?.width?.getValue()).toBe(10);
      expect(
        debugEntity.polyline?.material?.getValue().color.alpha,
      ).toBeCloseTo(0.5);
    });
  });

  describe("analyze - time range", () => {
    it("should perform time range analysis", () => {
      const from = new Cartesian3(100, 100, 0);
      const start = JulianDate.now();
      const end = JulianDate.addSeconds(start, 3600, new JulianDate()); // 1 hour later
      const timeRange: Sunlight.TimeRange = {
        start,
        end,
        step: 1800, // 30 minutes
      };

      const results = sunlight.analyze(
        from,
        timeRange,
      ) as Sunlight.AnalysisResult[];

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(3); // 0, 30min, 60min
      expect(results[0].timestamp).toBe(start.toString());
    });
  });

  describe("state management", () => {
    it("should manage analyzing state correctly", () => {
      expect(sunlight.isAnalyzing).toBe(false);

      // During analysis, isAnalyzing should be true
      let analyzingDuringCall = false;
      mockPicking.pickFromRay.mockImplementation(() => {
        analyzingDuringCall = sunlight.isAnalyzing;
        return { object: new Entity(), position: new Cartesian3() };
      });

      sunlight.analyze(new Cartesian3(0, 0, 0), JulianDate.now());

      expect(analyzingDuringCall).toBe(true);
      expect(sunlight.isAnalyzing).toBe(false); // Should be reset after
    });

    it("should restore original time after analysis", () => {
      const originalTime = JulianDate.now();
      const analysisTime = JulianDate.addHours(
        originalTime,
        6,
        new JulianDate(),
      );

      viewer.clock.currentTime = originalTime;

      sunlight.analyze(new Cartesian3(0, 0, 0), analysisTime);

      // Time should be restored
      expect(viewer.clock.currentTime).toEqual(originalTime);
      expect(viewer.scene.render).toHaveBeenCalledTimes(2); // Once for analysis, once for restore
    });
  });

  describe("object exclusion", () => {
    it("should pass objectsToExclude to picking", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();
      const excludeObjects = [new Entity(), new Entity()];

      sunlight.analyze(from, time, { objectsToExclude: excludeObjects });

      // Should combine debug entity IDs with objectsToExclude
      expect(mockPicking.pickFromRay).toHaveBeenCalledWith(
        mockPicking,
        viewer.scene,
        expect.any(Ray),
        expect.arrayContaining(excludeObjects),
      );
    });
  });

  describe("cleanup", () => {
    it("should clear debug entities", () => {
      // Add some debug entity IDs
      const debugId1 = "debug-entity-1";
      const debugId2 = "debug-entity-2";
      sunlight["_debugEntityIds"] = [debugId1, debugId2];

      sunlight.clear();

      expect(viewer.entities.removeById).toHaveBeenCalledWith(debugId1);
      expect(viewer.entities.removeById).toHaveBeenCalledWith(debugId2);
      expect(sunlight["_debugEntityIds"]).toEqual([]);
    });

    it("should clean up point entity", () => {
      const pointEntityId = "test-point-entity";
      sunlight["_pointEntityId"] = pointEntityId;

      vi.spyOn(viewer.entities, "getById").mockReturnValue(new Entity());

      sunlight.clear();

      expect(viewer.entities.removeById).toHaveBeenCalledWith(pointEntityId);
    });
  });

  describe("error boundary", () => {
    it("should use custom error boundary size", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();
      const customErrorBoundary = 10;

      sunlight.analyze(from, time, { errorBoundary: customErrorBoundary });

      // Point entity should be created with custom pixel size
      const addCalls = vi.mocked(viewer.entities.add).mock.calls;
      const targetPointCall = addCalls[0];
      const targetEntity = targetPointCall[0] as Entity;
      expect(targetEntity.point?.pixelSize?.getValue()).toBe(
        customErrorBoundary,
      );
    });

    it("should use default error boundary when not specified", () => {
      const from = new Cartesian3(100, 100, 0);
      const time = JulianDate.now();

      sunlight.analyze(from, time);

      // Should use default size of 5
      const addCalls = vi.mocked(viewer.entities.add).mock.calls;
      const targetPointCall = addCalls[0];
      const targetEntity = targetPointCall[0] as Entity;
      expect(targetEntity.point?.pixelSize?.getValue()).toBe(5);
    });
  });
});
