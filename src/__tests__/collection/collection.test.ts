import { Entity, EntityCollection } from 'cesium';
import { beforeEach, describe, expect, it } from 'vitest';

import { Collection, type WithTag } from '@/collection/index.js';

describe('Collection', () => {
  const baseEntities = new EntityCollection();
  const taggedEntities = new Collection({ collection: baseEntities });
  const single_entity = new Entity({ id: 'single' });
  const multiple_entities = [
    new Entity({ id: 'multi-add-test1' }),
    new Entity({ id: 'multi-add-test2' }),
    new Entity({ id: 'multi-add-test3' }),
  ];

  beforeEach(() => {
    taggedEntities.removeAll();
  });

  it('should create a collection with "default" tag', () => {
    expect(taggedEntities).toBeDefined();
    expect(taggedEntities).toBeInstanceOf(Collection);
    expect(baseEntities.values.length).toBe(0);
    taggedEntities.add(single_entity);
    expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(
      'default',
    );
  });

  it('should create a collection with a specific tag', () => {
    const tag = 'SpecificTagForNewCollection';
    const tmp = new Collection({ collection: new EntityCollection(), tag });
    tmp.add(single_entity);
    expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(tag);
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
    });
  });

  it('.values should return every items of the base collection', () => {
    baseEntities.add(single_entity);
    multiple_entities.forEach((entity) => {
      baseEntities.add(entity);
    });

    expect(taggedEntities.values).toEqual(baseEntities.values);
  });

  it('.length should get the number of all items in the base collection', () => {
    baseEntities.add(single_entity);
    multiple_entities.forEach((entity) => {
      baseEntities.add(entity);
    });

    expect(taggedEntities.length).toEqual(baseEntities.values.length);
  });

  it('.contains() should return the same value from the base collection method "contains"', () => {
    taggedEntities.add(single_entity);
    expect(taggedEntities.contains(single_entity)).toEqual(
      baseEntities.contains(single_entity),
    );
  });

  describe('.remove() should remove an item with a tag', () => {
    it('and return true if it successes', () => {
      taggedEntities.add(single_entity, 'testTag');
      expect(taggedEntities.remove(single_entity)).toBeTruthy();
      expect(baseEntities.values.length).toBe(0);
    });

    it('and return false if it fails', () => {
      expect(taggedEntities.remove(single_entity)).toBeFalsy();
    });
  });

  it('.getByTag() should get items by tag', () => {
    taggedEntities.add(single_entity, 'multi-add-test1');
    taggedEntities.add(multiple_entities, 'multi-add-test2');

    const tagged1 = taggedEntities.getByTag('multi-add-test1');
    const tagged2 = taggedEntities.getByTag('multi-add-test2');

    expect(tagged1).toHaveLength(1);
    expect(tagged2).toHaveLength(3);
  });

  it('.getTags() should get all tags in the collection', () => {
    taggedEntities.add(single_entity, 'tag1');
    taggedEntities.add(multiple_entities[0], 'tag2');

    const tags = taggedEntities.getTags();
    expect(tags).toHaveLength(2);
    expect(tags).toContain('tag1');
    expect(tags).toContain('tag2');
  });

  it('.hasTag() should check if a tag exists', () => {
    taggedEntities.add(single_entity, 'existingTag');

    expect(taggedEntities.hasTag('existingTag')).toBeTruthy();
    expect(taggedEntities.hasTag('nonExistingTag')).toBeFalsy();
  });

  it('.updateTag() should update item tags', () => {
    taggedEntities.add(single_entity, 'oldTag');
    taggedEntities.add(multiple_entities[0], 'oldTag');

    expect(taggedEntities.updateTag('oldTag', 'newTag')).toBe(2);
    expect(taggedEntities.hasTag('oldTag')).toBeFalsy();
    expect(taggedEntities.hasTag('newTag')).toBeTruthy();
    expect((single_entity as Entity & WithTag)[Collection.symbol]).toBe(
      'newTag',
    );
  });

  describe('should able to handle "show" property of each items by tag', () => {
    it('.show()', () => {
      const entity1 = new Entity({ id: 'vis1', show: false });
      const entity2 = new Entity({ id: 'vis2', show: false });
      taggedEntities.add([entity1, entity2], 'visibilityTest');
      expect(taggedEntities.show('visibilityTest')).toBe(2);
      expect(entity1.show).toBeTruthy();
      expect(entity2.show).toBeTruthy();
    });
    it('.hide()', () => {
      const entity1 = new Entity({ id: 'vis1', show: false });
      const entity2 = new Entity({ id: 'vis2', show: false });
      taggedEntities.add([entity1, entity2], 'visibilityTest');
      expect(taggedEntities.hide('visibilityTest')).toBe(2);
      expect(entity1.show).toBeFalsy();
      expect(entity2.show).toBeFalsy();
    });
  });
});
