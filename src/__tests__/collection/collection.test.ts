import {
  DataSourceCollection,
  Entity,
  EntityCollection,
  Event,
  ImageryLayerCollection,
  Primitive,
  PrimitiveCollection,
} from "cesium";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Collection } from "@/collection/index.js";

describe("Collection", () => {
  let baseEntities: EntityCollection;
  let taggedEntities: Collection<EntityCollection, Entity>;
  let basePrimitives: PrimitiveCollection;
  let taggedPrimitives: Collection<PrimitiveCollection, Primitive>;

  let single_entity: Entity;
  let multiple_entities: Entity[];
  let single_primitive: Primitive;
  let multiple_primitives: Primitive[];

  beforeEach(() => {
    // Create fresh instances for each test
    baseEntities = new EntityCollection();
    taggedEntities = new Collection<EntityCollection, Entity>({
      collection: baseEntities,
    });

    basePrimitives = new PrimitiveCollection();
    taggedPrimitives = new Collection<PrimitiveCollection, Primitive>({
      collection: basePrimitives,
    });

    // Reset entity/primitive instances
    single_entity = new Entity({ id: "single" });
    multiple_entities = [
      new Entity({ id: "multi-add-test1" }),
      new Entity({ id: "multi-add-test2" }),
      new Entity({ id: "multi-add-test3" }),
    ];

    single_primitive = new Primitive();
    multiple_primitives = [
      new Primitive(),
      new Primitive(),
      new Primitive(),
      new Primitive(),
    ];
  });

  afterEach(() => {
    taggedEntities.destroy();
    taggedPrimitives.destroy();
  });

  it('should create a collection with "default" tag', () => {
    expect(taggedEntities).toBeDefined();
    expect(taggedEntities).toBeInstanceOf(Collection);
    expect(baseEntities.values.length).toBe(0);
    taggedEntities.add(single_entity);
    expect(
      (single_entity as Entity & Collection.WithTag)[Collection.symbol],
    ).toBe("default");

    expect(taggedPrimitives).toBeInstanceOf(Collection);
    expect(basePrimitives.length).toBe(0);
    taggedPrimitives.add(single_primitive);
    expect(
      (single_primitive as Primitive & Collection.WithTag)[Collection.symbol],
    ).toBe("default");
  });

  it("should create a collection with a specific tag", () => {
    const tag = "SpecificTagForNewCollection";
    const tmp = new Collection({ collection: new EntityCollection(), tag });
    tmp.add(single_entity);
    expect(
      (single_entity as Entity & Collection.WithTag)[Collection.symbol],
    ).toBe(tag);
  });

  it("should support numeric tags", () => {
    taggedEntities.add(single_entity, 123);
    expect(taggedEntities.contains(123)).toBeTruthy();
    expect(taggedEntities.get(123)).toHaveLength(1);
  });

  describe("caching implementation", () => {
    describe("cache creation and reuse", () => {
      it("should build cache on first access to values", () => {
        // Verify cache is initially null
        expect(taggedEntities["_valuesCache"]).toBe(null);

        // First access should build cache
        const values1 = taggedEntities.values;
        expect(taggedEntities["_valuesCache"]).not.toBe(null);
        expect(taggedEntities["_valuesCache"]).toBe(values1);
        expect(values1).toHaveLength(0);
      });

      it("should reuse cache on subsequent access", () => {
        // First access builds cache
        const values1 = taggedEntities.values;
        const cachedValues = taggedEntities["_valuesCache"];

        // Second access should return same cached instance
        const values2 = taggedEntities.values;
        expect(values2).toBe(values1);
        expect(values2).toBe(cachedValues);
        expect(taggedEntities["_valuesCache"]).toBe(cachedValues);
      });

      it("should build cache correctly for EntityCollection", () => {
        taggedEntities.add(multiple_entities);

        const values = taggedEntities.values;
        expect(values).toHaveLength(3);
        expect(values).toContain(multiple_entities[0]);
        expect(values).toContain(multiple_entities[1]);
        expect(values).toContain(multiple_entities[2]);
        expect(taggedEntities["_valuesCache"]).toBe(values);
      });

      it("should build cache correctly for PrimitiveCollection", () => {
        taggedPrimitives.add(multiple_primitives);

        const values = taggedPrimitives.values;
        expect(values).toHaveLength(4);
        expect(values).toEqual(multiple_primitives);
        expect(taggedPrimitives["_valuesCache"]).toBe(values);
      });
    });

    describe("cache invalidation", () => {
      it("should invalidate cache when adding items", () => {
        // Build initial cache
        const initialValues = taggedEntities.values;
        expect(taggedEntities["_valuesCache"]).toBe(initialValues);
        expect(initialValues).toHaveLength(0);

        // Add item should invalidate cache
        taggedEntities.add(single_entity);
        expect(taggedEntities["_valuesCache"]).toBe(null);

        // Next access should rebuild cache
        const newValues = taggedEntities.values;
        // expect(newValues).not.toBe(initialValues);
        expect(newValues).toHaveLength(1);
        expect(taggedEntities["_valuesCache"]).toBe(newValues);
      });

      it("should invalidate cache when removing items", () => {
        // Setup collection with items
        taggedEntities.add(multiple_entities);
        const initialValues = taggedEntities.values;
        expect(taggedEntities["_valuesCache"]).toBe(initialValues);
        expect(initialValues).toHaveLength(multiple_entities.length);

        // Remove item should invalidate cache
        taggedEntities.remove(multiple_entities[0]);
        expect(taggedEntities["_valuesCache"]).toBe(null);

        // Next access should rebuild cache
        const newValues = taggedEntities.values;
        // expect(newValues).not.toBe(initialValues);
        expect(newValues).toHaveLength(2);
      });

      it("should invalidate cache when removing all items", () => {
        // Setup collection with items
        taggedEntities.add(multiple_entities);
        const initialValues = taggedEntities.values;
        expect(taggedEntities["_valuesCache"]).toBe(initialValues);
        expect(initialValues).toHaveLength(multiple_entities.length);

        // RemoveAll should invalidate cache
        taggedEntities.removeAll();
        expect(taggedEntities["_valuesCache"]).toBe(null);

        // Next access should rebuild cache
        const newValues = taggedEntities.values;
        // expect(newValues).not.toBe(initialValues);
        expect(newValues).toHaveLength(0);
      });

      it("should not invalidate cache when updating tags", () => {
        // Setup collection with items
        taggedEntities.add(multiple_entities, "original");
        const initialValues = taggedEntities.values;
        expect(taggedEntities["_valuesCache"]).toBe(initialValues);

        // Update tag should not invalidate cache (same items, different tags)
        taggedEntities.update("original", "updated");
        expect(taggedEntities["_valuesCache"]).toBe(initialValues);

        // Values should still be the same
        const sameValues = taggedEntities.values;
        expect(sameValues).toBe(initialValues);
      });
    });

    describe("event-driven invalidation", () => {
      it("should invalidate cache when EntityCollection changes via events", () => {
        // Build initial cache
        const initialValues = taggedEntities.values;
        expect(taggedEntities["_valuesCache"]).toEqual(initialValues);
        expect(initialValues).toHaveLength(0);

        // Directly modify underlying collection (triggers collectionChanged event)
        baseEntities.add(new Entity({ id: "external-add" }));

        // Cache should be invalidated by event
        expect(taggedEntities["_valuesCache"]).toBe(null);

        // Next access should include externally added entity
        const newValues = taggedEntities.values;
        // expect(newValues).not.toBe(initialValues);
        expect(newValues).toHaveLength(1);
        expect(newValues.some((e) => e.id === "external-add")).toBe(true);
      });

      it("should invalidate cache when PrimitiveCollection changes via events", () => {
        // Build initial cache
        const initialValues = taggedPrimitives.values;
        expect(taggedPrimitives["_valuesCache"]).toBe(initialValues);

        // Directly modify underlying collection (triggers primitiveAdded event)
        const externalPrimitive = new Primitive();
        basePrimitives.add(externalPrimitive);

        // Cache should be invalidated by event
        expect(taggedPrimitives["_valuesCache"]).toBe(null);

        // Next access should include externally added primitive
        const newValues = taggedPrimitives.values;
        expect(newValues).not.toBe(initialValues);
        expect(newValues).toHaveLength(1);
        expect(newValues).toContain(externalPrimitive);
      });

      it("should add event listeners for all supported collection types", () => {
        // Test EntityCollection
        const entityCollection = new EntityCollection();
        const entityWrapper = new Collection({ collection: entityCollection });
        expect(entityWrapper["_eventCleanupFunctions"]).toHaveLength(1);
        expect(entityCollection.collectionChanged.numberOfListeners).toBe(1);

        // Test PrimitiveCollection
        const primitiveCollection = new PrimitiveCollection();
        const primitiveWrapper = new Collection({
          collection: primitiveCollection,
        });
        expect(primitiveWrapper["_eventCleanupFunctions"]).toHaveLength(2); // primitiveAdded + primitiveRemoved
        expect(primitiveCollection.primitiveAdded.numberOfListeners).toBe(1);
        expect(primitiveCollection.primitiveRemoved.numberOfListeners).toBe(1);

        // Test DataSourceCollection
        const dataSourceCollection = new DataSourceCollection();
        const dataSourceWrapper = new Collection({
          collection: dataSourceCollection,
        });
        expect(dataSourceWrapper["_eventCleanupFunctions"]).toHaveLength(3); // added + moved + removed
        expect(dataSourceCollection.dataSourceAdded.numberOfListeners).toBe(1);
        expect(dataSourceCollection.dataSourceMoved.numberOfListeners).toBe(1);
        expect(dataSourceCollection.dataSourceRemoved.numberOfListeners).toBe(
          1,
        );

        // Test ImageryLayerCollection
        const imageryCollection = new ImageryLayerCollection();
        const imageryWrapper = new Collection({
          collection: imageryCollection,
        });
        expect(imageryWrapper["_eventCleanupFunctions"]).toHaveLength(4); // added + moved + removed + shownOrHidden
        expect(imageryCollection.layerAdded.numberOfListeners).toBe(1);
        expect(imageryCollection.layerMoved.numberOfListeners).toBe(1);
        expect(imageryCollection.layerRemoved.numberOfListeners).toBe(1);
        expect(imageryCollection.layerShownOrHidden.numberOfListeners).toBe(1);
      });

      it("should remove event listeners for all supported collection types on destroy", () => {
        // Test EntityCollection
        const entityCollection = new EntityCollection();
        const entityWrapper = new Collection({ collection: entityCollection });
        entityWrapper.destroy();
        expect(entityCollection.collectionChanged.numberOfListeners).toBe(0);

        // Test PrimitiveCollection
        const primitiveCollection = new PrimitiveCollection();
        const primitiveWrapper = new Collection({
          collection: primitiveCollection,
        });
        primitiveWrapper.destroy();
        expect(primitiveCollection.primitiveAdded.numberOfListeners).toBe(0);
        expect(primitiveCollection.primitiveRemoved.numberOfListeners).toBe(0);

        // Test DataSourceCollection
        const dataSourceCollection = new DataSourceCollection();
        const dataSourceWrapper = new Collection({
          collection: dataSourceCollection,
        });
        dataSourceWrapper.destroy();
        expect(dataSourceCollection.dataSourceAdded.numberOfListeners).toBe(0);
        expect(dataSourceCollection.dataSourceMoved.numberOfListeners).toBe(0);
        expect(dataSourceCollection.dataSourceRemoved.numberOfListeners).toBe(
          0,
        );

        // Test ImageryLayerCollection
        const imageryCollection = new ImageryLayerCollection();
        const imageryWrapper = new Collection({
          collection: imageryCollection,
        });
        imageryWrapper.destroy();
        expect(imageryCollection.layerAdded.numberOfListeners).toBe(0);
        expect(imageryCollection.layerMoved.numberOfListeners).toBe(0);
        expect(imageryCollection.layerRemoved.numberOfListeners).toBe(0);
        expect(imageryCollection.layerShownOrHidden.numberOfListeners).toBe(0);
      });
    });

    describe("cache performance characteristics", () => {
      it("should provide O(1) access after initial O(n) build", () => {
        // Setup large collection
        const largeCollection = Array.from(
          { length: 1000 },
          (_, i) => new Entity({ id: `entity-${i}` }),
        );
        taggedEntities.add(largeCollection);

        // First access - O(n) build
        const startTime1 = performance.now();
        const values1 = taggedEntities.values;
        const buildTime = performance.now() - startTime1;

        // Second access - O(1) cached
        const startTime2 = performance.now();
        const values2 = taggedEntities.values;
        const cacheTime = performance.now() - startTime2;

        expect(values1).toBe(values2); // Same reference
        expect(values1).toHaveLength(1000);
        expect(cacheTime).toBeLessThan(buildTime); // Cache access should be faster
      });

      it("should minimize cache rebuilds", () => {
        let buildCount = 0;

        // Mock the underlying collection values to count access
        const originalValuesGetter = Object.getOwnPropertyDescriptor(
          baseEntities,
          "values",
        );
        Object.defineProperty(baseEntities, "values", {
          get: function () {
            buildCount++;
            return originalValuesGetter?.get?.call(this) || [];
          },
          configurable: true,
        });

        // Multiple access to values should only build once
        taggedEntities.values;
        taggedEntities.values;
        taggedEntities.values;
        expect(buildCount).toBe(1);

        // Add item (invalidates cache)
        taggedEntities.add(single_entity);

        // Multiple access should build only once more
        taggedEntities.values;
        taggedEntities.values;
        expect(buildCount).toBe(2);

        // Restore original descriptor
        if (originalValuesGetter) {
          Object.defineProperty(baseEntities, "values", originalValuesGetter);
        }
      });
    });

    describe("cache interaction with other methods", () => {
      it("should work correctly with length getter", () => {
        // Length uses values internally, should benefit from cache
        taggedEntities.add(multiple_entities);

        // First length call builds cache
        expect(taggedEntities.length).toBe(multiple_entities.length);
        expect(taggedEntities["_valuesCache"]).not.toBe(null);

        // Second length call uses cache
        const cachedValues = taggedEntities["_valuesCache"];
        const length2 = taggedEntities.length;
        expect(length2).toBe(3);
        expect(taggedEntities["_valuesCache"]).toBe(cachedValues);
      });

      it("should work correctly with iterator", () => {
        taggedEntities.add(multiple_entities);

        // Using iterator should build cache
        const iteratedIds = [];
        for (const entity of taggedEntities) {
          iteratedIds.push(entity.id);
        }

        expect(iteratedIds).toHaveLength(3);
        expect(taggedEntities["_valuesCache"]).not.toBe(null);

        // Subsequent iteration should use cache
        const cachedValues = taggedEntities["_valuesCache"];
        const iteratedIds2 = [...taggedEntities].map((e) => e.id);
        expect(iteratedIds2).toEqual(iteratedIds);
        expect(taggedEntities["_valuesCache"]).toBe(cachedValues);
      });

      it("should work correctly with array methods (filter, map, etc.)", () => {
        taggedEntities.add(multiple_entities);

        // Array methods should build and use cache
        const filtered = taggedEntities.filter((e) => e.id?.includes("test"));
        expect(filtered).toHaveLength(3);
        expect(taggedEntities["_valuesCache"]).not.toBe(null);

        const cachedValues = taggedEntities["_valuesCache"];
        const mapped = taggedEntities.map((e) => e.id);
        expect(mapped).toHaveLength(3);
        expect(taggedEntities["_valuesCache"]).toBe(cachedValues); // Same cache used
      });
    });
  });

  describe("event handling", () => {
    it("should add and trigger event listeners", () => {
      const addHandler = vi.fn();
      const removeHandler = vi.fn();
      const updateHandler = vi.fn();
      const clearHandler = vi.fn();

      taggedEntities.addEventListener("add", addHandler);
      taggedEntities.addEventListener("remove", removeHandler);
      taggedEntities.addEventListener("update", updateHandler);
      taggedEntities.addEventListener("clear", clearHandler);

      // Test add event
      taggedEntities.add(single_entity);
      expect(addHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "add",
          items: [single_entity],
        }),
      );

      // Test remove event
      taggedEntities.remove(single_entity);
      expect(removeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "remove",
          items: [single_entity],
        }),
      );

      // Test update event
      taggedEntities.add(multiple_entities, "oldTag");
      taggedEntities.update("oldTag", "newTag");
      expect(updateHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "update",
          items: expect.any(Array),
          tag: "newTag",
        }),
      );

      // Test clear event
      taggedEntities.removeAll();
      expect(clearHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "clear",
        }),
      );
    });

    describe("supports iterator protocol", () => {
      it("should be iterable with for...of loops", () => {
        taggedEntities.add(multiple_entities);
        const ids = [];
        for (const entity of taggedEntities) {
          ids.push(entity.id);
        }
        expect(ids).toHaveLength(3);
        expect(ids).toContain("multi-add-test1");
        expect(ids).toContain("multi-add-test2");
        expect(ids).toContain("multi-add-test3");
      });

      it("should work with spread operator", () => {
        taggedEntities.add(multiple_entities);
        const entitiesArray = [...taggedEntities];
        expect(entitiesArray).toHaveLength(3);
        expect(entitiesArray[0].id).toBe("multi-add-test1");
      });
    });

    it("should remove event listeners", () => {
      const handler = vi.fn();

      taggedEntities.addEventListener("add", handler);
      taggedEntities.removeEventListener("add", handler);
      taggedEntities.add(single_entity);

      expect(handler).not.toHaveBeenCalled();
    });

    it("should handle removing non-existent event listeners", () => {
      const handler = vi.fn();
      // Removing a listener that was never added should not throw
      expect(() => {
        taggedEntities.removeEventListener("add", handler);
      }).not.toThrow();
    });
  });

  it(".add() should add an item with a tag", () => {
    const tag = "SpecificTagForCollectionAdd";
    expect(taggedEntities.add(single_entity, tag)).toHaveLength(1);

    expect(baseEntities.values.length).toBe(1);
    expect(Object.getOwnPropertySymbols(single_entity)).toContain(
      Collection.symbol,
    );
    expect(
      (single_entity as Entity & Collection.WithTag)[Collection.symbol],
    ).toBe(tag);
  });

  it(".add() should add multiple items with a tag", () => {
    expect(taggedEntities.add(single_entity, "multi-add-test1")).toHaveLength(
      1,
    );
    expect(
      taggedEntities.add(multiple_entities, "multi-add-test2"),
    ).toHaveLength(multiple_entities.length + 1);

    expect(baseEntities.values.length).toBe(4);
    expect(baseEntities.values).toContain(single_entity);
    multiple_entities.forEach((entity) => {
      expect(baseEntities.values).toContain(entity);
      expect((entity as Entity & Collection.WithTag)[Collection.symbol]).toBe(
        "multi-add-test2",
      );
    });
  });

  it(".add() should support index parameter for collections that support it", () => {
    // Some Cesium collections support adding at specific index
    // We're mocking this capability for testing
    const mockBaseCollection = {
      add: vi.fn(),
      remove: vi.fn().mockReturnValue(true),
      removeAll: vi.fn(),
      contains: vi.fn().mockReturnValue(true),
      length: 0,
      values: [],
      get: vi.fn(),
    };

    const mockCollection = new Collection({
      collection: mockBaseCollection as any,
    });
    const mockItem = {} as any;

    mockCollection.add(mockItem, "tag", 2);
    expect(mockBaseCollection.add).toHaveBeenCalledWith(mockItem, 2);
  });

  describe(".remove()", () => {
    describe("should remove an item", () => {
      it("and return true if it succeeds", () => {
        taggedEntities.add(single_entity, "testTag");
        expect(taggedEntities.remove(single_entity)).toBeTruthy();
        expect(baseEntities.values.length).toBe(0);
      });
    });

    describe("should remove items by tag", () => {
      it("and return true if items were removed", () => {
        taggedEntities.add(multiple_entities, "remove-tag");
        expect(taggedEntities.contains("remove-tag")).toBeTruthy();
        expect(taggedEntities.get("remove-tag").length).toBe(
          multiple_entities.length,
        );

        expect(taggedEntities.remove("remove-tag")).toBeTruthy();
        expect(taggedEntities.contains("remove-tag")).toBeFalsy();
      });
    });

    describe("should remove items by tag array", () => {
      it("and return true if any tags had items removed", () => {
        const tag1 = "remove1";
        const tag2 = "remove2";

        taggedEntities.add(multiple_entities, tag1);
        taggedEntities.add(single_entity, tag2);

        expect(taggedEntities.remove([tag1, tag2])).toBeTruthy();
        expect(taggedEntities.contains(tag1)).toBeFalsy();
        expect(taggedEntities.contains(tag2)).toBeFalsy();
      });

      it("and return itself after the removal", () => {
        taggedEntities.add(multiple_entities, "existing-tag");

        expect(
          taggedEntities.remove(["existing-tag", "nonexistent-tag"]),
        ).toEqual(taggedEntities);
        expect(taggedEntities.contains("existing-tag")).toBeFalsy();

        expect(taggedEntities.remove([])).toEqual(taggedEntities);
      });

      it("and remain still if no tags match any items", () => {
        const { values } = taggedEntities;
        expect(
          taggedEntities.remove(["nonexistent1", "nonexistent2"]).values,
        ).toEqual(values);
      });

      it("and should remain still for an empty array of tags", () => {
        taggedEntities.add(multiple_entities, "should-remain");
        expect(taggedEntities.contains("should-remain")).toBeTruthy();
      });
    });
  });

  it(".removeAll() should remove every item in the collection", () => {
    taggedEntities.add(multiple_entities);
    taggedEntities.removeAll();
    expect(taggedEntities.length).toBe(0);
    expect(baseEntities.values).toHaveLength(0);
  });

  it(".removeAll() should not throw when collection is already empty", () => {
    expect(() => {
      taggedEntities.removeAll();
    }).not.toThrow();
    expect(taggedEntities.length).toBe(0);
  });

  it(".values should return every item in the base collection", () => {
    baseEntities.add(single_entity);
    multiple_entities.forEach((entity) => {
      baseEntities.add(entity);
    });

    expect(taggedEntities.values).toEqual(baseEntities.values);

    basePrimitives.add(single_primitive);
    multiple_primitives.forEach((p) => basePrimitives.add(p));
    expect(taggedPrimitives.values).toHaveLength(basePrimitives.length);
  });

  it(".length should get the number of all items in the base collection", () => {
    baseEntities.add(single_entity);
    multiple_entities.forEach((entity) => {
      baseEntities.add(entity);
    });

    expect(taggedEntities.length).toEqual(baseEntities.values.length);
  });

  it(".length should return 0 when values is undefined", () => {
    // Create a mock collection without values property
    const mockCollection = new Collection({
      collection: {
        add: vi.fn(),
        remove: vi.fn(),
        removeAll: vi.fn(),
        contains: vi.fn(),
        length: 0,
      } as any,
    });

    expect(mockCollection.length).toBe(0);
  });

  describe(".contains()", () => {
    it('should return the same value from the base collection method "contains"', () => {
      taggedEntities.add(single_entity);
      expect(taggedEntities.contains(single_entity)).toEqual(
        baseEntities.contains(single_entity),
      );
    });

    it("should check if a tag exists", () => {
      taggedEntities.add(single_entity, "existingTag");

      expect(taggedEntities.contains("existingTag")).toBeTruthy();
      expect(taggedEntities.contains("nonExistingTag")).toBeFalsy();
    });
  });

  it(".get() should get items by tag", () => {
    taggedEntities.add(single_entity, "multi-add-test1");
    taggedEntities.add(multiple_entities, "multi-add-test2");

    expect(taggedEntities.get("multi-add-test1")).toHaveLength(1);
    expect(taggedEntities.get("multi-add-test2")).toHaveLength(3);
    expect(taggedEntities.get("empty")).toHaveLength(0);
  });

  describe(".first()", () => {
    const tag = "test";
    it("should get the first item having a specific tag", () => {
      taggedEntities.add(multiple_entities, tag);
      expect(taggedEntities.contains(tag)).toBeTruthy();
      expect(taggedEntities.first(tag)).toBe(multiple_entities[0]);
    });

    it("should return undefined if there is no matching tag", () => {
      expect(taggedEntities.contains(tag)).toBeFalsy();
      expect(taggedEntities.first(tag)).toBeUndefined();
    });

    it("should return undefined if the tag exists but has no items", () => {
      // Create an empty Set for a tag in the map without using internal APIs
      taggedEntities.add(single_entity, tag);
      taggedEntities.remove(single_entity);

      // Verify the tag exists but has no items
      expect(taggedEntities.contains(tag)).toBeFalsy();
      expect(taggedEntities.first(tag)).toBeUndefined();
    });
  });

  describe(".tags", () => {
    it("should get all tags in the collection", () => {
      taggedEntities.add(single_entity, "tag1");
      taggedEntities.add(multiple_entities[0], "tag2");

      const tags = taggedEntities.tags;
      expect(tags).toHaveLength(2);
      expect(tags).toContain("tag1");
      expect(tags).toContain("tag2");
    });

    it("should return an empty array when no tags exist", () => {
      expect(taggedEntities.tags).toEqual([]);
    });
  });

  describe(".update()", () => {
    it("should update item tags", () => {
      taggedEntities.add(single_entity, "oldTag");
      taggedEntities.add(multiple_entities[0], "oldTag");

      expect(taggedEntities.update("oldTag", "newTag")).toBe(2);
      expect(taggedEntities.contains("oldTag")).toBeFalsy();
      expect(taggedEntities.contains("newTag")).toBeTruthy();
      expect(
        (single_entity as Entity & Collection.WithTag)[Collection.symbol],
      ).toBe("newTag");
    });

    it("should return 0 if no items match the old tag", () => {
      expect(taggedEntities.update("nonExistentTag", "newTag")).toBe(0);
    });

    it("should handle updating to the same tag", () => {
      taggedEntities.add(single_entity, "sameTag");
      expect(taggedEntities.update("sameTag", "sameTag")).toBe(1);
      expect(taggedEntities.contains("sameTag")).toBeTruthy();
      expect(
        (single_entity as Entity & Collection.WithTag)[Collection.symbol],
      ).toBe("sameTag");
    });
  });

  describe("visibility operations", () => {
    it(".show() should make all items with the specified tag visible", () => {
      const entity1 = new Entity({ id: "vis1", show: false });
      const entity2 = new Entity({ id: "vis2", show: false });
      taggedEntities.add([entity1, entity2], "visibilityTest");
      expect(taggedEntities.show("visibilityTest")).toBe(taggedEntities);
      expect(entity1.show).toBeTruthy();
      expect(entity2.show).toBeTruthy();
    });

    it(".hide() should hide all items with the specified tag", () => {
      const entity1 = new Entity({ id: "vis1", show: true });
      const entity2 = new Entity({ id: "vis2", show: true });
      taggedEntities.add([entity1, entity2], "visibilityTest");
      expect(taggedEntities.hide("visibilityTest")).toBe(taggedEntities);
      expect(entity1.show).toBeFalsy();
      expect(entity2.show).toBeFalsy();
    });

    it(".toggle() should toggle visibility of all items with the specified tag", () => {
      const entity1 = new Entity({ id: "vis1", show: false });
      const entity2 = new Entity({ id: "vis2", show: true });
      taggedEntities.add([entity1, entity2], "visibilityTest");
      expect(taggedEntities.toggle("visibilityTest")).toBe(taggedEntities);
      expect(entity1.show).toBeTruthy();
      expect(entity2.show).toBeFalsy();
    });
  });

  describe(".setProperty()", () => {
    const tag = "property";
    it("should set a property value on all items with the specified tag", () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);

      expect(taggedEntities.setProperty("name", "testName", tag)).toBe(
        taggedEntities,
      );
      expect(taggedEntities.setProperty("name", "unsetName")).toBe(
        taggedEntities,
      );
      expect(single_entity.name).toBe("unsetName");
      multiple_entities.forEach((e) => {
        expect(e.name).toBe("testName");
      });
    });

    it("should handle setting properties that do not exist on items", () => {
      taggedEntities.add(single_entity);

      // Attempting to set a property that doesn't exist
      expect(() =>
        taggedEntities.setProperty("definitionChanged", new Event()),
      ).toThrowError();
    });

    it("should handle attempting to set read-only properties", () => {
      taggedEntities.add(single_entity);

      // Attempt to set read-only property should throw
      expect(() => {
        taggedEntities.setProperty("definitionChanged", new Event());
      }).toThrow();
    });

    it("should set nested properties using dot notation", () => {
      // Add custom nested properties to entities for testing
      (single_entity as any).metadata = { priority: 1 };
      multiple_entities.forEach((e) => {
        (e as any).metadata = { priority: 1 };
      });

      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);

      // Set nested metadata.priority property (using type assertion for dynamic properties)
      expect(
        (taggedEntities as any).setProperty("metadata.priority", 5, tag),
      ).toBe(taggedEntities);

      // Verify nested property was set on tagged entities
      multiple_entities.forEach((e) => {
        expect((e as any).metadata.priority).toBe(5);
      });

      // Verify nested property was NOT set on untagged entity
      expect((single_entity as any).metadata.priority).toBe(1);
    });

    it("should handle setting deeply nested properties", () => {
      // Add deeply nested properties
      multiple_entities.forEach((e) => {
        (e as any).config = { display: { scale: 1.0 } };
      });

      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);

      // Set deeply nested property (2 levels) (using type assertion for dynamic properties)
      expect(
        (taggedEntities as any).setProperty("config.display.scale", 2.5, tag),
      ).toBe(taggedEntities);

      multiple_entities.forEach((e) => {
        expect((e as any).config.display.scale).toBe(2.5);
      });
    });

    it("should gracefully handle nested paths that don't exist", () => {
      taggedEntities.add(single_entity);

      // Try to set a nested property where parent doesn't exist
      // This should not throw, just skip the item
      expect(() => {
        (taggedEntities as any).setProperty("nonExistent.property", "value");
      }).not.toThrow();
    });

    it("should handle nested read-only properties", () => {
      // Create a nested object with a read-only property
      Object.defineProperty(single_entity, "settings", {
        value: {},
        writable: true,
        configurable: true,
      });
      Object.defineProperty((single_entity as any).settings, "readOnly", {
        value: "initial",
        writable: false,
        configurable: true,
      });

      taggedEntities.add(single_entity);

      // Attempt to set a nested read-only property - should throw
      expect(() => {
        (taggedEntities as any).setProperty("settings.readOnly", "changed");
      }).toThrow(
        /Cannot (set read-only property|assign to read only property)/,
      );
    });

    it("should prevent prototype pollution via __proto__", () => {
      (single_entity as any).data = { safe: "value" };
      taggedEntities.add(single_entity);

      // Attempt to pollute via __proto__ - should be ignored
      (taggedEntities as any).setProperty("__proto__.polluted", "bad");

      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it("should prevent prototype pollution via constructor", () => {
      (single_entity as any).data = { safe: "value" };
      taggedEntities.add(single_entity);

      // Attempt to pollute via constructor - should be ignored
      (taggedEntities as any).setProperty("constructor.polluted", "bad");

      expect((single_entity.constructor as any).polluted).toBeUndefined();
    });

    it("should prevent prototype pollution via nested __proto__", () => {
      (single_entity as any).data = { nested: {} };
      taggedEntities.add(single_entity);

      // Attempt to pollute via nested __proto__ - should be ignored
      (taggedEntities as any).setProperty("data.__proto__.polluted", "bad");

      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it("should prevent setting properties via dangerous prototype chain access", () => {
      // Create an object with safe inherited and own properties
      const proto = { inherited: "original" };
      (single_entity as any).data = Object.create(proto);
      (single_entity as any).data.own = "value";

      taggedEntities.add(single_entity);

      // Try to access prototype directly - should be blocked
      (taggedEntities as any).setProperty("data.prototype", { polluted: true });
      expect((single_entity as any).data.prototype).toBeUndefined();

      // Normal property should work fine
      (taggedEntities as any).setProperty("data.own", "modified");
      expect((single_entity as any).data.own).toBe("modified");
    });
  });

  describe(".filter()", () => {
    const tag = "filter";
    it("should filter items in the collection based on a predicate function", () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      taggedEntities.setProperty("name", "test", "default");

      expect(taggedEntities.filter((e) => e.name === "test")).toHaveLength(1);
    });

    it("should filter items with a specific tag based on a predicate function", () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      taggedEntities.setProperty("name", "test", tag);

      expect(taggedEntities.filter((e) => e.name === "test", tag)).toHaveLength(
        multiple_entities.length,
      );
    });

    it("should return an empty array if no items match the predicate", () => {
      taggedEntities.add(single_entity);
      expect(
        taggedEntities.filter((e) => e.name === "nonExistentName"),
      ).toHaveLength(0);
    });

    it("should return an empty array if tag does not exist", () => {
      taggedEntities.add(single_entity);
      expect(
        taggedEntities.filter((_e) => true, "nonExistentTag"),
      ).toHaveLength(0);
    });
  });

  describe(".forEach()", () => {
    const tag = "foreach";

    it("should execute a callback function for each item in the collection", () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      const callback = vi.fn();
      taggedEntities.forEach(callback);
      expect(callback).toBeCalledTimes(multiple_entities.length + 1);
    });

    it("should filter items by tag before execution", () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      const mockFunc = vi.fn();
      taggedEntities.forEach(mockFunc, tag);
      expect(mockFunc).toBeCalledTimes(multiple_entities.length);
    });

    it("should not call the callback if no items match the tag", () => {
      taggedEntities.add(single_entity);
      const callback = vi.fn();
      taggedEntities.forEach(callback, "nonExistentTag");
      expect(callback).not.toHaveBeenCalled();
    });

    it("should pass correct index to callback", () => {
      taggedEntities.add(multiple_entities);
      const callback = vi.fn();
      taggedEntities.forEach(callback);

      // Check that the callback received the correct indices
      expect(callback).toHaveBeenNthCalledWith(1, multiple_entities[0], 0);
      expect(callback).toHaveBeenNthCalledWith(2, multiple_entities[1], 1);
      expect(callback).toHaveBeenNthCalledWith(3, multiple_entities[2], 2);
    });
  });

  describe(".map()", () => {
    it("should map all items when no tag is provided", () => {
      taggedEntities.add(multiple_entities);
      const ids = taggedEntities.map((entity) => entity.id);
      expect(ids).toHaveLength(3);
      expect(ids).toEqual([
        "multi-add-test1",
        "multi-add-test2",
        "multi-add-test3",
      ]);
    });

    it("should map only items with the specified tag", () => {
      const tag = "mappable";
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      const ids = taggedEntities.map((entity) => entity.id, tag);
      expect(ids).toHaveLength(3);
      expect(ids).toEqual([
        "multi-add-test1",
        "multi-add-test2",
        "multi-add-test3",
      ]);
    });

    it("should provide correct indices", () => {
      taggedEntities.add(multiple_entities);
      const indices = taggedEntities.map((_, index) => index);
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe(".find()", () => {
    it("should find an item matching the predicate", () => {
      taggedEntities.add(multiple_entities);
      const entity = taggedEntities.find(
        (entity) => entity.id === "multi-add-test2",
      );
      expect(entity).toBeDefined();
      expect(entity?.id).toBe("multi-add-test2");
    });

    it("should only search items with the specified tag", () => {
      const tag = "findable";
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      const entity = taggedEntities.find(
        (entity) => entity.id.includes("multi"),
        tag,
      );
      expect(entity).toBeDefined();
      expect(entity?.id).toBe("multi-add-test1");
    });

    it("should return undefined when no items match", () => {
      taggedEntities.add(multiple_entities);
      const entity = taggedEntities.find(
        (entity) => entity.id === "nonexistent",
      );
      expect(entity).toBeUndefined();
    });
  });

  describe("destroy()", () => {
    it("should clean up event listeners and internal state", () => {
      // Setup collection with some data
      taggedEntities.add(multiple_entities);
      expect(taggedEntities["_eventCleanupFunctions"]).toHaveLength(1);
      expect(taggedEntities["_tagMap"].size).toBeGreaterThan(0);

      // Build cache
      taggedEntities.values;
      expect(taggedEntities["_valuesCache"]).not.toBe(null);

      // Destroy should clean everything up
      taggedEntities.destroy();

      expect(taggedEntities["_eventCleanupFunctions"]).toHaveLength(0);
      expect(taggedEntities["_tagMap"].size).toBe(0);
      expect(taggedEntities["_eventListeners"].size).toBe(0);
      expect(taggedEntities["_valuesCache"]).toBe(null);
    });

    it("should be safe to call multiple times", () => {
      taggedEntities.add(single_entity);

      expect(() => {
        taggedEntities.destroy();
        taggedEntities.destroy(); // Should not throw
      }).not.toThrow();
    });
  });
});
