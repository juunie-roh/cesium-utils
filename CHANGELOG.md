# @juun-roh/cesium-utils

## 0.0.17

### Patch Changes

- cb5c839: Update Surface Highlight Test

  test: Update surface highlight test

  - Add edge cases to expand test coverage.

  - Add testing on error cases.

  - Add test for `destroy` method, a method for self-clean-up.

- e40b7d1: Update Highlight classes

  refactor: Update highlight classes

  **`Highlight`:**

  - Replace type of `instances` from `Map` to `WeackMap`.

  - Remove handling `ModelGraphics` type.
    Now determines the type(2D or 3D) of an entity by the presence of it's `model` property.

  - Add descriptions.

  **`SilhouetteHighlight`:**

  - Replace `_model` having `ModelGraphics` type with `_entity` having `Entity` type.

- bc825f3: Update Highlight

  fix: Update highlight

  - Define `options` type in separate file.

  - Add missing parameter.

  - Implement `destroy` method for self clean up.

- 207eaf4: Update Package Exports

  build: Updata package exports

  - Specify modular export for highlight class

## 0.0.16

### Patch Changes

- 1e2f09c: Redefine Highlight Class

  feat: Redefine highlight class

  To support highlighting 3D objects, the class has been redefined.

  - Separate multiton handler as a wrapper of the former Highlight class.
    The former class is renamed as `SurfaceHighlight`.
    The former class is now a member of new wrapper class `Highlight`.

  - Add `SilhouetteHighlight` class to handle 3d objects.
    This class is able to display outlined highlights on `Cesium3DTileFeature` and `Model` objects.
    Also a member of new wrapper class `Highlight`.

  NOTE: Feature migration is under process. There are some mismatches and missing parts in documents and tests.

## 0.0.15

### Patch Changes

- 32e4fe8: Document

  docs: Update usage example

  - Specify the collection class example along with the intention of it's development

## 0.0.14

### Patch Changes

- 34c9593: Test Coverage Expansion

  test: Update test for highlight class

  - Refactoring Highlight class:
    Simplify names of private members.

    - `_highlightEntity` to `_entity`
    - `_viewerEntities` to `_entities`

    Remove validation about `_entity` is defined.
    `_entity` is initialized in constructor, thus there is no need to check if the `_entity` is `undefined`.

  - Test coverage improvements:
    Now the highlight test is covered 100%.

## 0.0.13

### Patch Changes

- b702387: Lightweight Highlight Implementation

  refactor: Replace collection-based highlight with flyweight pattern

  - Architectural Changes
    Flyweight Pattern: Implement the flyweight pattern with a single entity per viewer instance instead of creating a new entity for each highlight.
    Memory Efficiency: Remove the entity collection and active highlights tracking, dramatically reducing memory overhead.
    Property-based Updates: Use Cesium's property system to update the highlight entity in-place rather than creating new entities.

  - API Improvements
    Type Safety: Add proper TypeScript method overloads for the \_update method, making the API more type-safe.
    Better Error Handling: Improve error handling throughout the class to prevent failures when working with complex geometries.
    Rename Methods: Change method names to better reflect their function.

  >     `add` → `show`
  >     `remove` → `hide`
  >     `removeAll` → now handled by hide
  >     `_createEntity` → `_update`

  - Feature Enhancements
    Geometry Cleanup: Properly clear all geometries between highlights to prevent artifacts.
    Outline Support: Add comprehensive support for outline-style highlighting across all geometry types.
    Improved Primitive Support: Better handling of GroundPrimitives with proper position extraction.
    Efficient Property Cloning: Properly preserve important properties from source geometries like heightReference and classificationType.

  - Internal Improvements
    Simplified State Management: Remove the need to track active highlights with a Set.
    Direct Entity Access: Add a highlightEntity getter for direct access to the highlight entity.
    Better Instance Management: More robust multiton pattern implementation with proper cleanup.
    Optimized Reuse: The single entity is reused for all geometry types by selectively applying only the needed properties.

- 629c89b: Update Test Settings

  test: Update mocks and tests

  - Add EntityCollection mock.
    Add new mock for EntityCollection combined to the viewer mock.

  - Update test for Highlight to reflect the recent changes.

## 0.0.12

### Patch Changes

