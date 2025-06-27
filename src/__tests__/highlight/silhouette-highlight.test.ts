import {
  Cesium3DTileFeature,
  Color,
  Entity,
  ModelGraphics,
  PostProcessStageCollection,
  Scene,
  Viewer,
} from 'cesium';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockViewer } from '@/__mocks__/cesium.js';
import { HighlightOptions } from '@/highlight/highlight.types.js';
import SilhouetteHighlight from '@/highlight/silhouette-highlight.js';

describe('Silhouette Highlight', () => {
  let viewer: Viewer;
  let silhouette: SilhouetteHighlight;

  beforeEach(() => {
    viewer = createMockViewer({
      scene: {
        postProcessStages: {
          add: vi.fn().mockImplementation((composite) => composite),
          remove: vi.fn().mockImplementation(() => true),
        } as unknown as PostProcessStageCollection,
      } as unknown as Scene,
    }) as unknown as Viewer;
    silhouette = new SilhouetteHighlight(viewer);
  });

  describe('constructor', () => {
    it('should create new instance from a viewer', () => {
      expect(silhouette).toBeDefined();
      expect(silhouette.color).toEqual(Color.RED);
      expect(silhouette['_silhouette'].uniforms.color).toEqual(Color.RED);
      expect(silhouette['_silhouette'].uniforms.length).toEqual(0.01);
      expect(silhouette['_silhouette'].selected).toHaveLength(0);

      expect(viewer.scene.postProcessStages).toEqual(silhouette['_stages']);
    });
  });

  describe('show', () => {
    describe(' with Cesium3DTileFeature', () => {
      let object: Cesium3DTileFeature;

      beforeEach(() => {
        object = new Cesium3DTileFeature();
      });

      it('should highlight a Cesium3DTileFeature with default color', () => {
        silhouette.show(object);

        expect(silhouette['_silhouette'].selected).toContain(object);
        expect(silhouette['_silhouette'].uniforms.color).toEqual(Color.RED);
      });

      it('should highlight a Cesium3DTileFeature with custom color', () => {
        const customColor = Color.BLUE;
        const options: HighlightOptions = { color: customColor };

        silhouette.show(object, options);

        expect(silhouette['_silhouette'].selected).toContain(object);
        expect(silhouette['_silhouette'].uniforms.color).toEqual(customColor);
      });

      it('should not add the same feature twice', () => {
        // Add the feature first time
        silhouette.show(object);
        expect(silhouette['_silhouette'].selected).toHaveLength(1);

        // Try to add the same feature again
        silhouette.show(object);
        expect(silhouette['_silhouette'].selected).toHaveLength(1);
      });

      it('should handle undefined objects gracefully', () => {
        silhouette.show(undefined as unknown as Cesium3DTileFeature);

        expect(silhouette['_silhouette'].selected).toHaveLength(0);
      });

      it('should allow highlighting multiple different features', () => {
        const feature1 = new Cesium3DTileFeature();
        const feature2 = new Cesium3DTileFeature();

        silhouette.show(feature1);
        silhouette.show(feature2);

        expect(silhouette['_silhouette'].selected).toContain(feature1);
        expect(silhouette['_silhouette'].selected).toContain(feature2);
        expect(silhouette['_silhouette'].selected).toHaveLength(2);
      });

      it('should update color when highlighting with different colors', () => {
        const firstColor = Color.YELLOW;
        const secondColor = Color.GREEN;

        silhouette.show(object, { color: firstColor });
        expect(silhouette['_silhouette'].uniforms.color).toEqual(firstColor);

        const anotherFeature = new Cesium3DTileFeature();
        silhouette.show(anotherFeature, { color: secondColor });
        expect(silhouette['_silhouette'].uniforms.color).toEqual(secondColor);
      });
    });
  });

  // describe('show with Entity', () => {});

  describe('hide', () => {
    describe('with Cesium3DTileFeature', () => {
      it('should remove the highlight', () => {
        const feature1 = new Cesium3DTileFeature();
        const feature2 = new Cesium3DTileFeature();
        silhouette.show(feature1);
        silhouette.show(feature2);

        silhouette.hide();

        expect(silhouette['_silhouette'].selected).toHaveLength(0);
      });
    });

    describe('with Entity', () => {
      it("should restore the entity's property", () => {
        const entity = new Entity({ model: new ModelGraphics() });
        silhouette.show(entity);

        silhouette.hide();

        expect(entity.model?.silhouetteColor).toBeUndefined();
        expect(silhouette['_entity']).toBeUndefined();
      });
    });
  });

  describe('destroy', () => {
    it('should clean up the instances', () => {
      const feature = new Cesium3DTileFeature();
      const entity = new Entity({ model: new ModelGraphics() });

      silhouette.show(feature);
      silhouette.show(entity);

      silhouette.destroy();

      expect(silhouette['_stages'].remove).toBeCalledWith(
        silhouette['_composite'],
      );
      expect(silhouette['_entity']).toBeUndefined();
    });
  });

  describe('color setter', () => {
    it('should change the default color value', () => {
      const color = Color.BLUE;
      silhouette.color = color;
      expect(silhouette.color).toEqual(color);
    });
  });
});
