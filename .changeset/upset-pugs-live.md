---
"@juun-roh/cesium-utils": patch
---

Directory Consistency and TerrainArea Removal

refactor: Fix directory structure and remove deprecated class

* Move from `utils` to `dev` in order to avoid confusion.

* Remove deprecated `TerrainArea` class - users should migrate to `HybridTerrainProvider.TerrainRegion`.

* Update TerrainVisualizer to work with `HybridTerrainProvider.TerrainRegion` interface.

* Fix all remaining references to the deleted TerrainArea class throughout the codebase.
