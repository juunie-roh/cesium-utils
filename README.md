# Cesium Utils

Utilities to handle Cesium classes easier.

This package is published on [npm](https://www.npmjs.com/package/@juun_roh/cesium-utils).

### ES Modules Only

This package is provided as ES Modules only and does not support CommonJS. This means:

* You must use import syntax instead of require()
* Your project should support ES Modules
* Node.js users need version 14+ with either:
  - .mjs file extension
  - "type": "module" in package.json

## Installation

```bash
# npm
npm install @juun_roh/cesium-utils

# yarn
yarn add @juun_roh/cesium-utils

# pnpm
pnpm add @juun_roh/cesium-utils
```

## Features

### Collection

An abstract class that enhances Cesium collection objects with tagging functionality. This class provides a consistent API for working with different types of Cesium collections and allows grouping and manipulating collection items by custom tags.

## Usage

```typescript
import { Collection } from '@juun_roh/cesium-utils';
import { EntityCollection, Viewer, Entity } from 'cesium';

// Create a specialized collection for entities
class MyEntities extends Collection<EntityCollection, Entity> {
  constructor(viewer) {
    super({ collection: viewer.entities, tag: 'myEntities' });
  }
}

// Initialize with a Cesium viewer
const viewer = new Viewer('cesiumContainer');
const entities = new MyEntities(viewer.entities);

// Add entities with custom tags
entities.add(new Entity({ /* ... */ }), 'buildings');
entities.add(new Entity({ /* ... */ }), 'roads');

// Show/hide entities by tag
entities.show('buildings');
entities.hide('roads');

// Toggle visibility
entities.toggle('buildings');

// Get entities by tag
const buildings = entities.getByTag('buildings');

// Apply operations to all entities with a specific tag
entities.forEach((entity) => {
  // Do something with each entity
}, 'buildings');
```

## License

MIT © Juun