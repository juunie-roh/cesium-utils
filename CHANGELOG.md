# @juun_roh/cesium-utils

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
    Create delcaration files under @types
  - Update ignore settings

## 0.0.6

### Patch Changes

- c91f81a: Performance improvements and refactoring

  - Type Guard Utility

    - `hasProperty`: Supports type guard to determine if an item has a specific property that is not undefined.

  - Event Subscribtion

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
