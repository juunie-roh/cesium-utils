# @juun-roh/cesium-utils

## 0.3.2

### Patch Changes

- 42ec5d1: Refactoring class method

  refactor: Break down methods into several parts

  - Separated heavily concentrated methods to improve readability.

- 6569d55: Re-ordering code

  style: Standardize code ordering

  - Consistent ordering of class members and methods
  - Standardized import/export organization
  - Applied uniform code structure across files

## 0.3.1

### Patch Changes

- 93443d2: Improve Sunlight debug visualization and memory efficiency

  feat: Add sunlight debug visualization logic

  - **Ray Visualization**: Add `debugShowRays` option to visualize sunlight ray paths as yellow semi-transparent polylines from virtual sun position to analysis point. Complements existing `debugShowPoints` collision visualization.
  - **Debug Entity Storage**: Replace entity instance storage with ID-based tracking to reduce memory overhead and eliminate stale references. Debug entities are now tracked using `_debugEntityIds: string[]` instead of `_debugEntities: Entity[]`.
  - **Improved Cleanup Logic**: Simplify debug entity cleanup by leveraging Cesium's `removeById()` method, removing the need for existence checks and reducing cleanup complexity.
  - **Test Coverage Updates**: Update test suite to validate ID-based entity tracking, new debug ray visualization, and improved object exclusion handling for ray picking operations.

## 0.3.0

### Minor Changes

- 9494eec: Add experimental Sunlight analysis for shadow calculations

  feat: Add experimental sunlight class for shadow detection

  - **⚠️ Experimental**: Uses Cesium internal APIs that may change in future versions
  - Added `Sunlight` class via `@juun-roh/cesium-utils/experimental/sunlight`
  - Supports single-time and time-range shadow analysis
  - Includes debug visualization and object exclusion options

### Patch Changes

- 1c89a05: Add package json export paths

  build: Add package json export paths

- 28efe2e: Update Configurations

  fix: Update build and document configurations

## 0.2.7

### Patch Changes

- b069bb7: docs: Update README.md to be more technical

  Fix Collection.setProperty JSDoc parameter order and example to match implementation

## 0.2.6

### Patch Changes

- 9e11a80: Revert Latest Update

  revert: Revert recent update, need more research

  - The `requestTileGeometry` needs more research to enable overriding zoom levels.

## 0.2.5

### Patch Changes

- abd8b5e: Update HybridTerrainProvider Tile Request Logic

  fix: Fix HybridTerrainProvider requestTileGeometry logic to continue searching when providers have no data

  - Fixed `requestTileGeometry()` to continue searching through regions when a provider returns `getTileDataAvailable() = false`, allowing higher zoom level regions to override lower zoom level regions within the same geographic bounds
  - Added comprehensive tests covering the new fallback behavior for tile geometry requests

## 0.2.4

### Patch Changes

- 9468bfa: Update HybridTerrainProvider Tile Availability Logic

  fix: Fix HybridTerrainProvider tile availability logic and add terrain type exports

  - Fixed `getTileDataAvailable()` to continue searching through regions when a provider returns `false`, allowing higher zoom level regions to override lower zoom level regions within the same geographic bounds
  - Added direct type exports for `TerrainTiles`, `TerrainRegion`, and `TerrainOptions` to improve developer experience

## 0.2.3

### Patch Changes

- c4f35fe: docs: Improve discoverability with seo optimization

  **This release contains no API changes - purely documentation and metadata improvements for better discoverability.**

  ### Documentation Updates

  - **README**: Restructured with problem-first approach, featuring immediate code examples for common Cesium.js challenges
  - **package.json**: Updated description and keywords to target specific developer search terms
  - **Examples**: Added concrete usage examples for HybridTerrainProvider, Collection tagging, and entity highlighting

  ### Targeted Keywords

  Now optimized for developers searching for:

  - Multiple terrain sources in Cesium.js
  - Entity collection tagging and filtering
  - Visual highlighting systems
  - Hybrid terrain providers

  These changes aim to help developers discover the library when searching for solutions to common Cesium.js development challenges, without affecting any existing functionality.

