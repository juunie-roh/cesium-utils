---
"@juun_roh/cesium-utils": patch
---

feat: Redefine types, add overload for `removeByTag` function

* Fix types, now adds tag into the item using `Object.defineProperty`.
* Fix `add` function to recursively call itself, simplifying the code sturcture.
* Add overloads for `removeByTag` method. It now support mutiple tags removal.

feat: Add hybrid terrain provider feature

* `TerrainBounds` class:
Defines the geographic boundaries for a terrain area and handles tile availability checks.

* `TerrainArea` class:
Represents a geographic area with a specific terrain provider.

* `HybridTerrainProvider` class:
Provides terrain by delegating requests to different terrain providers
based on geographic regions and zoom levels.

* `TerrainVisualizer` class:
A class for debugging `HybridTerrainProvider`. It shows which area is provided by which provider.
