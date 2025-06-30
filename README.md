# Cesium Utils

[![npm version](https://img.shields.io/npm/v/@juun-roh/cesium-utils.svg)](https://www.npmjs.com/package/@juun-roh/cesium-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-typedoc-blue)](https://juunie-roh.github.io/cesium-utils/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/juunie-roh/cesium-utils/release-and-publish.yml)](https://github.com/juunie-roh/cesium-utils/actions)

A utility library for Cesium.js that simplifies working with collections, terrain providers and highlights.

[📚 API Documentation](https://juunie-roh.github.io/cesium-utils/) | [📦 NPM Package](https://www.npmjs.com/package/@juun-roh/cesium-utils) | [▶️ Demonstration](https://juun.vercel.app/cesium-utils)

## Installation

This library requires `cesium` to run.

```bash
# npm
npm install @juun-roh/cesium-utils cesium

# yarn
yarn add @juun-roh/cesium-utils cesium

# pnpm
pnpm add @juun-roh/cesium-utils cesium
```

## Browser Compatibility

This library works in both modern browsers and Node.js environments. It supports:

* ESM (ECMAScript modules)
* CommonJS (via a bundled .cjs file)

## Modular Exports

This library supports modular exports, enabling you to import only the functionality you need rather than the entire package. This helps reduce bundle size and improves build performance by explicitly avoiding unused code.

```typescript
// Import everything from the main package
import { Collection, Highlight, TerrainVisualizer } from "@juun-roh/cesium-utils";

// Or import specific modules to minimize bundle size
import { Collection } from "@juun-roh/cesium-utils/collection";
import { Highlight } from "@juun-roh/cesium-utils/highlight";
import { TerrainVisualizer } from "@juun-roh/cesium-utils/utils";
import { cloneViewer, syncCamera } from "@juun-roh/cesium-utils/viewer";
```

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

### Documentation

Generate API documentation:

```bash
pnpm typedoc
```

## License

MIT © Juun
