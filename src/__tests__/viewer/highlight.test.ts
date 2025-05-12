import { Color, Entity, GroundPrimitive, Viewer } from 'cesium';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockViewer } from '@/__mocks__/cesium.js';
import { Highlight } from '@/viewer/highlight.js';

vi.mock('../../collection/collection.ts', () => {
  return import('../../__mocks__/collection.js');
});

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
      expect(highlight.viewer).toEqual(viewer);

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
      const clearAllSpy = vi.spyOn(highlight, 'clearAll');
      const instancesMap = Highlight['instances'];
      expect(instancesMap.has(viewer)).toBe(true);
      expect(instancesMap.get(viewer)).toBe(highlight);

      Highlight.releaseInstance(viewer);

      expect(clearAllSpy).toHaveBeenCalledTimes(1);
      expect(instancesMap.has(viewer)).toBe(false);

      const newHighlight = Highlight.getInstance(viewer);
      expect(newHighlight).not.toBe(highlight);
      expect(instancesMap.get(viewer)).toBe(newHighlight);
    });

    it('should handle releasing non-existent instances', () => {
      const viewer = createMockViewer() as unknown as Viewer;

      expect(() => {
        Highlight.releaseInstance(viewer);
      }).not.toThrow();
    });
  });

  describe('add', () => {
    it('should return undefined if there is no picked object', () => {
      expect(highlight.add(undefined)).toBe(undefined);
    });

    it('should handle different types of picked objects', () => {
      highlight['_highlightEntity'] = vi.fn();
      highlight['_highlightGroundPrimitive'] = vi.fn();
      const entity = new Entity();
      const objectWithId = { id: new Entity() };
      const objectWithPrimitive = { primitive: new GroundPrimitive() };
      const color = Color.RED;

      highlight.add(entity, color);
      expect(highlight['_highlightEntity']).toBeCalledWith(entity, color);

      highlight.add(objectWithId, color);
      expect(highlight['_highlightEntity']).toBeCalledWith(
        objectWithId.id,
        color,
      );

      highlight.add(objectWithPrimitive, color);
      expect(highlight['_highlightGroundPrimitive']).toBeCalledWith(
        objectWithPrimitive.primitive,
        color,
      );
    });

    it('should return and add result to active highlights set only when successful', () => {
      const e = new Entity();
      highlight['_highlightEntity'] = vi.fn().mockReturnValue(e);
      expect(highlight.add(new Entity())).toBe(e);
      expect(highlight.activeHighlights.size).toBe(1);

      highlight['_highlightEntity'] = vi.fn().mockReturnValue(undefined);
      expect(highlight.add(new Entity())).toBeUndefined();
      expect(highlight.activeHighlights.size).toBe(1);
    });
  });

  afterAll(() => vi.clearAllMocks());
});
