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
      const clearAllSpy = vi.spyOn(highlight, 'removeAll');
      const instancesMap = Highlight['instances'];
      expect(instancesMap.has(viewer.container)).toBe(true);
      expect(instancesMap.get(viewer.container)).toBe(highlight);

      Highlight.releaseInstance(viewer);

      expect(clearAllSpy).toHaveBeenCalledTimes(1);
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

  describe('add', () => {
    it('should return undefined if there is no picked object', () => {
      expect(highlight.add(undefined)).toBe(undefined);
    });

    it('should handle different types of picked objects', () => {
      highlight['_createEntity'] = vi.fn();
      const entity = new Entity();
      const objectWithId = { id: new Entity() };
      const objectWithPrimitive = { primitive: new GroundPrimitive() };
      const color = Color.RED;

      highlight.add(entity, color);
      expect(highlight['_createEntity']).toBeCalledWith(entity, color, false);

      highlight.add(objectWithId, color);
      expect(highlight['_createEntity']).toBeCalledWith(
        objectWithId.id,
        color,
        false,
      );

      highlight.add(objectWithPrimitive, color);
      expect(highlight['_createEntity']).toBeCalledWith(
        objectWithPrimitive.primitive,
        color,
        false,
      );
    });

    it('should return and add result to active highlights set only when successful', () => {
      const e = new Entity();
      highlight['_createEntity'] = vi.fn().mockReturnValue(e);
      expect(highlight.add(new Entity())).toBe(e);
      expect(highlight.activeHighlights.length).toBe(1);

      highlight['_createEntity'] = vi.fn().mockReturnValue(undefined);
      expect(highlight.add(new Entity())).toBeUndefined();
      expect(highlight.activeHighlights.length).toBe(1);
    });
  });

  afterAll(() => vi.clearAllMocks());
});
