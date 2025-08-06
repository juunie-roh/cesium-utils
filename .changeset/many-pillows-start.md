---
"@juun-roh/cesium-utils": patch
---

Update HybridTerrainProvider Tile Request Logic

fix: Fix HybridTerrainProvider requestTileGeometry logic to continue searching when providers have no data

- Fixed `requestTileGeometry()` to continue searching through regions when a provider returns `getTileDataAvailable() = false`, allowing higher zoom level regions to override lower zoom level regions within the same geographic bounds
- Added comprehensive tests covering the new fallback behavior for tile geometry requests
