---
"@juun-roh/cesium-utils": patch
---

Refactor Region Detection

refactor: Update terrain region detection

- Added `HybridTerrainProvider.TerrainRegion.contains()` public utility function for checking if a region contains a tile
- Refactored `HybridTerrainProvider._regionContains()` to delegate to the new public API
- Updated `TerrainVisualizer._getTileColor()` to use the proper public API instead of accessing private methods
- Updated unit tests