## 0.2.2

### Patch Changes

- fd81aca: Type Safety

  fix(type): Enhance type safety

  - Improved Collection class generic type constraints to enforce proper collection-item type relationships.

- 6e167a4: feat: Add runtime deprecation warning system

  - **New Deprecation Utility**: Introduce `Deprecate` namespace with comprehensive deprecation management tools.

    The new `Deprecate` namespace provides:

    - `Deprecate.warn()` - Shows runtime deprecation warnings with configurable options
    - `Deprecate.deprecate()` - Wraps functions with automatic deprecation warnings
    - `Deprecate.clear()` - Clears warning history (useful for testing)
    - `Deprecate.getWarningCount()` - Returns count of unique warnings shown
    - `Deprecate.hasShown()` - Checks if specific warning was shown
    - `Deprecate.Options` - TypeScript interface for warning configuration

  - **Enhanced Developer Experience**: Existing deprecated APIs now show runtime warnings to help developers identify and migrate away from deprecated functionality.

    - `TerrainArea` constructor now shows deprecation warning on instantiation
    - `HybridTerrainProvider.computeRectangle()` shows warning when called
    - Both include removal version info (`v0.3.0`) and migration guidance

  - **Configurable Warning System**:
    - Once-only warnings by default (prevents spam)
    - Customizable prefixes and removal version info
    - Optional stack traces for debugging (enabled by default)
    - Environment variable control via `CESIUM_UTILS_DISABLE_DEPRECATION_WARNINGS`
    - Browser and Node.js compatibility with graceful fallbacks

  **Usage Examples:**

  ```typescript
  import { TerrainArea } from "@juun-roh/cesium-utils";
  import { Deprecate, deprecate } from "@juun-roh/cesium-utils/utils";

  // Automatic warning when using deprecated APIs
  const area = new TerrainArea({
    /* ... */
  });
  // Console: "[DEPRECATED] TerrainArea is deprecated. Use HybridTerrainProvider.TerrainRegion instead. This feature will be removed in v0.3.0."

  // Wrap your own deprecated functions (development/testing use)
  const myOldFunction = deprecate(
    () => "legacy implementation",
    "myOldFunction() is deprecated. Use myNewFunction() instead."
  );

  // Control deprecation behavior (development/testing use)
  Deprecate.warn("Custom deprecation message", {
    removeInVersion: "v2.0.0",
    includeStack: true,
  });

  Deprecate.clear(); // Reset for testing
  console.log(Deprecate.getWarningCount()); // Get warning statistics
  ```

  **Migration Impact**: This is a non-breaking change that enhances the existing deprecation system with runtime warnings.
  Existing deprecated APIs maintain their functionality while providing better user feedback.

  **New Exports**:

  - `Deprecate` namespace (available via `@juun-roh/cesium-utils/utils`)
  - `deprecate` function (available via `@juun-roh/cesium-utils/utils`)

  **Note**: The deprecation utilities are intentionally not exported from the main package entry point,
  as they are primarily intended for development and testing purposes.
  They remain accessible through the utils module for users who need to wrap their own deprecated functions.

- 1baf2a1: Directory Consistency and TerrainArea Removal

  refactor: Fix directory structure and remove deprecated class

  - Move from `utils` to `dev` in order to avoid confusion.

  - Remove deprecated `TerrainArea` class - users should migrate to `HybridTerrainProvider.TerrainRegion`.

  - Update TerrainVisualizer to work with `HybridTerrainProvider.TerrainRegion` interface.

  - Fix all remaining references to the deleted TerrainArea class throughout the codebase.

## 0.2.1

### Patch Changes

