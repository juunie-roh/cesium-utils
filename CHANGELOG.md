# @juun_roh/cesium-utils

## 0.0.18

### Patch Changes

- 10a2de1: Build Configurations Update

  build: Update configurations and workflows

  - No longer exports separated @types.
    types are integrated in dist instead.

  - Documentation now occurs after the build.

  - Automate workflows to create release notes from changelog.

## 0.0.17

### Patch Changes

- 4c55a60: Type compatibility updates

  fix: Fix initializing strategy

  - Fix initializing method of this class.
    Remove `_initialize` method.
    The static method `create` now handles all the asynchronous functions.
    The constructor now receives initialized instances.

  - Match return type of `requestTileGeometry` with Cesium
    Since the method does not await `_ready` anymore, it is now synchronous.
    Disable the `@ts-expect-error` suppression.

  fix: Fix initializing method

  - Reconstruct initializing method of this class.
    The member `_ready` will always be `true` when the constructor is called.
    The static method `create` now handles all the asynchronous functions.

  - Match return types of method `requestTileGeometry` with Cesium.
    Since the method no longer awaits for member `_ready`, it is now synchronous.

  refactor: Rename member, set default value show function

  - Rename `activeLevel` as `level`
  - Set default parameter value to 15 in method `show`

## 0.0.16

### Patch Changes

- 700c2a6: Updates

  feat: Replace boundaries with tile coordinates layer

  - Add `_tileCoordinatesLayer` to handle `TileCoordinatesImagery` instance.
    Tile boundaries will show up by the imagery layer.
    (outline property is unable to use with clamp-to-ground)

  - Fix coloring method of each tiles in `getTileColor`.
    `forEach` doesn't return properly.

  - Rename methods and members.
    Since boundary-related methods has been replaced, simplified names.

  refactor: Add internal class, rename member, fix method

  - Internal `TerrainAreaCollection` class to provide:
    An array of `TerrainArea` by calling itself.
    Utility functions as methods.

  - Rename `_defaultProvider` as `_terrainProvider`.
  - Fix `requestTileGeometry` to return undefined correctly.

  refactor: Separate test codes with default viewer settings
  refactor: Remove redundant method, redefine type with Awaited

  - Remove `ensureReady` method.
  - Fix type definitions with `Promise`s to have proper resolved types using `Awaited` utility type.

  refactor: Calculate the largest rectangle from max to min levels

## 0.0.15

### Patch Changes

- 8005e50: Testing environment updates

  fix: Fix not iterable problem

  test: Add cesium viewer testing environment with vite

  test: Remove self-dependency, refer dist directory instead

  - Removed Self reference from npm, now it tests from `dist` directly

## 0.0.14

### Patch Changes

- e3fae44: Bug Fixes

  fix: Fix errors occurred from test

  - Fix invalid `Object.defineProperty` to use proper property descriptor object. (Collection.add)
  - Fix failure using spread operator against Set, use Array instead. (TerrainBounds.\_calculateRectangleFromTileRanges)

## 0.0.13

### Patch Changes

- 58a8376: Refactor and bug fixes

  refactor: Reconstructed terrain visualizer

  - Expand namespace
    Now supports `createRectangle`, `visualize` features from the namespace `TerrainVisualizer`.

  - Add getters for private members.
  - Add documentations.

  fix: Fix inconsistent return value

  - Corrected the handling method of overloaded `removeByTag` method.

  refactor(types): Redefined tile range type

  - Redefined `TileRanges` type, separated with `TileRange`.

  chore: Fix typo (tilinghScheme)

## 0.0.12

### Patch Changes

- 4abf787: Build configuration updates

  - Add `tsup.config.js` that specifies build configuration.

## 0.0.11

### Patch Changes

- 702a15b: File Entry Update

## 0.0.10

### Patch Changes

- 685caac: feat: Redefine types, add overload for `removeByTag` function

  - Fix types, now adds tag into the item using `Object.defineProperty`.
  - Fix `add` function to recursively call itself, simplifying the code structure.
  - Add overloads for `removeByTag` method. It now support multiple tags removal.

  feat: Add hybrid terrain provider feature

  - `TerrainBounds` class:
    Defines the geographic boundaries for a terrain area and handles tile availability checks.

  - `TerrainArea` class:
    Represents a geographic area with a specific terrain provider.

  - `HybridTerrainProvider` class:
    Provides terrain by delegating requests to different terrain providers
    based on geographic regions and zoom levels.

  - `TerrainVisualizer` class:
    A class for debugging `HybridTerrainProvider`. It shows which area is provided by which provider.

## 0.0.9

### Patch Changes

- 71fb02c: Documentation Updates

  - Add typedoc.json for typedoc configuration
  - Add badges on readme
  - Change commit comments on changeset update action.

## 0.0.8

### Patch Changes

- 470ec59: Integrate Typedoc

## 0.0.7

### Patch Changes

- Change build stage

  - Update pnpm version to 10.7.0
  - Update build stages:  
    Use tsup  
    Create declaration files under @types
  - Update ignore settings

## 0.0.6

### Patch Changes

- c91f81a: Performance improvements and refactoring

  - Type Guard Utility

    - `hasProperty`: Supports type guard to determine if an item has a specific property that is not undefined.

  - Event Subscription

    - add and remove events: Further enhancement is needed.

  - Item List Cache

    - Caches the item list on `values` executes.

  - Mapped Tags
    - Controls tagged items internally for faster lookups.

## 0.0.5

### Patch Changes

- 93f58c6: Revert github registry, return to npm.

## 0.0.4

### Patch Changes

- abdcbcf: Update package registry

  - The package registry has specified to [GitHub Packages](https://npm.pkg.github.com/)

## 0.0.2

### Patch Changes

- 71242df: Initial Release
