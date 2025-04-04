---
"@juun_roh/cesium-utils": patch
---

Refactor and bug fixes

refactor: Reconstructed terrain visualizer

* Expand namespace
Now supports `createRectangle`, `visualize` features from the namespace `TerrainVisualizer`.

* Add getters for private members.
* Add documentations.

fix: Fix inconsistent return value

* Corrected the handling method of overloaded `removeByTag` method.

refactor(types): Redefined tile range type

* Redefined `TileRanges` type, separated with `TileRange`.

chore: Fix typo (tilinghScheme)