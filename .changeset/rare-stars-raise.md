---
"@juun-roh/cesium-utils": patch
---

Republish with fixed eslint configuration

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
