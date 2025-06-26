import { Color, PostProcessStageCollection, Scene, Viewer } from 'cesium';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockViewer } from '@/__mocks__/cesium.js';
import SilhouetteHighlight from '@/highlight/silhouette-highlight.js';

describe('Silhouette Highlight', () => {
  let viewer: Viewer;
  let silhouette: SilhouetteHighlight;

  beforeEach(() => {
    viewer = createMockViewer({
      scene: {
        postProcessStages: {
          add: vi.fn().mockImplementation((composite) => composite),
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

  // describe('show', () => {});
});
