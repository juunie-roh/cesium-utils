---
"@juun_roh/cesium-utils": patch
---

Bug Fixes

fix: Fix errors occured from test

* Fix invalid `Object.defineProperty` to use proper property descriptor object. (Collection.add)
* Fix failure using spread operator against Set, use Array instead. (TerrainBounds._calculateRectangleFromTileRanges)
