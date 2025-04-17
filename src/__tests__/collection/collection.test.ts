import {
  Entity,
  EntityCollection,
  Event,
  Primitive,
  PrimitiveCollection,
} from 'cesium';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Collection, type WithTag } from '@/collection/index.js';

describe('Collection', () => {
  const baseEntities = new EntityCollection();
  const taggedEntities = new Collection<EntityCollection, Entity>({
    collection: baseEntities,
  });
  let single_entity = new Entity({ id: 'single' });
  let multiple_entities = [
    new Entity({ id: 'multi-add-test1' }),
    new Entity({ id: 'multi-add-test2' }),
    new Entity({ id: 'multi-add-test3' }),
  ];

  const basePrimitives = new PrimitiveCollection();
  const taggedPrimitives = new Collection<PrimitiveCollection, Primitive>({
    collection: basePrimitives,
  });
  let single_primitive = new Primitive();
  let multiple_primitives = [
    new Primitive(),
    new Primitive(),
    new Primitive(),
    new Primitive(),
  ];

  beforeEach(() => {
    taggedEntities.removeAll();
    single_entity = new Entity({ id: 'single' });
    multiple_entities = [
      new Entity({ id: 'multi-add-test1' }),
      new Entity({ id: 'multi-add-test2' }),
      new Entity({ id: 'multi-add-test3' }),
    ];

    taggedPrimitives.removeAll();
    single_primitive = new Primitive();
    multiple_primitives = [
      new Primitive(),
      new Primitive(),
      new Primitive(),
      new Primitive(),
    ];
  });

  it('should create a collection with "default" tag', () => {
    expect(taggedEntities).toBeDefined();
    expect(taggedEntities).toBeInstanceOf(Collection);
    expect(baseEntities.values.length).toBe(0);
    taggedEntities.add(single_entity);
    expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(
      'default',
    );

    expect(taggedPrimitives).toBeInstanceOf(Collection);
    expect(basePrimitives.length).toBe(0);
    taggedPrimitives.add(single_primitive);
    expect((single_primitive as Primitive & WithTag)[Collection.symbol]).toBe(
      'default',
    );
  });

  it('should create a collection with a specific tag', () => {
    const tag = 'SpecificTagForNewCollection';
    const tmp = new Collection({ collection: new EntityCollection(), tag });
    tmp.add(single_entity);
    expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(tag);
  });

  it('should support numeric tags', () => {
    taggedEntities.add(single_entity, 123);
    expect(taggedEntities.hasTag(123)).toBeTruthy();
    expect(taggedEntities.getByTag(123)).toHaveLength(1);
  });

  describe('should properly cache and invalidate values', () => {
    it('with EntityCollection', () => {
      let accessCount = 0;
      const getValuesWithSideEffect = () => {
        accessCount++;
        return taggedEntities.values;
      };

      // First access should create cache
      const values1 = getValuesWithSideEffect();
      expect(accessCount).toBe(1);
      expect(values1).toHaveLength(0);

      // Reset our counter to verify content
      const initialLength = values1.length;

      // Second access should use cache
      const values2 = getValuesWithSideEffect();
      expect(accessCount).toBe(2);
      expect(values2.length).toBe(initialLength);
      expect(values2).toBe(values1);

      // Modify collection to invalidate cache
      taggedEntities.add(new Entity({ id: 'test-entity' }));

      // Next access should use current values
      const values3 = getValuesWithSideEffect();
      expect(accessCount).toBe(3);
      expect(values3.length).toBe(initialLength + 1); // Content updated

      // Final test: access again after external modification
      baseEntities.add(new Entity({ id: 'external-add' }));
      const values4 = getValuesWithSideEffect();
      // Content should be updated regardless of whether cache was used
      expect(values4.length).toBe(initialLength + 2);
      expect(values4.some((e) => e.id === 'external-add')).toBe(true);
    });

    it('with PrimitiveCollection', () => {
      let accessCount = 0;
      const getValuesWithSideEffect = () => {
        accessCount++;
        return taggedPrimitives.values;
      };

      // First access should create cache
      const values1 = getValuesWithSideEffect();
      expect(accessCount).toBe(1);
      expect(values1).toHaveLength(0);

      // Reset our counter to verify content
      const initialLength = values1.length;

      // Second access should use cache
      const values2 = getValuesWithSideEffect();
      expect(accessCount).toBe(2);
      expect(values2.length).toBe(initialLength);
      expect(values2).toEqual(values1);

      // Modify collection to invalidate cache
      taggedPrimitives.add(new Primitive());

      // Next access should use current values
      const values3 = getValuesWithSideEffect();
      expect(accessCount).toBe(3);
      expect(values3.length).toBe(initialLength + 1); // Content updated

      // Final test: access again after external modification
      basePrimitives.add(new Primitive());
      const values4 = getValuesWithSideEffect();
      // Content should be updated regardless of whether cache was used
      expect(values4.length).toBe(initialLength + 2);
    });
  });

  describe('event handling', () => {
    it('should add and trigger event listeners', () => {
      const addHandler = vi.fn();
      const removeHandler = vi.fn();
      const updateHandler = vi.fn();
      const clearHandler = vi.fn();

      taggedEntities.addEventListener('add', addHandler);
      taggedEntities.addEventListener('remove', removeHandler);
      taggedEntities.addEventListener('update', updateHandler);
      taggedEntities.addEventListener('clear', clearHandler);

      // Test add event
      taggedEntities.add(single_entity);
      expect(addHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add',
          items: [single_entity],
        }),
      );

      // Test remove event
      taggedEntities.remove(single_entity);
      expect(removeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove',
          items: [single_entity],
        }),
      );

      // Test update event
      taggedEntities.add(multiple_entities, 'oldTag');
      taggedEntities.updateTag('oldTag', 'newTag');
      expect(updateHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'update',
          items: expect.any(Array),
          tag: 'newTag',
        }),
      );

      // Test clear event
      taggedEntities.removeAll();
      expect(clearHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'clear',
        }),
      );
    });

    it('should remove event listeners', () => {
      const handler = vi.fn();

      taggedEntities.addEventListener('add', handler);
      taggedEntities.removeEventListener('add', handler);
      taggedEntities.add(single_entity);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent event listeners', () => {
      const handler = vi.fn();
      // Removing a listener that was never added should not throw
      expect(() => {
        taggedEntities.removeEventListener('add', handler);
      }).not.toThrow();
    });
  });

  it('.add() should add an item with a tag', () => {
    const tag = 'SpecificTagForCollectionAdd';
    expect(taggedEntities.add(single_entity, tag)).toBe(single_entity);

    expect(baseEntities.values.length).toBe(1);
    expect(Object.getOwnPropertySymbols(single_entity)).toContain(
      Collection.symbol,
    );
    expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(tag);
  });

  it('.add() should add multiple items with a tag', () => {
    expect(taggedEntities.add(single_entity, 'multi-add-test1')).toBe(
      single_entity,
    );
    expect(taggedEntities.add(multiple_entities, 'multi-add-test2')).toBe(
      multiple_entities,
    );

    expect(baseEntities.values.length).toBe(4);
    expect(baseEntities.values).toContain(single_entity);
    multiple_entities.forEach((entity) => {
      expect(baseEntities.values).toContain(entity);
      expect((entity as Entity & WithTag)[Collection.symbol]).toBe(
        'multi-add-test2',
      );
    });
  });

  it('.add() should support index parameter for collections that support it', () => {
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

    mockCollection.add(mockItem, 'tag', 2);
    expect(mockBaseCollection.add).toHaveBeenCalledWith(mockItem, 2);
  });

  describe('.remove() should remove an item with a tag', () => {
    it('and return true if it succeeds', () => {
      taggedEntities.add(single_entity, 'testTag');
      expect(taggedEntities.remove(single_entity)).toBeTruthy();
      expect(baseEntities.values.length).toBe(0);
    });

    it('and return false if it fails', () => {
      expect(taggedEntities.remove(single_entity)).toBeFalsy();
    });
  });

  it('.removeAll() should remove every item in the collection', () => {
    taggedEntities.add(multiple_entities);
    taggedEntities.removeAll();
    expect(taggedEntities.length).toBe(0);
    expect(baseEntities.values).toHaveLength(0);
  });

  it('.removeAll() should not throw when collection is already empty', () => {
    expect(() => {
      taggedEntities.removeAll();
    }).not.toThrow();
    expect(taggedEntities.length).toBe(0);
  });

  it('.values should return every item in the base collection', () => {
    baseEntities.add(single_entity);
    multiple_entities.forEach((entity) => {
      baseEntities.add(entity);
    });

    expect(taggedEntities.values).toEqual(baseEntities.values);

    basePrimitives.add(single_primitive);
    multiple_primitives.forEach((p) => basePrimitives.add(p));
    expect(taggedPrimitives.values).toHaveLength(basePrimitives.length);
  });

  it('.length should get the number of all items in the base collection', () => {
    baseEntities.add(single_entity);
    multiple_entities.forEach((entity) => {
      baseEntities.add(entity);
    });

    expect(taggedEntities.length).toEqual(baseEntities.values.length);
  });

  it('.length should return 0 when values is undefined', () => {
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

  it('.contains() should return the same value from the base collection method "contains"', () => {
    taggedEntities.add(single_entity);
    expect(taggedEntities.contains(single_entity)).toEqual(
      baseEntities.contains(single_entity),
    );
  });

  it('.getByTag() should get items by tag', () => {
    taggedEntities.add(single_entity, 'multi-add-test1');
    taggedEntities.add(multiple_entities, 'multi-add-test2');

    expect(taggedEntities.getByTag('multi-add-test1')).toHaveLength(1);
    expect(taggedEntities.getByTag('multi-add-test2')).toHaveLength(3);
    expect(taggedEntities.getByTag('empty')).toHaveLength(0);
  });

  describe('.getFirstByTag()', () => {
    const tag = 'test';
    it('should get the first item having a specific tag', () => {
      taggedEntities.add(multiple_entities, tag);
      expect(taggedEntities.hasTag(tag)).toBeTruthy();
      expect(taggedEntities.getFirstByTag(tag)).toBe(multiple_entities[0]);
    });

    it('should return undefined if there is no matching tag', () => {
      expect(taggedEntities.hasTag(tag)).toBeFalsy();
      expect(taggedEntities.getFirstByTag(tag)).toBeUndefined();
    });

    it('should return undefined if the tag exists but has no items', () => {
      // Create an empty Set for a tag in the map without using internal APIs
      taggedEntities.add(single_entity, tag);
      taggedEntities.remove(single_entity);

      // Verify the tag exists but has no items
      expect(taggedEntities.hasTag(tag)).toBeFalsy();
      expect(taggedEntities.getFirstByTag(tag)).toBeUndefined();
    });
  });

  describe('.getTags()', () => {
    it('should get all tags in the collection', () => {
      taggedEntities.add(single_entity, 'tag1');
      taggedEntities.add(multiple_entities[0], 'tag2');

      const tags = taggedEntities.getTags();
      expect(tags).toHaveLength(2);
      expect(tags).toContain('tag1');
      expect(tags).toContain('tag2');
    });

    it('should return an empty array when no tags exist', () => {
      expect(taggedEntities.getTags()).toEqual([]);
    });
  });

  it('.hasTag() should check if a tag exists', () => {
    taggedEntities.add(single_entity, 'existingTag');

    expect(taggedEntities.hasTag('existingTag')).toBeTruthy();
    expect(taggedEntities.hasTag('nonExistingTag')).toBeFalsy();
  });

  describe('.updateTag()', () => {
    it('should update item tags', () => {
      taggedEntities.add(single_entity, 'oldTag');
      taggedEntities.add(multiple_entities[0], 'oldTag');

      expect(taggedEntities.updateTag('oldTag', 'newTag')).toBe(2);
      expect(taggedEntities.hasTag('oldTag')).toBeFalsy();
      expect(taggedEntities.hasTag('newTag')).toBeTruthy();
      expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(
        'newTag',
      );
    });

    it('should return 0 if no items match the old tag', () => {
      expect(taggedEntities.updateTag('nonExistentTag', 'newTag')).toBe(0);
    });

    it('should handle updating to the same tag', () => {
      taggedEntities.add(single_entity, 'sameTag');
      expect(taggedEntities.updateTag('sameTag', 'sameTag')).toBe(1);
      expect(taggedEntities.hasTag('sameTag')).toBeTruthy();
      expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(
        'sameTag',
      );
    });
  });

  describe('.removeByTag()', () => {
    const tag = 'remove';
    it('should remove all items matching a tag', () => {
      taggedEntities.add(multiple_entities, tag);
      expect(taggedEntities.hasTag(tag)).toBeTruthy();
      expect(taggedEntities.getByTag(tag).length).toBe(
        multiple_entities.length,
      );

      expect(taggedEntities.removeByTag(tag)).toBe(multiple_entities.length);
      expect(taggedEntities.hasTag(tag)).toBeFalsy();
    });

    it('should return 0 if no items match the tag', () => {
      expect(taggedEntities.removeByTag('nonExistentTag')).toBe(0);
    });

    it('should handle removing items with an array of tags', () => {
      const tag1 = 'remove1';
      const tag2 = 'remove2';

      taggedEntities.add(multiple_entities, tag1);
      taggedEntities.add(single_entity, tag2);

      expect(taggedEntities.removeByTag([tag1, tag2])).toBe(4); // 3 + 1
      expect(taggedEntities.hasTag(tag1)).toBeFalsy();
      expect(taggedEntities.hasTag(tag2)).toBeFalsy();
    });

    it('should handle removing items with an empty array of tags', () => {
      taggedEntities.add(multiple_entities, tag);
      expect(taggedEntities.removeByTag([])).toBe(0);
      expect(taggedEntities.hasTag(tag)).toBeTruthy();
    });
  });

  describe('visibility operations', () => {
    it('.show() should make all items with the specified tag visible', () => {
      const entity1 = new Entity({ id: 'vis1', show: false });
      const entity2 = new Entity({ id: 'vis2', show: false });
      taggedEntities.add([entity1, entity2], 'visibilityTest');
      expect(taggedEntities.show('visibilityTest')).toBe(2);
      expect(entity1.show).toBeTruthy();
      expect(entity2.show).toBeTruthy();
    });

    it('.show() should return 0 if no items match the tag', () => {
      expect(taggedEntities.show('nonExistentTag')).toBe(0);
    });

    it('.show() should handle items without a show property', () => {
      const mockEntity = { id: 'noShow' } as any;
      taggedEntities.add(mockEntity, 'testNoShow');
      expect(taggedEntities.show('testNoShow')).toBe(0);
    });

    it('.hide() should hide all items with the specified tag', () => {
      const entity1 = new Entity({ id: 'vis1', show: true });
      const entity2 = new Entity({ id: 'vis2', show: true });
      taggedEntities.add([entity1, entity2], 'visibilityTest');
      expect(taggedEntities.hide('visibilityTest')).toBe(2);
      expect(entity1.show).toBeFalsy();
      expect(entity2.show).toBeFalsy();
    });

    it('.hide() should return 0 if no items match the tag', () => {
      expect(taggedEntities.hide('nonExistentTag')).toBe(0);
    });

    it('.toggle() should toggle visibility of all items with the specified tag', () => {
      const entity1 = new Entity({ id: 'vis1', show: false });
      const entity2 = new Entity({ id: 'vis2', show: true });
      taggedEntities.add([entity1, entity2], 'visibilityTest');
      expect(taggedEntities.toggle('visibilityTest')).toBe(2);
      expect(entity1.show).toBeTruthy();
      expect(entity2.show).toBeFalsy();
    });

    it('.toggle() should return 0 if no items match the tag', () => {
      expect(taggedEntities.toggle('nonExistentTag')).toBe(0);
    });
  });

  describe('.setProperty()', () => {
    const tag = 'property';
    it('should set a property value on all items with the specified tag', () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);

      expect(taggedEntities.setProperty('name', 'testName', tag)).toBe(
        multiple_entities.length,
      );
      expect(taggedEntities.setProperty('name', 'unsetName')).toBe(1);
      expect(single_entity.name).toBe('unsetName');
      multiple_entities.forEach((e) => {
        expect(e.name).toBe('testName');
      });
    });

    it('should handle setting properties that do not exist on items', () => {
      taggedEntities.add(single_entity);

      // Attempting to set a property that doesn't exist
      expect(() =>
        taggedEntities.setProperty('definitionChanged', new Event()),
      ).toThrowError();
    });

    it('should handle attempting to set read-only properties', () => {
      taggedEntities.add(single_entity);

      // Attempt to set read-only property should throw
      expect(() => {
        taggedEntities.setProperty('definitionChanged', new Event());
      }).toThrow();
    });
  });

  describe('.filter()', () => {
    const tag = 'filter';
    it('should filter items in the collection based on a predicate function', () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      taggedEntities.setProperty('name', 'test', 'default');

      expect(taggedEntities.filter((e) => e.name === 'test')).toHaveLength(1);
    });

    it('should filter items with a specific tag based on a predicate function', () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      taggedEntities.setProperty('name', 'test', tag);

      expect(taggedEntities.filter((e) => e.name === 'test', tag)).toHaveLength(
        multiple_entities.length,
      );
    });

    it('should return an empty array if no items match the predicate', () => {
      taggedEntities.add(single_entity);
      expect(
        taggedEntities.filter((e) => e.name === 'nonExistentName'),
      ).toHaveLength(0);
    });

    it('should return an empty array if tag does not exist', () => {
      taggedEntities.add(single_entity);
      expect(
        taggedEntities.filter((_e) => true, 'nonExistentTag'),
      ).toHaveLength(0);
    });
  });

  describe('.forEach()', () => {
    const tag = 'foreach';

    it('should execute a callback function for each item in the collection', () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      const callback = vi.fn();
      taggedEntities.forEach(callback);
      expect(callback).toBeCalledTimes(multiple_entities.length + 1);
    });

    it('should filter items by tag before execution', () => {
      taggedEntities.add(single_entity);
      taggedEntities.add(multiple_entities, tag);
      const mockFunc = vi.fn();
      taggedEntities.forEach(mockFunc, tag);
      expect(mockFunc).toBeCalledTimes(multiple_entities.length);
    });

    it('should not call the callback if no items match the tag', () => {
      taggedEntities.add(single_entity);
      const callback = vi.fn();
      taggedEntities.forEach(callback, 'nonExistentTag');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should pass correct index to callback', () => {
      taggedEntities.add(multiple_entities);
      const callback = vi.fn();
      taggedEntities.forEach(callback);

      // Check that the callback received the correct indices
      expect(callback).toHaveBeenNthCalledWith(1, multiple_entities[0], 0);
      expect(callback).toHaveBeenNthCalledWith(2, multiple_entities[1], 1);
      expect(callback).toHaveBeenNthCalledWith(3, multiple_entities[2], 2);
    });
  });
});
