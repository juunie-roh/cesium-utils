import {
  Cartesian3,
  ClassificationType,
  Color,
  Entity,
  GeometryInstance,
  GroundPrimitive,
  HeightReference,
  PolygonGraphics,
  PolygonHierarchy,
  PolylineGraphics,
  Primitive,
  Rectangle,
  RectangleGraphics,
  Viewer,
} from 'cesium';
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
      expect(viewer.entities).toEqual(highlight['_entities']);
    });

    it('should create new instances each from different viewers', () => {
      expect(Highlight.getInstance(viewer)).not.toEqual(
        Highlight.getInstance(createMockViewer() as unknown as Viewer),
      );
    });
  });

  describe('releaseInstance', () => {
    it('should release the instance associated with a viewer', () => {
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
      const objectWithGroundPrimitive = { primitive: new GroundPrimitive() };
      const color = Color.RED;

      highlight.show(entity, color);
      expect(highlight['_update']).toBeCalledWith(entity, color, false);

      highlight.show(objectWithId, color);
      expect(highlight['_update']).toBeCalledWith(
        objectWithId.id,
        color,
        false,
      );

      highlight.show(objectWithGroundPrimitive, color);
      expect(highlight['_update']).toBeCalledWith(
        objectWithGroundPrimitive.primitive,
        color,
        false,
      );
    });

    it('should handle unsupported object', () => {
      highlight['_update'] = vi.fn();
      const objectWithPrimitive = { primitive: new Primitive() };

      expect(highlight.show(objectWithPrimitive, Color.RED)).toBeUndefined();
      expect(highlight['_update']).not.toBeCalled();
      expect(highlight.entity.show).toBe(false);
    });

    it('should return the highlight entity when successful', () => {
      // Mock the _update method to do nothing
      highlight['_update'] = vi.fn();
      const mockEntity = new Entity();
      highlight['_entity'] = mockEntity;

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
      highlight['_entity'] = mockEntity;

      highlight.hide();

      expect(mockEntity.show).toBe(false);
    });
  });

  describe('updating from an Entity', () => {
    describe('with polygon', () => {
      it('should update with polygon fill style', () => {
        const positions = [
          new Cartesian3(1, 2, 3),
          new Cartesian3(4, 5, 6),
          new Cartesian3(7, 8, 9),
        ];
        const hierarchy = new PolygonHierarchy(positions);

        const sourceEntity = new Entity({
          polygon: new PolygonGraphics({
            hierarchy: hierarchy,
            heightReference: HeightReference.CLAMP_TO_GROUND,
            classificationType: ClassificationType.TERRAIN,
          }),
        });

        // Call the _update method
        const color = Color.RED;
        highlight['_update'](sourceEntity, color, false);

        // Check that the polygon property was set
        expect(highlight.entity.polygon).toBeDefined();
        expect(highlight.entity.polygon).toBeInstanceOf(PolygonGraphics);
        expect(highlight.entity.polygon?.hierarchy?.getValue()).toEqual(
          sourceEntity.polygon?.hierarchy?.getValue(),
        );
        expect(highlight.entity.polygon?.heightReference?.getValue()).toEqual(
          sourceEntity.polygon?.heightReference?.getValue(),
        );
      });

      it('should update with polygon outline style', () => {
        // Create a mock entity with polygon
        const positions = [
          new Cartesian3(1, 2, 3),
          new Cartesian3(4, 5, 6),
          new Cartesian3(7, 8, 9),
        ];
        const hierarchy = new PolygonHierarchy(positions);

        const sourceEntity = new Entity({
          polygon: new PolygonGraphics({
            hierarchy,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          }),
        });

        const closedPositions = [...positions, positions[0]];
        const closedHierarchy = new PolygonHierarchy(closedPositions);
        const closedEntity = new Entity({
          polygon: new PolygonGraphics({
            hierarchy: closedHierarchy,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          }),
        });

        // Call the _update method
        const color = Color.RED;
        highlight['_update'](sourceEntity, color, true);

        // Check that the polyline property was set
        expect(highlight.entity.polyline).toBeDefined();
        expect(highlight.entity.polyline).toBeInstanceOf(PolylineGraphics);
        expect(highlight.entity.polyline?.positions?.getValue()).toEqual(
          closedPositions,
        );

        highlight['_update'](closedEntity, color, true);
        expect(highlight.entity.polyline?.positions?.getValue()).toEqual(
          closedPositions,
        );
      });
    });

    describe('with polyline', () => {
      it('should update with polyline style', () => {
        // Create a mock entity with polyline
        const positions = [
          new Cartesian3(1, 2, 3),
          new Cartesian3(4, 5, 6),
          new Cartesian3(7, 8, 9),
        ];

        const sourceEntity = new Entity({
          polyline: new PolylineGraphics({
            positions: positions,
            width: 3,
            clampToGround: true,
          }),
        });

        // Call the _update method
        const color = Color.RED;
        highlight['_update'](sourceEntity, color, false);

        // Check that the polyline property was set
        expect(highlight.entity.polyline).toBeDefined();
        expect(highlight.entity.polyline).toBeInstanceOf(PolylineGraphics);
        expect(highlight.entity.polyline?.width?.getValue()).toBe(5); // Original width + 2
      });
    });

    describe('with rectangle', () => {
      it('should update with rectangle fill style', () => {
        // Create a mock entity with rectangle
        const coordinates = new Rectangle(0.1, 0.2, 0.3, 0.4);

        const sourceEntity = new Entity({
          rectangle: new RectangleGraphics({
            coordinates: coordinates,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          }),
        });

        // Call the _update method
        const color = Color.RED;
        highlight['_update'](sourceEntity, color, false);

        // Check that the rectangle property was set
        expect(highlight.entity.rectangle).toBeDefined();
        expect(highlight.entity.rectangle).toBeInstanceOf(RectangleGraphics);
        expect(highlight.entity.rectangle?.coordinates?.getValue()).toEqual(
          coordinates,
        );
      });

      it('should update with rectangle outline style', () => {
        // Create a mock entity with rectangle
        const coordinates = new Rectangle(0.1, 0.2, 0.3, 0.4);

        const sourceEntity = new Entity({
          rectangle: new RectangleGraphics({
            coordinates: coordinates,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          }),
        });

        // Call the _update method
        const color = Color.RED;
        highlight['_update'](sourceEntity, color, true);

        // Check that the polyline property was set
        expect(highlight.entity.polyline).toBeDefined();
        expect(highlight.entity.polyline).toBeInstanceOf(PolylineGraphics);
        // Verify it has 5 positions (4 corners + closing point)
        expect(highlight.entity.polyline?.positions?.getValue()?.length).toBe(
          5,
        );
      });
    });
  });

  describe('updating from a GroundPrimitive', () => {
    it('should update with polygon fill style', () => {
      // Create mock geometry instance with position values
      const positionValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const instance = {
        geometry: {
          attributes: {
            position: {
              values: positionValues,
            },
          },
        },
      } as unknown as GeometryInstance;

      // Create a mock GroundPrimitive
      const primitive = new GroundPrimitive({ geometryInstances: instance });

      // Call the _update method
      const color = Color.RED;
      highlight['_update'](primitive, color, false);

      // Check that the polygon property was set
      expect(highlight.entity.polygon).toBeDefined();
      expect(highlight.entity.polygon).toBeInstanceOf(PolygonGraphics);

      // Verify the polygon hierarchy has the correct positions
      const hierarchy = highlight.entity.polygon?.hierarchy?.getValue();
      expect(hierarchy).toBeDefined();
      expect(hierarchy!.positions.length).toBe(3); // 3 positions from 9 values (x,y,z triplets)
    });

    it('should update with polyline outline style', () => {
      // Create mock geometry instance with position values
      const positionValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const instance = {
        geometry: {
          attributes: {
            position: {
              values: positionValues,
            },
          },
        },
      } as unknown as GeometryInstance;
      const instance2 = {
        geometry: {
          attributes: {
            position: {
              values: [...positionValues, 10],
            },
          },
        },
      } as unknown as GeometryInstance;
      const invalidInstance = {
        geometry: {
          attributes: {
            position: undefined,
          },
        },
      } as unknown as GeometryInstance;
      const instances = [instance, instance2];

      // Create a mock GroundPrimitive
      const primitive = new GroundPrimitive({ geometryInstances: instances });
      const invalidPrimitive = new GroundPrimitive({
        geometryInstances: invalidInstance,
      });

      // Call the _update method
      const color = Color.RED;
      highlight['_update'](primitive, color, true);

      // Check that the polyline property was set
      expect(highlight.entity.polyline).toBeDefined();
      expect(highlight.entity.polyline).toBeInstanceOf(PolylineGraphics);

      // Verify the polyline has the correct positions
      const positions = highlight.entity.polyline?.positions?.getValue();
      expect(positions).toBeDefined();
      expect(positions!.length).toBe(3); // 3 positions from 9 values (x,y,z triplets)

      const entityBeforeInvalidUpdate = highlight.entity;
      highlight['_update'](invalidPrimitive, color, true);
      expect(highlight.entity).toEqual(entityBeforeInvalidUpdate);
    });
  });

  describe('defaultColor', () => {
    it('should be changed', () => {
      const color = Color.RED;
      highlight.defaultColor = color;
      expect(highlight.defaultColor).toEqual(color);
    });
  });

  describe('entity', () => {
    it('should return the highlight entity', () => {
      const mockEntity = new Entity();
      highlight['_entity'] = mockEntity;

      expect(highlight.entity).toBe(mockEntity);
    });
  });

  afterAll(() => vi.clearAllMocks());
});
