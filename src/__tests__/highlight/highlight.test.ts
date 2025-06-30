import {
  Cesium3DTileFeature,
  Color,
  Entity,
  GroundPrimitive,
  ModelGraphics,
  PostProcessStageCollection,
  Scene,
  Viewer,
} from "cesium";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockScene, createMockViewer } from "@/__mocks__/cesium.js";
import Highlight from "@/highlight/highlight.js";
import type { Picked } from "@/highlight/highlight.types.js";

describe("Highlight", () => {
  let viewer: Viewer;
  let viewer2: Viewer;
  let highlight: Highlight;

  beforeEach(() => {
    viewer = createMockViewer({
      container: document.createElement("div"),
      scene: createMockScene({
        postProcessStages: {
          add: vi.fn(),
          remove: vi.fn(),
        } as unknown as PostProcessStageCollection,
      }) as unknown as Scene,
    }) as unknown as Viewer;

    viewer2 = createMockViewer({
      container: document.createElement("div"),
      scene: createMockScene({
        postProcessStages: {
          add: vi.fn(),
          remove: vi.fn(),
        } as unknown as PostProcessStageCollection,
      }) as unknown as Scene,
    }) as unknown as Viewer;

    highlight = Highlight.getInstance(viewer);
  });

  afterEach(() => {
    // Clean up all instances
    Highlight.releaseInstance(viewer);
    Highlight.releaseInstance(viewer2);
  });

  describe("getInstance", () => {
    it("should create a new instance per viewer container", () => {
      expect(highlight).toBeDefined();

      const highlight2 = Highlight.getInstance(viewer2);

      expect(highlight2).not.toBe(highlight);
      expect(Highlight.getInstance(viewer)).toBe(highlight);
      expect(Highlight.getInstance(viewer2)).toBe(highlight2);
    });

    it("should return the same instance for the same viewer", () => {
      const highlight1 = Highlight.getInstance(viewer);
      const highlight2 = Highlight.getInstance(viewer);

      expect(highlight1).toBe(highlight2);
    });

    it("should handle multiple viewers correctly", () => {
      const viewer3 = createMockViewer({
        container: document.createElement("div"),
        scene: createMockScene({
          postProcessStages: {
            add: vi.fn(),
            remove: vi.fn(),
          } as unknown as PostProcessStageCollection,
        }) as unknown as Scene,
      }) as unknown as Viewer;

      const highlight1 = Highlight.getInstance(viewer);
      const highlight2 = Highlight.getInstance(viewer2);
      const highlight3 = Highlight.getInstance(viewer3);

      expect(highlight1).not.toBe(highlight2);
      expect(highlight2).not.toBe(highlight3);
      expect(highlight1).not.toBe(highlight3);

      // Clean up
      Highlight.releaseInstance(viewer3);
    });
  });

  describe("releaseInstance", () => {
    it("should clean up and remove instance", () => {
      // Verify instance exists
      expect(Highlight.getInstance(viewer)).toBe(highlight);

      // Mock the internal components to verify cleanup
      const hideSpy = vi.spyOn(highlight, "hide");
      const surfaceDestroySpy = vi.spyOn(highlight["_surface"], "destroy");
      const silhouetteDestroySpy = vi.spyOn(
        highlight["_silhouette"],
        "destroy",
      );

      Highlight.releaseInstance(viewer);

      expect(hideSpy).toHaveBeenCalled();
      expect(surfaceDestroySpy).toHaveBeenCalled();
      expect(silhouetteDestroySpy).toHaveBeenCalled();

      // Verify new instance is created after release
      const newHighlight = Highlight.getInstance(viewer);
      expect(newHighlight).not.toBe(highlight);
    });

    it("should handle releasing non-existent instances gracefully", () => {
      const mockViewer = createMockViewer({
        container: document.createElement("div"),
      }) as unknown as Viewer;

      // Should not throw when releasing an instance that doesn't exist
      expect(() => {
        Highlight.releaseInstance(mockViewer);
      }).not.toThrow();
    });
  });

  describe("show", () => {
    let mockEntity: Entity;
    let mockGroundPrimitive: GroundPrimitive;
    let mockModelGraphics: ModelGraphics;
    let mockCesium3DTileFeature: Cesium3DTileFeature;

    beforeEach(() => {
      mockEntity = new Entity();
      mockGroundPrimitive = new GroundPrimitive();
      mockModelGraphics = new ModelGraphics();
      mockCesium3DTileFeature = new Cesium3DTileFeature();
    });

    it("should route Entity to surface highlight", () => {
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");
      const color = Color.BLUE;

      highlight.show(mockEntity, { color });

      expect(surfaceShowSpy).toHaveBeenCalledWith(mockEntity, { color });
    });

    it("should route GroundPrimitive to surface highlight", () => {
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");
      const color = Color.GREEN;

      highlight.show(mockGroundPrimitive, { color });

      expect(surfaceShowSpy).toHaveBeenCalledWith(mockGroundPrimitive, {
        color,
      });
    });

    it("should route Cesium3DTileFeature to silhouette highlight", () => {
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");
      const color = Color.YELLOW;

      highlight.show(mockCesium3DTileFeature, { color });

      expect(silhouetteShowSpy).toHaveBeenCalledWith(mockCesium3DTileFeature, {
        color,
      });
    });

    it("should route ModelGraphics to silhouette highlight", () => {
      const e = new Entity({ model: mockModelGraphics });
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");
      const color = Color.ORANGE;

      highlight.show(e, { color });

      expect(silhouetteShowSpy).toHaveBeenCalledWith(e, {
        color,
      });
    });

    it("should handle entity with model property", () => {
      const entityWithModel = new Entity({
        model: mockModelGraphics,
      });
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");

      highlight.show(entityWithModel);

      expect(silhouetteShowSpy).toHaveBeenCalledWith(entityWithModel, {
        color: highlight.color,
      });
    });

    it("should handle picked object with id property", () => {
      const pickedObject = {
        id: mockEntity,
      } as Picked;
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");

      highlight.show(pickedObject);

      expect(surfaceShowSpy).toHaveBeenCalledWith(mockEntity, {
        color: highlight.color,
      });
    });

    it("should handle picked object with id.model property", () => {
      const entityWithModel = new Entity({
        model: mockModelGraphics,
      });
      const pickedObject = {
        id: entityWithModel,
      } as Picked;
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");

      highlight.show(pickedObject);

      expect(silhouetteShowSpy).toHaveBeenCalledWith(entityWithModel, {
        color: highlight.color,
      });
    });

    it("should handle picked object with primitive property", () => {
      const pickedObject = {
        primitive: mockGroundPrimitive,
      } as Picked;
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");

      highlight.show(pickedObject);

      expect(surfaceShowSpy).toHaveBeenCalledWith(mockGroundPrimitive, {
        color: highlight.color,
      });
    });

    it("should use default color when none provided", () => {
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");

      highlight.show(mockEntity);

      expect(surfaceShowSpy).toHaveBeenCalledWith(mockEntity, {
        color: highlight.color,
      });
    });

    it("should pass options correctly", () => {
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");
      const options = { color: Color.RED, outline: true, width: 3 };

      highlight.show(mockEntity, options);

      expect(surfaceShowSpy).toHaveBeenCalledWith(mockEntity, options);
    });

    it("should handle undefined picked objects gracefully", () => {
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");

      highlight.show(undefined as unknown as Picked);

      expect(surfaceShowSpy).not.toHaveBeenCalled();
      expect(silhouetteShowSpy).not.toHaveBeenCalled();
    });

    it("should handle empty picked objects gracefully", () => {
      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");
      const emptyPicked = {} as Picked;

      highlight.show(emptyPicked);

      expect(surfaceShowSpy).not.toHaveBeenCalled();
      expect(silhouetteShowSpy).not.toHaveBeenCalled();
    });
  });

  describe("hide", () => {
    it("should hide both surface and silhouette highlights", () => {
      const surfaceHideSpy = vi.spyOn(highlight["_surface"], "hide");
      const silhouetteHideSpy = vi.spyOn(highlight["_silhouette"], "hide");

      highlight.hide();

      expect(surfaceHideSpy).toHaveBeenCalled();
      expect(silhouetteHideSpy).toHaveBeenCalled();
    });
  });

  describe("color property", () => {
    it("should get and set color correctly", () => {
      const newColor = Color.PURPLE;

      expect(highlight.color).toEqual(Color.RED); // Default color

      highlight.color = newColor;

      expect(highlight.color).toEqual(newColor);
    });

    it("should propagate color changes to both highlight types", () => {
      const newColor = Color.CYAN;

      highlight.color = newColor;

      expect(highlight["_surface"].color).toEqual(newColor);
      expect(highlight["_silhouette"].color).toEqual(newColor);
    });
  });

  describe("_getObject private method", () => {
    it("should extract objects from various picked formats correctly", () => {
      const entity = new Entity();
      const entityWithModel = new Entity({ model: new ModelGraphics() });
      const groundPrimitive = new GroundPrimitive();
      const cesium3DTileFeature = new Cesium3DTileFeature();

      // Test direct entity
      expect(highlight["_getObject"](entity)).toBe(entity);

      // // Test entity with model
      expect(highlight["_getObject"](entityWithModel)).toBe(entityWithModel);

      // Test direct Cesium3DTileFeature
      expect(highlight["_getObject"](cesium3DTileFeature)).toBe(
        cesium3DTileFeature,
      );

      // Test direct GroundPrimitive
      expect(highlight["_getObject"](groundPrimitive)).toBe(groundPrimitive);

      // Test picked object with id
      expect(highlight["_getObject"]({ id: entity })).toBe(entity);

      // Test picked object with id.model
      expect(highlight["_getObject"]({ id: entityWithModel })).toBe(
        entityWithModel,
      );

      // Test picked object with primitive
      expect(highlight["_getObject"]({ primitive: groundPrimitive })).toBe(
        groundPrimitive,
      );

      // Test undefined
      expect(
        highlight["_getObject"](undefined as unknown as Picked),
      ).toBeUndefined();
    });
  });

  describe("memory management", () => {
    it("should properly clean up when multiple instances are created and released", () => {
      const containers = [
        document.createElement("div"),
        document.createElement("div"),
        document.createElement("div"),
      ];

      const viewers = containers.map(
        (container) =>
          createMockViewer({
            container,
            scene: createMockScene({
              postProcessStages: {
                add: vi.fn(),
                remove: vi.fn(),
              } as unknown as PostProcessStageCollection,
            }) as unknown as Scene,
          }) as unknown as Viewer,
      );

      // Create highlights
      const highlights = viewers.map((v) => Highlight.getInstance(v));

      // Verify all are unique
      expect(highlights[0]).not.toBe(highlights[1]);
      expect(highlights[1]).not.toBe(highlights[2]);
      expect(highlights[0]).not.toBe(highlights[2]);

      // Release all
      viewers.forEach((v) => Highlight.releaseInstance(v));

      // Create new instances - should be different from before
      const newHighlights = viewers.map((v) => Highlight.getInstance(v));

      newHighlights.forEach((newHighlight, index) => {
        expect(newHighlight).not.toBe(highlights[index]);
      });

      // Clean up
      viewers.forEach((v) => Highlight.releaseInstance(v));
    });

    it("should handle viewer destruction gracefully", () => {
      const container = document.createElement("div");
      const testViewer = createMockViewer({
        container,
        scene: createMockScene({
          postProcessStages: {
            add: vi.fn(),
            remove: vi.fn(),
          } as unknown as PostProcessStageCollection,
        }) as unknown as Scene,
      }) as unknown as Viewer;

      const testHighlight = Highlight.getInstance(testViewer);
      expect(testHighlight).toBeDefined();

      // Simulate viewer destruction
      Highlight.releaseInstance(testViewer);

      // Should be able to create a new instance with the same container
      const newTestViewer = createMockViewer({
        container, // Same container
        scene: createMockScene({
          postProcessStages: {
            add: vi.fn(),
            remove: vi.fn(),
          } as unknown as PostProcessStageCollection,
        }) as unknown as Scene,
      }) as unknown as Viewer;

      const newHighlight = Highlight.getInstance(newTestViewer);
      expect(newHighlight).not.toBe(testHighlight);

      // Clean up
      Highlight.releaseInstance(newTestViewer);
    });
  });

  describe("integration scenarios", () => {
    it("should handle rapid show/hide cycles", () => {
      const entity = new Entity();
      const showSpy = vi.spyOn(highlight["_surface"], "show");
      const hideSpy = vi.spyOn(highlight["_surface"], "hide");

      // Rapid show/hide cycle
      for (let i = 0; i < 10; i++) {
        highlight.show(entity, { color: Color.RED });
        highlight.hide();
      }

      expect(showSpy).toHaveBeenCalledTimes(10);
      // expect(hideSpy).toHaveBeenCalledTimes(10);
    });

    it("should handle switching between different object types", () => {
      const entity = new Entity();
      const cesium3DTileFeature = {} as Cesium3DTileFeature;

      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");
      const silhouetteShowSpy = vi.spyOn(highlight["_silhouette"], "show");

      // Switch between surface and 3D objects
      highlight.show(entity, { color: Color.RED });
      highlight.show(cesium3DTileFeature, { color: Color.BLUE });
      highlight.show(entity, { color: Color.GREEN });

      expect(surfaceShowSpy).toHaveBeenCalledTimes(2);
      // expect(silhouetteShowSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle color changes between highlights", () => {
      const entity1 = new Entity();
      const entity2 = new Entity();

      const surfaceShowSpy = vi.spyOn(highlight["_surface"], "show");

      highlight.show(entity1, { color: Color.RED });
      highlight.color = Color.BLUE; // Change default color
      highlight.show(entity2); // Should use new default color

      expect(surfaceShowSpy).toHaveBeenNthCalledWith(1, entity1, {
        color: Color.RED,
      });
      expect(surfaceShowSpy).toHaveBeenNthCalledWith(2, entity2, {
        color: Color.BLUE,
      });
    });
  });

  describe("error handling", () => {
    // it('should handle errors from surface highlight gracefully', () => {
    //   const entity = new Entity();
    //   const consoleSpy = vi
    //     .spyOn(console, 'error')
    //     .mockImplementation(() => {});

    //   // Mock surface highlight to throw error
    //   vi.spyOn(highlight['_surface'], 'show').mockImplementation(() => {
    //     throw new Error('Surface highlight error');
    //   });

    //   // Should not throw, but may log error depending on implementation
    //   expect(() => {
    //     highlight.show(entity);
    //   }).not.toThrow();

    //   // Clean up
    //   consoleSpy.mockRestore();
    // });

    it("should handle errors from silhouette highlight gracefully", () => {
      const cesium3DTileFeature = {} as Cesium3DTileFeature;
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock silhouette highlight to throw error
      vi.spyOn(highlight["_silhouette"], "show").mockImplementation(() => {
        throw new Error("Silhouette highlight error");
      });

      // Should not throw, but may log error depending on implementation
      expect(() => {
        highlight.show(cesium3DTileFeature);
      }).not.toThrow();

      // Clean up
      consoleSpy.mockRestore();
    });
  });
});
