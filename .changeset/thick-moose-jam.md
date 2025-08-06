---
"@juun-roh/cesium-utils": patch
---

Update HybridTerrainProvider Tile Availability Logic

fix: Fix HybridTerrainProvider tile availability logic and add terrain type exports

- Fixed `getTileDataAvailable()` to continue searching through regions when a provider returns `false`, allowing higher zoom level regions to override lower zoom level regions within the same geographic bounds
- Added direct type exports for `TerrainTiles`, `TerrainRegion`, and `TerrainOptions` to improve developer experience
