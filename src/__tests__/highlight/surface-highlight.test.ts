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
  Rectangle,
  RectangleGraphics,
  Viewer,
} from "cesium";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createMockViewer } from "@/__mocks__/cesium.js";
import SurfaceHighlight from "@/highlight/surface-highlight.js";

describe("Highlight", () => {
  let viewer: Viewer;
  let surface: SurfaceHighlight;

  beforeEach(() => {
    viewer = createMockViewer() as unknown as Viewer;
    surface = new SurfaceHighlight(viewer);
  });

  describe("constructor", () => {
    it("should create new instance from a viewer", () => {
      expect(surface).toBeDefined();
      expect(surface.color).toEqual(Color.RED);

      expect(viewer.entities).toEqual(surface["_entities"]);
    });
  });

  describe("show", () => {
    it("should return undefined with not defined objects", () => {
      expect(surface.show(undefined as unknown as Entity)).toBeUndefined();
      surface["_entity"] = undefined as unknown as Entity;
      expect(
        surface.show(
          new Entity({
            polygon: true as unknown as PolygonGraphics,
          }),
        ),
      ).toBeUndefined();
    });

    it("should handle different types of picked objects", () => {
      surface["_update"] = vi.fn();
      const entity = new Entity({
        polygon: true as unknown as PolygonGraphics,
      });
      const groundPrimitive = new GroundPrimitive();
      const color = Color.BLUE;

      surface.show(entity, { color });
      expect(surface["_update"]).toBeCalledWith(entity, { color });

      surface.show(groundPrimitive, { color });
      expect(surface["_update"]).toBeCalledWith(groundPrimitive, { color });
    });

    it("should return the highlight entity when successful", () => {
      // Mock the _update method to do nothing
      surface["_update"] = vi.fn();
      const mockEntity = new Entity({
        polygon: true as unknown as PolygonGraphics,
      });
      surface["_entity"] = mockEntity;

      expect(
        surface.show(
          new Entity({
            polygon: true as unknown as PolygonGraphics,
          }),
        ),
      ).toBe(mockEntity);
      expect(mockEntity.show).toBe(true);
    });

    it("should return undefined when the entity has no supported geometry", () => {
      expect(surface.show(new Entity())).toBeUndefined();
    });

    it("should log an error and return undefined when update fails", () => {
      // Force an error in the _update method
      surface["_update"] = vi.fn().mockImplementation(() => {
        throw new Error("Test error");
      });
      const errorSpy = vi.spyOn(console, "error");

      expect(
        surface.show(
          new Entity({
            polygon: true as unknown as PolygonGraphics,
          }),
        ),
      ).toBeUndefined();
      expect(errorSpy).toBeCalled();
    });
  });

  describe("hide", () => {
    it("should hide the highlight entity", () => {
      // Mock the highlight entity
      const mockEntity = new Entity({
        polygon: true as unknown as PolygonGraphics,
      });
      surface["_entity"] = mockEntity;

      surface.hide();

      expect(mockEntity.show).toBe(false);
    });
  });

  describe("updating from an Entity", () => {
    describe("with polygon", () => {
      it("should update with polygon fill style", () => {
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
        surface["_update"](sourceEntity, { color, outline: false });

        // Check that the polygon property was set
        expect(surface.entity.polygon).toBeDefined();
        expect(surface.entity.polygon).toBeInstanceOf(PolygonGraphics);
        expect(surface.entity.polygon?.hierarchy?.getValue()).toEqual(
          sourceEntity.polygon?.hierarchy?.getValue(),
        );
        expect(surface.entity.polygon?.heightReference?.getValue()).toEqual(
          sourceEntity.polygon?.heightReference?.getValue(),
        );
      });

      it("should update with polygon outline style", () => {
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
        surface["_update"](sourceEntity, { color, outline: true });

        // Check that the polyline property was set
        expect(surface.entity.polyline).toBeDefined();
        expect(surface.entity.polyline).toBeInstanceOf(PolylineGraphics);
        expect(surface.entity.polyline?.positions?.getValue()).toEqual(
          closedPositions,
        );

        surface["_update"](closedEntity, { color, outline: true });
        expect(surface.entity.polyline?.positions?.getValue()).toEqual(
          closedPositions,
        );
      });
    });

    describe("with polyline", () => {
      it("should update with polyline style", () => {
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
        surface["_update"](sourceEntity, { color, outline: false });

        // Check that the polyline property was set
        expect(surface.entity.polyline).toBeDefined();
        expect(surface.entity.polyline).toBeInstanceOf(PolylineGraphics);
        expect(surface.entity.polyline?.width?.getValue()).toBe(5); // Original width + 2
      });
    });

    describe("with rectangle", () => {
      it("should update with rectangle fill style", () => {
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
        surface["_update"](sourceEntity, { color, outline: false });

        // Check that the rectangle property was set
        expect(surface.entity.rectangle).toBeDefined();
        expect(surface.entity.rectangle).toBeInstanceOf(RectangleGraphics);
        expect(surface.entity.rectangle?.coordinates?.getValue()).toEqual(
          coordinates,
        );
      });

      it("should update with rectangle outline style", () => {
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
        surface["_update"](sourceEntity, { color, outline: true });

        // Check that the polyline property was set
        expect(surface.entity.polyline).toBeDefined();
        expect(surface.entity.polyline).toBeInstanceOf(PolylineGraphics);
        // Verify it has 5 positions (4 corners + closing point)
        expect(surface.entity.polyline?.positions?.getValue()?.length).toBe(5);
      });
    });
  });

  describe("updating from a GroundPrimitive", () => {
    it("should update with polygon fill style", () => {
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
      surface["_update"](primitive, { color, outline: false });

      // Check that the polygon property was set
      expect(surface.entity.polygon).toBeDefined();
      expect(surface.entity.polygon).toBeInstanceOf(PolygonGraphics);

      // Verify the polygon hierarchy has the correct positions
      const hierarchy = surface.entity.polygon?.hierarchy?.getValue();
      expect(hierarchy).toBeDefined();
      expect(hierarchy!.positions.length).toBe(3); // 3 positions from 9 values (x,y,z triplets)
    });

    it("should update with polyline outline style", () => {
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
      surface["_update"](primitive, { color, outline: true });

      // Check that the polyline property was set
      expect(surface.entity.polyline).toBeDefined();
      expect(surface.entity.polyline).toBeInstanceOf(PolylineGraphics);

      // Verify the polyline has the correct positions
      const positions = surface.entity.polyline?.positions?.getValue();
      expect(positions).toBeDefined();
      expect(positions!.length).toBe(3); // 3 positions from 9 values (x,y,z triplets)

      const entityBeforeInvalidUpdate = surface.entity;
      surface["_update"](invalidPrimitive, { color, outline: true });
      expect(surface.entity).toEqual(entityBeforeInvalidUpdate);
    });
  });

  describe("destroy", () => {
    it("should clean up the entity instance used to highlight", () => {
      surface.destroy();
      expect(surface["_entities"].remove).toBeCalled();
      expect(surface["_entities"].remove).toBeCalledWith(surface.entity);
    });
  });

  describe("color", () => {
    it("should be changed", () => {
      const color = Color.RED;
      surface.color = color;
      expect(surface.color).toEqual(color);
    });
  });

  describe("entity", () => {
    it("should return the highlight entity", () => {
      const mockEntity = new Entity();
      surface["_entity"] = mockEntity;

      expect(surface.entity).toBe(mockEntity);
    });
  });

  describe("object tracking optimization", () => {
    let entity1: Entity;
    let entity2: Entity;

    beforeEach(() => {
      entity1 = new Entity({
        id: "entity1",
        polygon: new PolygonGraphics({
          hierarchy: new PolygonHierarchy([
            new Cartesian3(1, 2, 3),
            new Cartesian3(4, 5, 6),
            new Cartesian3(7, 8, 9),
          ]),
        }),
      });

      entity2 = new Entity({
        id: "entity2",
        polygon: new PolygonGraphics({
          hierarchy: new PolygonHierarchy([
            new Cartesian3(10, 11, 12),
            new Cartesian3(13, 14, 15),
            new Cartesian3(16, 17, 18),
          ]),
        }),
      });
    });

    it("should not update when showing the same object repeatedly", () => {
      const updateSpy = vi.spyOn(surface as any, "_update");
      const clearSpy = vi.spyOn(surface as any, "_clearGeometries");

      // First call should update
      surface.show(entity1);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(surface.currentObject).toBe(entity1);

      // Reset spies
      updateSpy.mockClear();
      clearSpy.mockClear();

      // Second call with same object should not update
      surface.show(entity1);
      expect(updateSpy).not.toHaveBeenCalled();
      expect(clearSpy).not.toHaveBeenCalled();
      expect(surface.currentObject).toBe(entity1);
    });

    it("should update when showing a different object", () => {
      const updateSpy = vi.spyOn(surface as any, "_update");
      const clearSpy = vi.spyOn(surface as any, "_clearGeometries");

      // First object
      surface.show(entity1);
      expect(surface.currentObject).toBe(entity1);

      // Reset spies
      updateSpy.mockClear();
      clearSpy.mockClear();

      // Different object should trigger update
      surface.show(entity2);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(surface.currentObject).toBe(entity2);
    });

    it("should update when showing same object with different options", () => {
      const updateSpy = vi.spyOn(surface as any, "_update");
      const clearSpy = vi.spyOn(surface as any, "_clearGeometries");

      // First call with default options
      surface.show(entity1);
      expect(surface.currentObject).toBe(entity1);

      // Reset spies
      updateSpy.mockClear();
      clearSpy.mockClear();

      // Same object but different options should trigger update
      surface.show(entity1, { color: Color.BLUE, outline: true });
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(clearSpy).toHaveBeenCalledTimes(1);
    });

    it("should not update when showing same object with equivalent options", () => {
      const options1 = { color: Color.RED, outline: false, width: 2 };
      const options2 = { color: Color.RED, outline: false, width: 2 };

      const updateSpy = vi.spyOn(surface as any, "_update");

      surface.show(entity1, options1);
      updateSpy.mockClear();

      // Same options should not trigger update
      surface.show(entity1, options2);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("should clear tracking when hiding", () => {
      surface.show(entity1);
      expect(surface.currentObject).toBe(entity1);

      surface.hide();
      expect(surface.currentObject).toBeUndefined();
    });

    it("should clear tracking on error", () => {
      // Mock _update to throw error
      vi.spyOn(surface as any, "_update").mockImplementation(() => {
        throw new Error("Test error");
      });

      surface.show(entity1);
      expect(surface.currentObject).toBeUndefined();
    });

    it("should handle rapid mouse movements efficiently", () => {
      const updateSpy = vi.spyOn(surface as any, "_update");

      // Simulate rapid mouse movements over the same entity
      for (let i = 0; i < 100; i++) {
        surface.show(entity1);
      }

      // Should only update once
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  // Add this to test options comparison edge cases
  describe("_optionsEqual", () => {
    it("should handle undefined colors correctly", () => {
      const entity = new Entity({
        polygon: new PolygonGraphics({
          hierarchy: new PolygonHierarchy([new Cartesian3(1, 2, 3)]),
        }),
      });

      const options1 = { outline: false };
      const options2 = { outline: false, color: undefined };

      const updateSpy = vi.spyOn(surface as any, "_update");

      surface.show(entity, options1);
      updateSpy.mockClear();

      // Should not trigger update (both use default color)
      surface.show(entity, options2);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it("should detect color differences correctly", () => {
      const entity = new Entity({
        polygon: new PolygonGraphics({
          hierarchy: new PolygonHierarchy([new Cartesian3(1, 2, 3)]),
        }),
      });

      const updateSpy = vi.spyOn(surface as any, "_update");

      surface.show(entity, { color: Color.RED });
      updateSpy.mockClear();

      // Different color should trigger update
      surface.show(entity, { color: Color.BLUE });
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(() => vi.clearAllMocks());
});
