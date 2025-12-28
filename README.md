# cesium-utils

[![NPM Version](https://img.shields.io/npm/v/%40juun-roh%2Fcesium-utils?logo=npm&logoColor=fff&color=168eff)](https://www.npmjs.com/package/@juun-roh/cesium-utils)
[![Build Status](https://img.shields.io/github/actions/workflow/status/juunie-roh/cesium-utils/release-and-publish.yml?logo=githubactions&logoColor=fff)](https://github.com/juunie-roh/cesium-utils/actions)
[![Changelog](https://img.shields.io/badge/changelog-releases-blue?logo=git&logoColor=fff&color=green)](https://github.com/juunie-roh/cesium-utils/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=fff)](https://opensource.org/licenses/MIT)

TypeScript utilities for [CesiumJS](https://cesium.com/cesiumjs/).

- **HybridTerrainProvider** — Combine multiple terrain sources by region
- **Collection** — Tag, filter, and batch-operate entity collections  
- **Highlight** — Visual feedback for picked objects
- **Sunlight** (Experimental) — Shadow analysis with ray-casting ⚠️ Uses internal APIs

> `HybridTerrainProvider` is submitted to Cesium ([#12822](https://github.com/CesiumGS/cesium/pull/12822))

[📚 Documentation](https://juunie-roh.github.io/cesium-utils/) · [▶️ Demo](https://juun.vercel.app/cesium-utils) · [📦 NPM](https://www.npmjs.com/package/@juun-roh/cesium-utils)

## Installation

```bash
npm install @juun-roh/cesium-utils cesium
```

## Compatibility

| Dependency | Version |
| ---------- | ------- |
| cesium | ^1.133.0 |

Tree-shakable imports available:

```typescript
// import holistically from main module
import { HybridTerrainProvider, Collection } from "@juun-roh/cesium-utils";
// import from separate modules
import { HybridTerrainProvider } from "@juun-roh/cesium-utils/terrain";
import { Collection } from "@juun-roh/cesium-utils/collection";
import { Highlight } from "@juun-roh/cesium-utils/highlight";

// Not exported in main module, must import explicitly
import { TerrainVisualizer } from "@juun-roh/cesium-utils/terrain/dev";
import { Sunlight } from "@juun-roh/cesium-utils/experimental";
```

## License

MIT © Juun
