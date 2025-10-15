# Cesium Utils

[![GitHub](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](https://github.com/juunie-roh/cesium-utils)
[![npm version](https://img.shields.io/npm/v/@juun-roh/cesium-utils.svg?logo=npm&logoColor=fff&color=CB3837)](https://www.npmjs.com/package/@juun-roh/cesium-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=fff)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-typedoc-blue?logo=typescript&logoColor=fff&color=3178C6)](https://juunie-roh.github.io/cesium-utils/)

[![Build Status](https://img.shields.io/github/actions/workflow/status/juunie-roh/cesium-utils/release-and-publish.yml?logo=githubactions&logoColor=fff)](https://github.com/juunie-roh/cesium-utils/actions)
[![Changelog](https://img.shields.io/badge/changelog-releases-blue?logo=git&logoColor=fff&color=green)](https://github.com/juunie-roh/cesium-utils/releases)

TypeScript utility library for Cesium.js providing hybrid terrain providers, entity collection tagging, and visual highlighting systems.

> **Note**: The `HybridTerrainProvider` from this library is submitted to Cesium ([#12822](https://github.com/CesiumGS/cesium/pull/12822)).

[📚 Documentation](https://juunie-roh.github.io/cesium-utils/) • [📦 NPM](https://www.npmjs.com/package/@juun-roh/cesium-utils) • [▶️ Demo](https://juun.vercel.app/cesium-utils)

## Installation

```bash
npm install @juun-roh/cesium-utils cesium
```

## Usage

### HybridTerrainProvider

Combine multiple terrain providers for different geographic regions using tile coordinates:

```typescript
import { HybridTerrainProvider } from "@juun-roh/cesium-utils";

const tiles = new Map();
tiles.set(13, { x: [13963, 13967], y: [2389, 2393] });

const terrainProvider = new HybridTerrainProvider({
  regions: [{
    provider: await CesiumTerrainProvider.fromUrl("custom-terrain-url"),
    tiles
  }],
  defaultProvider: worldTerrain
});

viewer.terrainProvider = terrainProvider;
```

### Collection

Tagged entity collections with filtering capabilities:

```typescript
import { Collection } from "@juun-roh/cesium-utils";

const buildings = new Collection(viewer.entities, "buildings");
buildings.add({ position: coords, model: buildingModel });
buildings.show = false; // Hide all buildings
```

### Entity Highlighting

Visual highlighting with silhouette and surface effects:

```typescript
import { SilhouetteHighlight } from "@juun-roh/cesium-utils";

const highlight = new SilhouetteHighlight(viewer, {
  color: Color.YELLOW,
  size: 2.0
});
highlight.add(selectedEntity);
```

## Modules

| Module | Description |
|--------|-------------|
| `HybridTerrainProvider` | Combine multiple terrain providers by geographic region |
| `Collection` | Tagged entity collections with filtering |
| `SilhouetteHighlight` | Silhouette highlighting effects |
| `SurfaceHighlight` | Surface glow highlighting effects |
| `cloneViewer` | Duplicate viewer configurations |
| `syncCamera` | Synchronize cameras between viewers |

## Import Options

```typescript
// Tree-shakable imports (recommended)
import { HybridTerrainProvider } from "@juun-roh/cesium-utils/terrain";
import { Collection } from "@juun-roh/cesium-utils/collection";
import { SilhouetteHighlight } from "@juun-roh/cesium-utils/highlight";

// Main package imports
import { Collection, HybridTerrainProvider, SilhouetteHighlight } from "@juun-roh/cesium-utils";
```

## Development

```bash
pnpm install  # Install dependencies
pnpm build    # Build library
pnpm test     # Run tests
pnpm dev      # Start demo server
```

### Development Utilities

Additional utilities for advanced usage:

```typescript
import { Deprecate, TerrainVisualizer, isGetterOnly } from "@juun-roh/cesium-utils/dev";
```

### Experimental Features

⚠️ **Warning**: Experimental features use Cesium's internal APIs and may break in future versions.

```typescript
import Sunlight from "@juun-roh/cesium-utils/experimental/sunlight";

const sunlight = new Sunlight(viewer);
const result = sunlight.analyze(point, JulianDate.now());
```

## License

MIT © Juun
