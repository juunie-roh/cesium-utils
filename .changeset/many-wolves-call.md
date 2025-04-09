---
"@juun_roh/cesium-utils": patch
---

Updates

feat: Replace boundaries with tile coordinates layer

* Add `_tileCoordinatesLayer` to handle `TileCoordinatesImagery` instance.
   Tile boundaries will show up by the imagery layer.
   (outline property is unable to use with clamp-to-ground)

* Fix coloring method of each tiles in `getTileColor`.
   `forEach` doesn't return properly.

* Rename methods and members.
   Since boundary-related methods has been replaced, simplified names.

refactor: Add internal class, rename member, fix method

* Internal `TerrainAreaCollection` class to provide:
   An array of `TerrainArea` by calling itself.
   Utility functions as methods.

* Rename `_defaultProvider` as `_terrainProvider`.
* Fix `requestTileGeometry` to return undefined correctly.

refactor: Separate test codes with default viewer settings
refactor: Remove redundant method, redefine type with Awaited

* Remove `ensureReady` method.
* Fix type definitions with `Promise`s to have proper resolved types using `Awaited` utility type.

refactor: Calculate the largest rectangle from max to min levels
