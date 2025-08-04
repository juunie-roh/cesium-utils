# Cesium Utils

[![npm version](https://img.shields.io/npm/v/@juun-roh/cesium-utils.svg)](https://www.npmjs.com/package/@juun-roh/cesium-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-typedoc-blue)](https://juunie-roh.github.io/cesium-utils/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/juunie-roh/cesium-utils/release-and-publish.yml)](https://github.com/juunie-roh/cesium-utils/actions)

**Solve common Cesium.js development challenges** with utilities that provide hybrid terrain providers, entity collection tagging, and visual highlighting systems.

## 🚀 Common Problems This Library Solves

### Multiple Terrain Sources (Hybrid Terrain Provider)

**Problem**: Cesium only supports one terrain provider at a time, but you need to combine multiple terrain sources.  
**Solution**: `HybridTerrainProvider` seamlessly blends different terrain providers for different geographic regions.

### Entity Collection Tagging and Filtering  

**Problem**: Cesium's EntityCollection lacks built-in tagging and filtering capabilities for large datasets.  
**Solution**: `Collection` class adds powerful tagging, filtering, and grouping to entity collections.

### Visual Entity Highlighting

**Problem**: No built-in way to highlight selected entities with silhouettes or surface effects.  
**Solution**: `SilhouetteHighlight` and `SurfaceHighlight` provide professional visual highlighting systems.

[📚 API Documentation](https://juunie-roh.github.io/cesium-utils/) | [📦 NPM Package](https://www.npmjs.com/package/@juun-roh/cesium-utils) | [▶️ Demonstration](https://juun.vercel.app/cesium-utils)

## Quick Start

```bash
npm install @juun-roh/cesium-utils cesium
```

### Hybrid Terrain Provider Example

Combine multiple terrain sources for different regions:

```typescript
import { HybridTerrainProvider } from "@juun-roh/cesium-utils";

// set region from zoom level and tile coordinates
const provider = TerrainProvider.fromUrl("your-terrain-url");
const tiles: HybridTerrainProvider.TerrainRegion["tiles"] = new Map();
tiles.set(13, {
  x: [13963, 13967],
  y: [2389, 2393],
});

const region: HybridTerrainProvider.TerrainRegion = {
  provider,
  tiles,
};

const terrainProvider = new HybridTerrainProvider({
  regions: [
    region,
  ],
  defaultProvider: worldTerrain
});

viewer.terrainProvider = terrainProvider;
```

### Entity Collection Tagging Example

Tag and filter entities efficiently:

```typescript
import { Collection } from "@juun-roh/cesium-utils";

const buildings = new Collection(viewer.entities, "buildings");
const parks = new Collection(viewer.entities, "parks");

// Add tagged entities
buildings.add({ position: coords, model: buildingModel });
parks.add({ position: coords, polygon: parkPolygon });

// Filter and manipulate by tag
buildings.show = false; // Hide all buildings
parks.forEach(entity => entity.polygon.material = Color.GREEN);
```

### Entity Highlighting Example

Add professional visual highlights:

```typescript
import { SilhouetteHighlight } from "@juun-roh/cesium-utils";

const highlight = new SilhouetteHighlight(viewer, {
  color: Color.YELLOW,
  size: 2.0
});

// Highlight an entity
highlight.add(selectedEntity);
```

## API Overview

| Feature | Module | Use Case |
|---------|--------|----------|
| **HybridTerrainProvider** | `terrain` | Combine multiple terrain sources by region |
| **Collection** | `collection` | Tag, filter, and group entity collections |
| **SilhouetteHighlight** | `highlight` | Add silhouette effects to entities |
| **SurfaceHighlight** | `highlight` | Add surface glow effects to entities |
| **cloneViewer** | `viewer` | Duplicate viewer configurations |
| **syncCamera** | `viewer` | Synchronize camera positions between viewers |

## Installation & Import Options

```bash
npm install @juun-roh/cesium-utils cesium
yarn add @juun-roh/cesium-utils cesium  
pnpm add @juun-roh/cesium-utils cesium
```

**Tree-shakable imports** (recommended for smaller bundles):

```typescript
// Import specific modules
import { HybridTerrainProvider } from "@juun-roh/cesium-utils/terrain";
import { Collection } from "@juun-roh/cesium-utils/collection";
import { SilhouetteHighlight } from "@juun-roh/cesium-utils/highlight";
```

**Convenience imports**:

```typescript
// Import everything
import { Collection, HybridTerrainProvider, SilhouetteHighlight } from "@juun-roh/cesium-utils";
```

**ESM and CommonJS support** - works in browsers and Node.js environments.

## Development Utilities

For development and testing purposes, this library provides additional utilities through the `/dev` module. These utilities include deprecation warnings, terrain visualization helpers, and type checking functions.

```typescript
// Import development utilities (not part of main API)
import { Deprecate, TerrainVisualizer, isGetterOnly } from "@juun-roh/cesium-utils/dev";
```

**Note**: These utilities are intentionally not exported from the main package as they are primarily intended for development, testing, and advanced terrain configuration.

For detailed usage and examples, see [Development Utilities Documentation](src/dev/README.md).

## Development

### Building

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

### Demonstration

Working on the demonstration at [Cesium Utils Demo](https://juun.vercel.app/cesium-utils).

Run a local live demonstration where you can see changes directly by:

```bash
pnpm dev
```

### Documentation

Generate API documentation:

```bash
pnpm typedoc
```

## License

MIT © Juun
