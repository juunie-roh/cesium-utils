# Cesium Utils

[![npm version](https://img.shields.io/npm/v/@juun-roh/cesium-utils.svg)](https://www.npmjs.com/package/@juun-roh/cesium-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-typedoc-blue)](https://juunie-roh.github.io/cesium-utils/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/juunie-roh/cesium-utils/release-and-publish.yml)](https://github.com/juunie-roh/cesium-utils/actions)

A utility library for Cesium.js that simplifies working with collections and terrain providers.

[📚 API Documentation](https://juunie-roh.github.io/cesium-utils/) | [📦 NPM Package](https://www.npmjs.com/package/@juun-roh/cesium-utils) | [▶️ Cesium Utils Demo](https://juun.vercel.app/cesium-utils)

## Installation

```bash
# npm
npm install @juun-roh/cesium-utils

# yarn
yarn add @juun-roh/cesium-utils

# pnpm
pnpm add @juun-roh/cesium-utils
```

## Browser Compatibility

This library works in both modern browsers and Node.js environments. It supports:

* ESM (ECMAScript modules)
* CommonJS (via a bundled .cjs file)

## Modular Exports

This library supports modular exports, which enables for you to import only needed modules.
Though this library is about 140kB, you can minimize the size for importing this library.

```typescript
// This imports all modules of the package
import { Collection } from "@juun-roh/cesium-utils";
// To minimize the imported modules size, try this:
import { Highlight } from "@juun-roh/cesium-utils/highlight";
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
