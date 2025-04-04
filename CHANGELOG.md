# @juun_roh/cesium-utils

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