- ce258dd: Refactor Methods

  refactor: Update class methods

  - Rename methods.
    Replace `clear`, `clearAll` with `remove`, `removeAll.

  - Consolidate methods.
    Merge `_highlightGroundPrimitive` and `_highlightEntity` into a single overrided method `_createEntity`.

  - Add `outline` styling option.
    Support highlights with outline style.

  - Assign identifiers to the highlight entities.
    Fundamental tasks for caching strategy.

- b24419b: Simplify Class

  fix: Simplify class to use single type of collection

  - Remove internal `Primitive` collection.
    Replace highlight object to be type of `Entity`.
    Replace `GroundPrimitive` instances logics with `Entity`.

  - Replace viewer identifier.
    Use DOM element, the container of viewer instance as an identifier of the viewer.

  - Update viewer mock to have container property.

  - Update test to match fixed class.

- dc23c7c: Highlight Feature Update

  feat: Add new highlight feature

  - New `Highlight` class for highlighting objects.
    A multiton class that supports multi-viewer situation.
    Handles mainly the object returned from `scene.pick()` or `drillPick()`.

  - Fix mocks for tests.
    Extend viewer mock to have collections. (primitives, entities, groundPrimives)
    Add a simple collection mock.

  - New test conducted for `Highlight`.
    In Progress.

## 0.0.11

### Patch Changes

- 6857423: Update Mocks and Structure

  refactor: Update test mocks and project structure

  - Re-position `sync-camera` file.

  - Update mocks for cesium.
    Add helper function for type assertion.
    Rename merge utility function.
    Support more instances.

- 42ebf00: Update Visualizer

  refactor: Update terrain visualizer

  - Rename private member `_hybridTerrain` as `_terrainProvider`.

  - Add getters for private members `_colors` and `_terrainProvider`.

  - Remove unused parameter from `ConstructorOptions`.

- 8edc7a8: Minor Fixes on a test

  test: Minor fix

  - Fix type assertion of mocked `Viewer` element.

  - Add mock cleanup stage.

- 201aeb4: Update Test Environments

  test: Update test environment

  - Change test environment as "jsdom" from "node".
    Add jsdom package.
    Specify environment as jsdom in vite configuration.

  - Create mock for cesium elements.
    Exclude `__mocks__` directory from test coverage.
    Create mock cesium.

  - Conduct a new test case for `cloneViewer`.

## 0.0.10

### Patch Changes

- 97c7cc4: Test Coverage Improvement

  test: Improve coverage

  - Add test case for available terrain provider with availability.

  - Comment annotation to ignore line 207.
    Common limitation for coverage tools to examine async functions.

- 4845d5c: Fix Hybrid Terrain Provider

  fix: Fix constructor parameter

  - Receive an array of TerrainArea itself, not the ConstructorOptions.

- 0ecfe62: New Test Conducted

  test: Add new test for hybrid terrain provider

  - Remove redundant function `createOverlay`.

  - Create test file for HybridTerrainProvider class.

- 657be9d: Refactor Class

  refactor: Fix types for terrain provider options

  - Remove static method `create`.
    There is no reason to handle the terrain url directly in this class.

## 0.0.9

### Patch Changes

- c764339: Republish with fixed eslint configuration

  - 320ac32: Refactoring Classes

    refactor: Rename class

    - Rename `TerrainAreas` as `TerrainAreaCollection`.
      The class provides collection-like methods, so renamed it to be more consistent.

    - Rename the member `_provider` as `_terrainProvider` of `TerrainArea`.
      To have more aligned form of variables.

    - Update Documents.
      Some of the existing documents were incompatible with the code.

  - d365e5e: New Test for TerrainArea

    test: Add test for terrain area class

    - Conduct new test for terrain area class.

    - A function that detects area with a rectangle has been disabled.

    - Fix test description for `TerrainAreaCollection`.

## 0.0.8

### Patch Changes

- 8ffe842: Remove Redundant Type

  - refactor: Remove `TileRanges`

- 4d59191: Update TerrainAreas class

  test: Add new test for TerrainAreas class

  refactor: Update overloaded class methods

  - `add` and `remove` method now supports multiple input.

  - `remove` method now returns `this` to support chaining.

  - Rename `clear` as `removeAll`.

- b81f7d3: Remove Redundant Method

  refactor: Remove `configureAvailability`

- 3608c07: Separate Utility Function

  refactor: Move rectangle calculation function

- a7dd9b6: Remove Redundant Class

  refactor: Remove terrain bounds class

  - Remove `TerrainBounds`.
    Now doing proper delegation rather than modifying internals. (was modifying private member)

  - Stricter checks for terrain areas.

  - Fix others according to the deletion and refactoring.

## 0.0.7

### Patch Changes

- e4965c3: Type Check Utility Test

  test: Add test for `isGetterOnly` utility function.

- 4b17141: Establish New Test

  test: Add test for syncCamera utility function.

- 1163dae: Fix Package Exports

  fix: Add missing export from the latest release

  - Include `isGetterOnly`.

- 11d2782: Refactor Collection

  refactor: Simplify names of collection methods

  - New Functionality

  1. Iterator Support
     Now supports iterator protocol.

  2. Expand Standard Array API
     Add `map`, `find`.

  - API Streamlining:
    Shorter, more intuitive method names. (`contains`, `get`, `first`, `update`)
    Consistent parameter naming with `by` for tag-based operations.
    Naming consistency with `from`/`to` in update().

  - Consistent return type to support chaining
    Visibility operations (show, hide, toggle) now return this for chaining.
    setProperty returns this instead of count for consistent pattern.

## 0.0.6

### Patch Changes

- 8899394: Fix Collection

  fix: Fix bugs found by newly established test

  - `values`:
    The Collection class cannot invalidate cache when the base collection has changed.
    `values` now returns values directly, not referring cache.

  - `removeByTag`:
    Fix inconsistent return value.

  - `setProperty`:
    Fix invalid type inference using new utility function `isGetterOnly`.
    It now throws an error on accessing readonly value.

  refactor: Restructure exports and add new utility type

  - Group exports, and export with `type`.
    as is: `export { ... }`
    to be: `export type { ... }`

  - New utility type `NonFunction`.

- 8899394: Update Utility Function

  feat: Add new utility function for type-checks

  - New utility function `isGetterOnly`.
    A runtime readonly property detector for an object.

- 8899394: Update Collection Test

  test: Expand coverage for collection class

  - Now the test covers all of the collection class.

## 0.0.5

### Patch Changes

- a030a76: Restructure browser compatibility tests

  test: Restructure require and import tests

  - Use vitest to test.

  - Move tests directory under src in order to be covered by `tsconfig.json`.

- a030a76: Bug Fix

  fix: Add unit test and fix problems of collection

  - Fix `add()` for multiple items to have proper tag.
    Assigning input tag was missing when the input item is an array.

  - Fix type handling of `remove()`.
    Receive normal type (not internally defined `I & WithTag`), and convert it internally.

  - Fix usage of `Object.defineProperty` in `updateTag()`.
    Change form of parameter for `Object.defineProperty`.

- a030a76: Configure Test Environment

  feat: Configure test environment with vitest

  - `.gitignore`: Ignore `coverage` directory generated by tests.

  - `eslint.config.js`: Rename `tsparser` as `tsParser` to avoid spell check.

  - Add packages and fix scripts for testing.
    Add `vitest`, `@vitest/coverage-v8`.
    Change `test` script to use `vitest`.

  - `tsconfig.json`: Include every `.ts` and `.js` files.

  - `vite.config.js`: Add configuration options for tests.

- a030a76: Unit Test for Collection

  test: Add unit test for collection

  - Needs to be completed.

- a030a76: Move demonstration files

  chore: Move files for demonstration

  - Move serve targets of vite for demonstration.
    Move from under tests to demo.

## 0.0.4

### Patch Changes

- a3c5724: Update Configurations

  build: Update build configurations

  - Fix entries for modular supports.

- 988e1c2: Restructure project

  refactor: Restructure project

- 5fb3f07: Restructure entries

  refactor: Restructure entries

  - Fix entries (index files)
    Use named exports instead of wildcard exports (`*`).
    Avoid import from index entries.
    Clarify `type` exports.

- a1fcd36: Shorten codes

  refactor: Shorten expressions with nullish coalescing operator

- 74cbd2b: Rewrite require-import tests

  test: Update import-require tests

  - Restructure test paths.
  - Now test every exports from this package.

## 0.0.3

### Patch Changes

- 34aa9b3: Refactor and Restructure

  refactor: Refactor and restructure

  - Refactor `Collection` class.
    Now the `Collection` class is not abstract.
    A class does not need further implementation should use the class directly.

  - Restructure organization of `utils` directory.
    Add several depths.

- ac3767a: Documentation Updates

  docs: Fix documentation

  - Add description for `getTileDataAvailable`.

  - Fix annotation for terrain bounds documentation.

  - Fix `clean` script
    Now the script does not clean up the `docs` directory.

- b1c552e: Update tsconfig

  ci: Update husky git hooks

  - Build script executes before test

  build: Add paths option for tsconfig

## 0.0.2

### Patch Changes

- 12f022e: Fixed workflow tests

  ci: Fix workflows

  - Remove deploy-docs actions.

  - Integrate GitHub Page deployment into release-and-publish action.
    Test required.

## 0.0.1

### Patch Changes

- 3ce50f0: Initial Release
