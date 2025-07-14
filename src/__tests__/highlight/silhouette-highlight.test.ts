import {
  Cesium3DTileFeature,
  Color,
  Entity,
  ModelGraphics,
  PostProcessStageCollection,
  Scene,
  Viewer,
} from "cesium";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockViewer } from "@/__mocks__/cesium.js";
import { HighlightOptions } from "@/highlight/highlight.types.js";
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
        const options: HighlightOptions = { color: customColor };

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
});