- bd2ecec: Refactor HybridTerrainProvider

  refactor: Simplify class configurations

  - **Simplified Configuration**: Reduced from 3 concepts (`HybridTerrainProvider`, `TerrainArea`, `TileRange`) to 1 main concept

  - **Deprecated**: `TerrainArea`.

  **NOTE**: Deprecated classes will be deleted on next minor update.

  - Migration Examples:

  Before:

  ```typescript
  // Complex setup with multiple concepts
  const tileRanges = new Map<number, TerrainArea.TileRange>();
  tileRanges.set(15, {
    start: { x: 55852, y: 9556 },
    end: { x: 55871, y: 9575 },
  });

  const area = new TerrainArea({
    terrainProvider: customProvider,
    tileRanges,
  });

  const hybridTerrain = new HybridTerrainProvider({
    terrainAreas: [area],
    terrainProvider: worldTerrain,
  });
  ```

  After:

  ```typescript
  // Simple rectangle-based regions
  const hybridTerrain = new HybridTerrainProvider({
    regions: [
      {
        provider: customProvider,
        bounds: Rectangle.fromDegrees(-120, 30, -100, 50),
        levels: [10, 15], // optional
      },
    ],
    defaultProvider: worldTerrain,
  });
  // Or tile-coordinate based for precise control (multiple levels)
  const tileRanges = new Map();
  tileRanges.set(15, { x: [55852, 55871], y: [9556, 9575] });
  tileRanges.set(16, { x: [111704, 111742], y: [19112, 19150] });
  const hybridTerrain = new HybridTerrainProvider({
    regions: [
      {
        provider: customProvider,
        tiles: tileRanges,
      },
    ],
    defaultProvider: worldTerrain,
  });
  viewer.terrainProvider = hybridTerrain;
  ```

## 0.2.0

### Minor Changes

- 89969f8: API Reorganization and Import Optimization

  refactor: Namespace integration and import separation

  - Move `TerrainAreaCollection` into `TerrainArea` namespace as `TerrainArea.Collection`
    The standalone `TerrainAreaCollection` export has been removed. Users should now use `TerrainArea.Collection` instead.

    ```typescript
    // Before
    import { TerrainAreaCollection, TerrainArea } from "@juun-roh/cesium-utils";
    const areas = new TerrainAreaCollection();

    // After
    import { TerrainArea } from "@juun-roh/cesium-utils";
    const areas = new TerrainArea.Collection();
    ```

  - **Improved TypeDoc organization**: Related functionality is now properly grouped under class namespaces:

    - TerrainArea.ConstructorOptions
    - TerrainArea.fromUrl()
    - TerrainArea.Collection

  - **Import separation for future compatibility**: Separate type imports from instance imports across all modules to prepare for potential Cesium modular exports and improve tree-shaking.

  ```typescript
  // Type imports - compile-time only
  import type { Credit, Request, TerrainProvider } from "cesium";
  // Instance imports - runtime dependencies
  import { EllipsoidTerrainProvider, Rectangle } from "cesium";
  ```

  - **Consistent namespace pattern**: Establishes uniform API organization across the library (Collection.Tag, Highlight.Options, TerrainArea.Collection, etc.)
  - **Better bundle optimization**: Type-only imports don't affect bundle size and prepare the library for future Cesium architectural changes.

## 0.1.3

### Patch Changes

- 35fc8f3: Test Expansion

  test: Test expansion

  - Add object tracking optimization tests for both `SurfaceHighlight` and `SilhouetteHighlight`.

  - Add return type test for `Collection`.

- 94ac8a5: Highlight Performance Optimization

  fix: Eliminate flickering and delay in mouse movement highlighting

  - Add object tracking to both `SurfaceHighlight` and `SilhouetteHighlight` classes.
    The classes now track the currently highlighted object and options to prevent redundant geometry updates.

  - Skip geometry clearing and recreation when highlighting the same object with identical options.
    This eliminates the flickering effect during rapid mouse movements over the same entity.

  - Implement robust comparison of `HighlightOptions` including proper color equality checks.
    Handle edge cases with undefined colors and default values correctly.

  - Add proper cleanup of tracking state in `hide()` and `destroy()` methods.
    Clear tracking variables on error conditions to prevent stale state.

  - Add `currentObject` getter to both highlight classes for debugging and state inspection.

