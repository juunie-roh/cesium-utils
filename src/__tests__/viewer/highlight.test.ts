import { Color, Entity, GroundPrimitive, Viewer } from 'cesium';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockViewer } from '@/__mocks__/cesium.js';
import { Highlight } from '@/viewer/highlight.js';

describe('Highlight', () => {
  let viewer: Viewer;
  let highlight: Highlight;

  beforeEach(() => {
    viewer = createMockViewer() as unknown as Viewer;
    highlight = Highlight.getInstance(viewer);
  });

  describe('getInstance', () => {
    it('should create new instance from a single viewer only once', () => {
      expect(highlight).toBeDefined();
      expect(highlight.defaultColor).toEqual(Color.YELLOW.withAlpha(0.5));

      expect(Highlight.getInstance(viewer)).toEqual(highlight);
    });

    it('should create new instances each from different viewers', () => {
      expect(Highlight.getInstance(viewer)).not.toEqual(
        Highlight.getInstance(createMockViewer() as unknown as Viewer),
      );
    });
  });

  describe('releaseInstance', () => {
    it('should release the instance associated with a viewer', () => {
      const viewer = createMockViewer() as unknown as Viewer;
      const highlight = Highlight.getInstance(viewer);
      const hideSpy = vi.spyOn(highlight, 'hide');
      const instancesMap = Highlight['instances'];
      expect(instancesMap.has(viewer.container)).toBe(true);
      expect(instancesMap.get(viewer.container)).toBe(highlight);

      Highlight.releaseInstance(viewer);

      expect(hideSpy).toHaveBeenCalledTimes(1);
      expect(instancesMap.has(viewer.container)).toBe(false);

      const newHighlight = Highlight.getInstance(viewer);
      expect(newHighlight).not.toBe(highlight);
      expect(instancesMap.get(viewer.container)).toBe(newHighlight);
    });

    it('should handle releasing non-existent instances', () => {
      const viewer = createMockViewer() as unknown as Viewer;

      expect(() => {
        Highlight.releaseInstance(viewer);
      }).not.toThrow();
    });
  });

  describe('show', () => {
    it('should return undefined if there is no picked object', () => {
      expect(highlight.show(undefined)).toBe(undefined);
    });

    it('should handle different types of picked objects', () => {
      highlight['_update'] = vi.fn();
      const entity = new Entity();
      const objectWithId = { id: new Entity() };
      const objectWithPrimitive = { primitive: new GroundPrimitive() };
      const color = Color.RED;

      highlight.show(entity, color);
      expect(highlight['_update']).toBeCalledWith(entity, color, false);

      highlight.show(objectWithId, color);
      expect(highlight['_update']).toBeCalledWith(
        objectWithId.id,
        color,
        false,
      );

      highlight.show(objectWithPrimitive, color);
      expect(highlight['_update']).toBeCalledWith(
        objectWithPrimitive.primitive,
        color,
        false,
      );
    });

    it('should return the highlight entity when successful', () => {
      // Mock the _update method to do nothing
      highlight['_update'] = vi.fn();
      const mockEntity = new Entity();
      highlight['_highlightEntity'] = mockEntity;

      expect(highlight.show(new Entity())).toBe(mockEntity);
      expect(mockEntity.show).toBe(true);
    });

    it('should return undefined when update fails', () => {
      // Force an error in the _update method
      highlight['_update'] = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(highlight.show(new Entity())).toBeUndefined();
    });
  });

  describe('hide', () => {
    it('should hide the highlight entity', () => {
      // Mock the highlight entity
      const mockEntity = new Entity();
      highlight['_highlightEntity'] = mockEntity;

      highlight.hide();

      expect(mockEntity.show).toBe(false);
    });
  });

  describe('highlightEntity', () => {
    it('should return the highlight entity', () => {
      const mockEntity = new Entity();
      highlight['_highlightEntity'] = mockEntity;

      expect(highlight.highlightEntity).toBe(mockEntity);
    });
  });

  afterAll(() => vi.clearAllMocks());
});
