import {
  Cesium3DTileFeature,
  Color,
  ConstantProperty,
  Entity,
  ModelGraphics,
  PostProcessStageCollection,
  Scene,
  Viewer,
} from "cesium";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockViewer } from "@/__mocks__/cesium.js";
import type { Highlight } from "@/highlight/index.js";
import SilhouetteHighlight from "@/highlight/silhouette-highlight.js";

describe("Silhouette Highlight", () => {
  let viewer: Viewer;
  let highlight: SilhouetteHighlight;

  beforeEach(() => {
    viewer = createMockViewer({
      scene: {
        postProcessStages: {
          add: vi.fn().mockImplementation((composite) => composite),
          remove: vi.fn().mockImplementation(() => true),
        } as unknown as PostProcessStageCollection,
      } as unknown as Scene,
    }) as unknown as Viewer;
    highlight = new SilhouetteHighlight(viewer);
  });

  describe("constructor", () => {
    it("should create new instance from a viewer", () => {
      expect(highlight).toBeDefined();
      expect(highlight.color).toEqual(Color.RED);
      expect(highlight["_silhouette"].uniforms.color).toEqual(Color.RED);
      expect(highlight["_silhouette"].uniforms.length).toEqual(0.01);
      expect(highlight["_silhouette"].selected).toHaveLength(0);

      expect(viewer.scene.postProcessStages).toEqual(highlight["_stages"]);
    });
  });

  describe("show", () => {
    describe(" with Cesium3DTileFeature", () => {
      let object: Cesium3DTileFeature;

      beforeEach(() => {
        object = new Cesium3DTileFeature();
      });

      it("should highlight a Cesium3DTileFeature with default color", () => {
        highlight.show(object);

        expect(highlight["_silhouette"].selected).toContain(object);
        expect(highlight["_silhouette"].uniforms.color).toEqual(Color.RED);
      });

      it("should highlight a Cesium3DTileFeature with custom color", () => {
        const customColor = Color.BLUE;
        const options: Highlight.Options = { color: customColor };

        highlight.show(object, options);

        expect(highlight["_silhouette"].selected).toContain(object);
        expect(highlight["_silhouette"].uniforms.color).toEqual(customColor);
      });

      it("should not add the same feature twice", () => {
        // Add the feature first time
        highlight.show(object);
        expect(highlight["_silhouette"].selected).toHaveLength(1);

        // Try to add the same feature again
        highlight.show(object);
        expect(highlight["_silhouette"].selected).toHaveLength(1);
      });

      it("should handle undefined objects gracefully", () => {
        highlight.show(undefined as unknown as Cesium3DTileFeature);

        expect(highlight["_silhouette"].selected).toHaveLength(0);
      });

      it("should update color when highlighting with different colors", () => {
        const firstColor = Color.YELLOW;
        const secondColor = Color.GREEN;

        highlight.show(object, { color: firstColor });
        expect(highlight["_silhouette"].uniforms.color).toEqual(firstColor);

        const anotherFeature = new Cesium3DTileFeature();
        highlight.show(anotherFeature, { color: secondColor });
        expect(highlight["_silhouette"].uniforms.color).toEqual(secondColor);
      });
    });
  });

  describe("show with Entity", () => {
    const e = new Entity({ model: new ModelGraphics() });

    it("should return undefined with Entity whose model is not defined", () => {
      const t = new Entity();
      expect(highlight.show(t)).toBe(undefined);
    });

    it("should highlight an entity with default color", () => {
      highlight.show(e);
      expect(highlight["_entity"]).toEqual(e);
      expect(e.model?.silhouetteColor?.getValue()).toEqual(highlight.color);
      expect(e.model?.silhouetteSize?.getValue()).toEqual(2);
    });

    it("should highlight an entity with custom options", () => {
      const color = Color.BLUE;
      const width = 10;
      highlight.show(e, { color, width });
      expect(e.model?.silhouetteColor?.getValue()).toEqual(color);
      expect(e.model?.silhouetteSize?.getValue()).toEqual(width);
    });
  });

  describe("hide", () => {
    describe("with Cesium3DTileFeature", () => {
      it("should remove the highlight", () => {
        const feature1 = new Cesium3DTileFeature();
        const feature2 = new Cesium3DTileFeature();
        highlight.show(feature1);
        highlight.show(feature2);

        highlight.hide();

        expect(highlight["_silhouette"].selected).toHaveLength(0);
      });
    });

    describe("with Entity", () => {
      it("should restore the entity's property", () => {
        const entity = new Entity({ model: new ModelGraphics() });
        highlight.show(entity);

        highlight.hide();

        expect(entity.model?.silhouetteColor?.getValue()).toEqual(
          Color.TRANSPARENT,
        );
        expect(entity.model?.silhouetteSize?.getValue()).toEqual(0.0);
        expect(highlight["_entity"]).toBeUndefined();
      });
    });
  });

  describe("destroy", () => {
    it("should clean up the instances", () => {
      const feature = new Cesium3DTileFeature();
      const entity = new Entity({ model: new ModelGraphics() });

      highlight.show(feature);
      highlight.show(entity);

      highlight.destroy();

      expect(highlight["_stages"].remove).toBeCalledWith(
        highlight["_composite"],
      );
      expect(highlight["_entity"]).toBeUndefined();
    });
  });

  describe("color setter", () => {
    it("should change the default color value", () => {
      const color = Color.BLUE;
      highlight.color = color;
      expect(highlight.color).toEqual(color);
    });
  });

  describe("show method early returns", () => {
    it("should return early for undefined objects", () => {
      const clearSpy = vi.spyOn(highlight as any, "_clearHighlights");

      highlight.show(undefined as unknown as Cesium3DTileFeature);

      expect(clearSpy).not.toHaveBeenCalled();
      expect(highlight.currentObject).toBeUndefined();
    });

    it("should return early for entities without model property", () => {
      const entityWithoutModel = new Entity({ id: "no-model" });
      const clearSpy = vi.spyOn(highlight as any, "_clearHighlights");

      highlight.show(entityWithoutModel);

      expect(clearSpy).toHaveBeenCalledTimes(1); // Clear is called but then early return
      expect(highlight["_entity"]).toBeUndefined();
      expect(highlight.currentObject).toBeUndefined();
    });

    it("should return early when showing same object with same options", () => {
      const feature = new Cesium3DTileFeature();
      const options = { color: Color.BLUE };

      // First call - should proceed normally
      highlight.show(feature, options);
      expect(highlight.currentObject).toBe(feature);

      const clearSpy = vi.spyOn(highlight as any, "_clearHighlights");

      // Second call with same object and options - should return early
      highlight.show(feature, options);

      expect(clearSpy).not.toHaveBeenCalled();
      expect(highlight.currentObject).toBe(feature);
    });
  });

  describe("_clearHighlights method", () => {
    it("should clear silhouette selection when features are present", () => {
      const feature1 = new Cesium3DTileFeature();
      const feature2 = new Cesium3DTileFeature();

      // Add features to selection
      highlight["_silhouette"].selected.push(feature1, feature2);
      expect(highlight["_silhouette"].selected).toHaveLength(2);

      highlight["_clearHighlights"]();

      expect(highlight["_silhouette"].selected).toHaveLength(0);
    });

    it("should not error when clearing empty silhouette selection", () => {
      expect(highlight["_silhouette"].selected).toHaveLength(0);

      expect(() => {
        highlight["_clearHighlights"]();
      }).not.toThrow();

      expect(highlight["_silhouette"].selected).toHaveLength(0);
    });

    it("should clear entity model highlight when entity is present", () => {
      const entity = new Entity({ model: new ModelGraphics() });
      highlight["_entity"] = entity;

      // Set some highlight properties
      entity.model!.silhouetteColor = new ConstantProperty(Color.RED);
      entity.model!.silhouetteSize = new ConstantProperty(5);

      highlight["_clearHighlights"]();

      expect(entity.model?.silhouetteColor?.getValue()).toEqual(
        Color.TRANSPARENT,
      );
      expect(entity.model?.silhouetteSize?.getValue()).toEqual(0.0);
      expect(highlight["_entity"]).toBeUndefined();
    });

    it("should clear both silhouette and entity highlights simultaneously", () => {
      const feature = new Cesium3DTileFeature();
      const entity = new Entity({ model: new ModelGraphics() });

      // Set up both types of highlights
      highlight["_silhouette"].selected.push(feature);
      highlight["_entity"] = entity;
      entity.model!.silhouetteColor = new ConstantProperty(Color.BLUE);

      highlight["_clearHighlights"]();

      expect(highlight["_silhouette"].selected).toHaveLength(0);
      expect(entity.model!.silhouetteColor?.getValue()).toEqual(
        Color.TRANSPARENT,
      );
      expect(highlight["_entity"]).toBeUndefined();
    });
  });

  describe("_optionsEqual method", () => {
    it("should return true when both options are undefined", () => {
      const result = highlight["_optionsEqual"](undefined, undefined);
      expect(result).toBe(true);
    });

    it("should return false when one option is undefined", () => {
      const options = { color: Color.RED };

      expect(highlight["_optionsEqual"](options, undefined)).toBe(false);
      expect(highlight["_optionsEqual"](undefined, options)).toBe(false);
    });

    it("should compare outline property correctly", () => {
      const options1 = { outline: true };
      const options2 = { outline: true };
      const options3 = { outline: false };

      expect(highlight["_optionsEqual"](options1, options2)).toBe(true);
      expect(highlight["_optionsEqual"](options1, options3)).toBe(false);
    });

    it("should compare width property correctly", () => {
      const options1 = { width: 5 };
      const options2 = { width: 5 };
      const options3 = { width: 3 };

      expect(highlight["_optionsEqual"](options1, options2)).toBe(true);
      expect(highlight["_optionsEqual"](options1, options3)).toBe(false);
    });

    it("should compare color property correctly", () => {
      const options1 = { color: Color.RED };
      const options2 = { color: Color.RED };
      const options3 = { color: Color.BLUE };

      expect(highlight["_optionsEqual"](options1, options2)).toBe(true);
      expect(highlight["_optionsEqual"](options1, options3)).toBe(false);
    });

    it("should use default color when color is undefined", () => {
      highlight.color = Color.GREEN;

      const options1 = { width: 2 };
      const options2 = { color: Color.GREEN, width: 2 };

      expect(highlight["_optionsEqual"](options1, options2)).toBe(true);
    });

    it("should handle complex option combinations", () => {
      const options1 = { color: Color.RED, outline: true, width: 3 };
      const options2 = { color: Color.RED, outline: true, width: 3 };
      const options3 = { color: Color.RED, outline: true, width: 5 };
      const options4 = { color: Color.BLUE, outline: true, width: 3 };

      expect(highlight["_optionsEqual"](options1, options2)).toBe(true);
      expect(highlight["_optionsEqual"](options1, options3)).toBe(false);
      expect(highlight["_optionsEqual"](options1, options4)).toBe(false);
    });

    it("should handle missing properties as undefined", () => {
      const options1 = { color: Color.RED };
      const options2 = {
        color: Color.RED,
        outline: undefined,
        width: undefined,
      };

      expect(highlight["_optionsEqual"](options1, options2)).toBe(true);
    });
  });

  describe("error handling and recovery", () => {
    it("should reset tracking variables on error in Cesium3DTileFeature path", () => {
      const feature = new Cesium3DTileFeature();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock to throw error when setting uniforms
      Object.defineProperty(highlight["_silhouette"].uniforms, "color", {
        set: () => {
          throw new Error("Uniform setting failed");
        },
        configurable: true,
      });

      highlight.show(feature, { color: Color.RED });

      expect(highlight.currentObject).toBeUndefined();
      expect(highlight["_currentOptions"]).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to highlight object:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it("should reset tracking variables on error in Entity path", () => {
      const entity = new Entity({ model: new ModelGraphics() });
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock to throw error when setting silhouette properties
      Object.defineProperty(entity.model, "silhouetteSize", {
        set: () => {
          throw new Error("Property setting failed");
        },
        configurable: true,
      });

      highlight.show(entity, { width: 5 });

      expect(highlight.currentObject).toBeUndefined();
      expect(highlight["_currentOptions"]).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to highlight object:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("options storage and retrieval", () => {
    it("should store undefined options as undefined", () => {
      const feature = new Cesium3DTileFeature();

      highlight.show(feature);

      expect(highlight["_currentOptions"]).toBeUndefined();
    });

    it("should store options as a copy", () => {
      const feature = new Cesium3DTileFeature();
      const originalOptions = { color: Color.RED, width: 3 };

      highlight.show(feature, originalOptions);

      const storedOptions = highlight["_currentOptions"];
      expect(storedOptions).not.toBe(originalOptions); // Different object
      expect(storedOptions).toEqual(originalOptions); // Same values
    });

    it("should not mutate original options object", () => {
      const feature = new Cesium3DTileFeature();
      const originalOptions = { color: Color.RED, width: 3 };
      const optionsCopy = { ...originalOptions };

      highlight.show(feature, originalOptions);

      expect(originalOptions).toEqual(optionsCopy);
    });
  });

  describe("updated hide method", () => {
    it("should clear tracking variables in addition to highlights", () => {
      const feature = new Cesium3DTileFeature();

      highlight.show(feature, { color: Color.BLUE });
      expect(highlight.currentObject).toBe(feature);
      expect(highlight["_currentOptions"]).toBeDefined();

      const clearSpy = vi.spyOn(highlight as any, "_clearHighlights");

      highlight.hide();

      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(highlight.currentObject).toBeUndefined();
      expect(highlight["_currentOptions"]).toBeUndefined();
    });

    it("should be safe to call multiple times", () => {
      const feature = new Cesium3DTileFeature();

      highlight.show(feature);

      expect(() => {
        highlight.hide();
        highlight.hide();
        highlight.hide();
      }).not.toThrow();

      expect(highlight.currentObject).toBeUndefined();
    });
  });

  describe("updated destroy method", () => {
    it("should call hide method first", () => {
      const feature = new Cesium3DTileFeature();
      highlight.show(feature);

      const hideSpy = vi.spyOn(highlight, "hide");

      highlight.destroy();

      expect(hideSpy).toHaveBeenCalledTimes(1);
    });

    it("should ensure tracking variables are cleared after hide", () => {
      const feature = new Cesium3DTileFeature();
      highlight.show(feature);

      highlight.destroy();

      expect(highlight.currentObject).toBeUndefined();
      expect(highlight["_currentOptions"]).toBeUndefined();
    });

    it("should remove composite stage and clear tracking", () => {
      const feature = new Cesium3DTileFeature();
      highlight.show(feature);

      expect(highlight.currentObject).toBe(feature);

      highlight.destroy();

      expect(highlight["_stages"].remove).toHaveBeenCalledWith(
        highlight["_composite"],
      );
      expect(highlight.currentObject).toBeUndefined();
      expect(highlight["_currentOptions"]).toBeUndefined();
    });
  });

  describe("currentObject getter", () => {
    it("should return the currently highlighted object", () => {
      const feature = new Cesium3DTileFeature();
      const entity = new Entity({ model: new ModelGraphics() });

      expect(highlight.currentObject).toBeUndefined();

      highlight.show(feature);
      expect(highlight.currentObject).toBe(feature);

      highlight.show(entity);
      expect(highlight.currentObject).toBe(entity);

      highlight.hide();
      expect(highlight.currentObject).toBeUndefined();
    });
  });
});