- 539d646: Update Return Values for Collection Methods

  refactor: Update return values

  - `Collection` class methods:
    `add`, `remove` methods now return `this`
    to support method chaining.

  - `TerrainAreaCollection` class methods:
    Likewise, `add` method now returns `this`.

## 0.1.2

### Patch Changes

- 59b41d0: Collection Caching Strategy Improvement

  perf: Improve caching strategy

  - Add event-driven caching strategy.
    The caching strategy takes advantage of
    Cesium collections' internal events,
    such as `collectionChanged` in `EntityCollection`.
    The cache will be created when the `values()` method is called,
    invalidated whenever the underlying collection event is provoked.

  - Remove the individual calls of `_invalidateCache`.
    This may be restored in the future, for the sake of defensive programming.

  - Add an instance clean up process.

  - Update test to cover newly implemented caching feature.

- c8605db: Collection Types Reorganization

  refactor: Collection types reorganization

  - `CesiumCollection`:
    Narrowed it down to 4 types from various collection types, since other items (such as `Billboard`, `Label`) are eventually added to `viewer.primitives`.

  - `Primitives`:
    Likewise, this type has expanded to contain more collection item types.

## 0.1.1

### Patch Changes

- 7ba085c: Bug Fix

  fix: Model entity highlight

  - Setting `entity.model.silhouetteColor` to `undefined` does not properly remove the applied silhouette color.
    Restore setting it from `undefined` to `Color.TRANSPARENT`.

## 0.1.0

### Minor Changes

- cd18941: Release 3D Object Highlight

  feat: 3d object highlight

  - Complete test on highlight class.
    3D Highlight supports:
    `Cesium3DTileFeature` which is returned by `scene.pick()` on `Cesium3DTileset` object.
    `Entity` with specified `model` property.
    3D Highlight supports outline style only.

  - Both surface and silhouette only supports single highlighting feature currently.

### Patch Changes

- e5c2741: Model Entity Highlight Test

  test: Add test for entity having model property

- cbc6828: Restore Commented-out Sections of Highlight Test

  test: Restore commented out sections

- faad8ee: Test Conducted for Silhouette Highlight

  test: Add new test for silhouette highlight

  - Add tests on class methods besides `show` Entity type.

  - Fix `hide` method
    From setting `entity.model.silhouetteColor` as `Color.TRANSPARENT` to `undefined`.

## 0.0.20

### Patch Changes

- 6ffa502: Bug Fix: Silhouette Highlight

  fix: Accessing wrong property for color setting

- b520c0e: Add Test Draft for Silhouette Highlight

  test: Add test draft

## 0.0.19

### Patch Changes

- 59f1c7a: 3D Tileset Highlight

  feat: Update silhouette highlight class

  - Apply overload on `show` method.
    Separate by object type.

  - Add silhouette composite color control.
    Need to be tested.

## 0.0.18

### Patch Changes

- 33b1f01: Fix Highlight Class

  fix: Update surface highlight

  - Integrate `color` into `options` parameter.
    Remove color parameter for `show` and `update`, since the class has and uses it's member `_color` as a default value.

  - Apply fixed height reference.
    Matching the name of the class(_surface_ highlight), the highlight entity now always clamp to ground.

  - Fix types.
    `HighlightOptions` now includes `color`.
    Fix `IHighlight` interface's `show` parameters.

  - Update others(test, ...) to follow the changes.

- 7008bcb: Fix Collection

  fix: Enhance type definition and error assertion

  - Fix value type from `V extends Exclude<I[K], Function>` to `I[K]`.

  - Improve clarity of the error message in `setProperty`.

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

  - Replace type of `instances` from `Map` to `WeakMap`.

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
    Merge `_highlightGroundPrimitive` and `_highlightEntity` into a single override method `_createEntity`.

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
    Extend viewer mock to have collections. (primitives, entities, groundPrimitives)
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
