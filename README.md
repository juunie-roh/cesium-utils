# Cesium Utils

[![npm version](https://img.shields.io/npm/v/@juun_roh/cesium-utils.svg)](https://www.npmjs.com/package/@juun_roh/cesium-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-typedoc-blue)](https://juunie-roh.github.io/cesium-utils/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/juunie-roh/cesium-utils/npm-publish.yml)](https://github.com/juunie-roh/cesium-utils/actions)

Utilities to handle Cesium classes easier.

[📚 API Documentation](https://juunie-roh.github.io/cesium-utils/) | [📦 NPM Package](https://www.npmjs.com/package/@juun_roh/cesium-utils)

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